import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import express from "express";
import multer from "multer";
import pg from "pg";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 8080);
const databaseUrl = process.env.DATABASE_URL;
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

if (!databaseUrl) throw new Error("DATABASE_URL is required.");
if (!firebaseProjectId) throw new Error("FIREBASE_PROJECT_ID is required.");

initializeApp({
  credential: applicationDefault(),
  projectId: firebaseProjectId,
});

const pool = new Pool({
  connectionString: databaseUrl,
  max: Number(process.env.DB_POOL_MAX || 5),
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});

const objectStorageConfigured = Boolean(
  process.env.OBJECT_STORAGE_ENDPOINT &&
  process.env.OBJECT_STORAGE_BUCKET &&
  process.env.OBJECT_STORAGE_ACCESS_KEY_ID &&
  process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY,
);
const s3 = objectStorageConfigured
  ? new S3Client({
      endpoint: process.env.OBJECT_STORAGE_ENDPOINT,
      region: process.env.OBJECT_STORAGE_REGION || "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY_ID,
        secretAccessKey: process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY,
      },
    })
  : null;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
});

const schemaPath = fileURLToPath(new URL("./schema.sql", import.meta.url));
const schemaSql = await readFile(schemaPath, "utf8");
await pool.query(schemaSql);

app.disable("x-powered-by");
app.use((request, response, next) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
  const origin = request.get("origin");
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Credentials", "true");
  }
  response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (request.method === "OPTIONS") return response.sendStatus(204);
  next();
});
app.use(express.json({ limit: "10mb" }));

app.get("/healthz", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    response.json({ status: "ok" });
  } catch {
    response.status(503).json({ status: "unavailable" });
  }
});

async function requireFirebaseUser(request, response, next) {
  const match = request.get("authorization")?.match(/^Bearer\s+(.+)$/i);
  if (!match) return response.status(401).json({ error: "Sign in to continue." });
  try {
    const decodedToken = await getAuth().verifyIdToken(match[1]);
    request.ownerUid = decodedToken.uid;
    next();
  } catch {
    response.status(401).json({ error: "Your session expired. Sign in again." });
  }
}

app.use("/api", requireFirebaseUser);
app.use("/api", (_request, response, next) => {
  response.setHeader("Cache-Control", "private, no-store");
  next();
});

const accountDataKeys = new Set(["profile", "calendar", "whiteboard"]);

app.get("/api/account-data/:key", async (request, response, next) => {
  try {
    if (!accountDataKeys.has(request.params.key)) {
      return response.status(404).json({ error: "Account data was not found." });
    }
    const result = await pool.query(
      "SELECT data FROM account_data WHERE owner_uid = $1 AND data_key = $2",
      [request.ownerUid, request.params.key],
    );
    response.json({ data: result.rows[0]?.data ?? null });
  } catch (error) {
    next(error);
  }
});

app.put("/api/account-data/:key", async (request, response, next) => {
  try {
    if (!accountDataKeys.has(request.params.key)) {
      return response.status(404).json({ error: "Account data was not found." });
    }
    const data = request.body?.data;
    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      return response.status(400).json({ error: "Account data must be a JSON object." });
    }
    const serialized = JSON.stringify(data);
    if (Buffer.byteLength(serialized, "utf8") > 5 * 1024 * 1024) {
      return response.status(413).json({ error: "Account data exceeds the 5 MB limit." });
    }
    await pool.query(
      `INSERT INTO account_data (owner_uid, data_key, data, updated_at)
       VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (owner_uid, data_key) DO UPDATE SET
         data = EXCLUDED.data, updated_at = NOW()`,
      [request.ownerUid, request.params.key, serialized],
    );
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

function mapFolder(row) {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    color: row.color,
    order: row.sort_order,
  };
}

function mapItem(row) {
  return {
    id: row.id,
    kind: row.kind,
    folderId: row.folder_id,
    title: row.title,
    purpose: row.purpose,
    content: row.content,
    topics: row.topics,
    boardStrokes: row.board_strokes,
    mimeType: row.mime_type,
    size: row.size === null ? undefined : Number(row.size),
    hasFile: Boolean(row.storage_key),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

function mapTask(row) {
  return {
    id: row.id,
    title: row.title,
    done: row.done,
    createdAt: Number(row.created_at),
  };
}

async function ensureDefaultFolders(ownerUid) {
  const defaultFolders = [
    ["folder-interview-prep", "Interview Preparation", "#7c6cf2"],
    ["folder-study-notes", "Study Notes", "#22a996"],
    ["folder-project-plans", "Project Plans", "#e5a84b"],
    ["folder-resources", "Resources", "#e87991"],
  ];
  for (const [id, name, color] of defaultFolders) {
    await pool.query(
      `INSERT INTO workspace_folders (owner_uid, id, name, color, sort_order)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (owner_uid, id) DO NOTHING`,
      [ownerUid, id, name, color, defaultFolders.findIndex((entry) => entry[0] === id)],
    );
  }
}

async function upsertFolder(client, ownerUid, folder) {
  if (!folder || typeof folder.id !== "string" || !folder.name?.trim()) {
    throw Object.assign(new Error("Folder data is invalid."), { status: 400 });
  }
  await client.query(
    `INSERT INTO workspace_folders (owner_uid, id, name, parent_id, color, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (owner_uid, id) DO UPDATE SET
       name = EXCLUDED.name, parent_id = EXCLUDED.parent_id,
       color = EXCLUDED.color, sort_order = EXCLUDED.sort_order`,
    [
      ownerUid,
      folder.id,
      folder.name.trim(),
      folder.parentId || null,
      typeof folder.color === "string" ? folder.color : "#7c6cf2",
      Number.isInteger(folder.order) ? folder.order : 0,
    ],
  );
}

async function upsertItem(client, ownerUid, item) {
  if (
    !item ||
    typeof item.id !== "string" ||
    !["note", "file"].includes(item.kind) ||
    typeof item.folderId !== "string" ||
    !item.title?.trim()
  ) {
    throw Object.assign(new Error("Document data is invalid."), { status: 400 });
  }
  await client.query(
    `INSERT INTO workspace_items (
       owner_uid, id, kind, folder_id, title, purpose, content, topics,
       board_strokes, mime_type, size, storage_key, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     ON CONFLICT (owner_uid, id) DO UPDATE SET
       kind = EXCLUDED.kind, folder_id = EXCLUDED.folder_id,
       title = EXCLUDED.title, purpose = EXCLUDED.purpose,
       content = EXCLUDED.content, topics = EXCLUDED.topics,
       board_strokes = EXCLUDED.board_strokes,
       mime_type = COALESCE(EXCLUDED.mime_type, workspace_items.mime_type),
       size = COALESCE(EXCLUDED.size, workspace_items.size),
       storage_key = COALESCE(EXCLUDED.storage_key, workspace_items.storage_key),
       updated_at = EXCLUDED.updated_at`,
    [
      ownerUid,
      item.id,
      item.kind,
      item.folderId,
      item.title.trim(),
      item.purpose === "training" ? "training" : "general",
      typeof item.content === "string" ? item.content : "",
      JSON.stringify(Array.isArray(item.topics) ? item.topics : []),
      JSON.stringify(Array.isArray(item.boardStrokes) ? item.boardStrokes : []),
      item.kind === "file" && typeof item.mimeType === "string" ? item.mimeType : null,
      item.kind === "file" && Number.isFinite(item.size) ? item.size : null,
      null,
      Number.isFinite(item.createdAt) ? item.createdAt : Date.now(),
      Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
    ],
  );
}

async function upsertTask(client, ownerUid, task) {
  if (!task || typeof task.id !== "string" || !task.title?.trim()) {
    throw Object.assign(new Error("Task data is invalid."), { status: 400 });
  }
  await client.query(
    `INSERT INTO sticky_tasks (owner_uid, id, title, done, created_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (owner_uid, id) DO UPDATE SET
       title = EXCLUDED.title, done = EXCLUDED.done`,
    [ownerUid, task.id, task.title.trim(), Boolean(task.done), Number(task.createdAt) || Date.now()],
  );
}

async function getOwnedFile(ownerUid, itemId) {
  const result = await pool.query(
    `SELECT storage_key, mime_type, title FROM workspace_items
     WHERE owner_uid = $1 AND id = $2 AND kind = 'file'`,
    [ownerUid, itemId],
  );
  return result.rows[0] ?? null;
}

async function deleteStoredFile(key) {
  if (!key || !s3) return;
  await s3.send(
    new DeleteObjectCommand({ Bucket: process.env.OBJECT_STORAGE_BUCKET, Key: key }),
  );
}

app.get("/api/workspace", async (request, response, next) => {
  try {
    await ensureDefaultFolders(request.ownerUid);
    const [folders, items] = await Promise.all([
      pool.query(
        "SELECT * FROM workspace_folders WHERE owner_uid = $1 ORDER BY sort_order, name",
        [request.ownerUid],
      ),
      pool.query(
        "SELECT * FROM workspace_items WHERE owner_uid = $1 ORDER BY updated_at DESC",
        [request.ownerUid],
      ),
    ]);
    response.json({ folders: folders.rows.map(mapFolder), items: items.rows.map(mapItem) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/folders", async (request, response, next) => {
  try {
    await upsertFolder(pool, request.ownerUid, request.body);
    response.status(201).json({ folder: request.body });
  } catch (error) {
    next(error);
  }
});

app.put("/api/folders/bulk", async (request, response, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SET CONSTRAINTS ALL DEFERRED");
    for (const folder of request.body.folders ?? []) {
      await upsertFolder(client, request.ownerUid, folder);
    }
    await client.query("COMMIT");
    response.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

app.delete("/api/folders", async (request, response, next) => {
  try {
    const ids = Array.isArray(request.body?.ids)
      ? request.body.ids.filter((id) => typeof id === "string")
      : [];
    if (!ids.length) return response.status(400).json({ error: "Folder IDs are required." });
    const files = await pool.query(
      `SELECT storage_key FROM workspace_items
       WHERE owner_uid = $1 AND folder_id = ANY($2::text[]) AND storage_key IS NOT NULL`,
      [request.ownerUid, ids],
    );
    for (const file of files.rows) await deleteStoredFile(file.storage_key);
    await pool.query(
      "DELETE FROM workspace_folders WHERE owner_uid = $1 AND id = ANY($2::text[])",
      [request.ownerUid, ids],
    );
    response.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

app.put("/api/items", async (request, response, next) => {
  try {
    await upsertItem(pool, request.ownerUid, request.body);
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/items/:id", async (request, response, next) => {
  try {
    const file = await getOwnedFile(request.ownerUid, request.params.id);
    if (file?.storage_key) await deleteStoredFile(file.storage_key);
    await pool.query(
      "DELETE FROM workspace_items WHERE owner_uid = $1 AND id = $2",
      [request.ownerUid, request.params.id],
    );
    response.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

app.put("/api/items/:id/file", upload.single("file"), async (request, response, next) => {
  try {
    if (!s3) throw Object.assign(new Error("File storage is not configured."), { status: 503 });
    const file = await getOwnedFile(request.ownerUid, request.params.id);
    if (!file) return response.status(404).json({ error: "File not found." });
    if (!request.file) return response.status(400).json({ error: "Choose a file to upload." });

    const key = `${request.ownerUid}/${request.params.id}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.OBJECT_STORAGE_BUCKET,
        Key: key,
        Body: request.file.buffer,
        ContentType: request.file.mimetype || "application/octet-stream",
      }),
    );
    await pool.query(
      `UPDATE workspace_items SET title = $3, mime_type = $4, size = $5,
       storage_key = $6, updated_at = $7 WHERE owner_uid = $1 AND id = $2`,
      [
        request.ownerUid,
        request.params.id,
        request.file.originalname,
        request.file.mimetype || "application/octet-stream",
        request.file.size,
        key,
        Date.now(),
      ],
    );
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/items/:id/file", async (request, response, next) => {
  try {
    if (!s3) throw Object.assign(new Error("File storage is not configured."), { status: 503 });
    const file = await getOwnedFile(request.ownerUid, request.params.id);
    if (!file?.storage_key) return response.status(404).json({ error: "File content is missing." });
    const object = await s3.send(
      new GetObjectCommand({ Bucket: process.env.OBJECT_STORAGE_BUCKET, Key: file.storage_key }),
    );
    response.setHeader("Content-Type", file.mime_type || "application/octet-stream");
    response.setHeader("Content-Disposition", "attachment");
    response.setHeader("Cache-Control", "private, no-store");
    object.Body.pipe(response);
  } catch (error) {
    next(error);
  }
});

app.get("/api/tasks", async (request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM sticky_tasks WHERE owner_uid = $1 ORDER BY created_at DESC",
      [request.ownerUid],
    );
    response.json({ tasks: result.rows.map(mapTask) });
  } catch (error) {
    next(error);
  }
});

app.put("/api/tasks/:id", async (request, response, next) => {
  try {
    await upsertTask(pool, request.ownerUid, { ...request.body, id: request.params.id });
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/tasks/:id", async (request, response, next) => {
  try {
    await pool.query(
      "DELETE FROM sticky_tasks WHERE owner_uid = $1 AND id = $2",
      [request.ownerUid, request.params.id],
    );
    response.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

app.get("/api/migrations/status", async (request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT legacy_import_completed_at FROM user_migrations WHERE owner_uid = $1",
      [request.ownerUid],
    );
    response.json({ completed: Boolean(result.rows[0]?.legacy_import_completed_at) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/migrations/import", async (request, response, next) => {
  const client = await pool.connect();
  try {
    const status = await client.query(
      "SELECT legacy_import_completed_at FROM user_migrations WHERE owner_uid = $1",
      [request.ownerUid],
    );
    if (status.rows[0]?.legacy_import_completed_at) {
      return response.status(409).json({ error: "This browser import was already completed." });
    }
    await client.query("BEGIN");
    await client.query("SET CONSTRAINTS ALL DEFERRED");
    for (const folder of request.body.folders ?? []) {
      await upsertFolder(client, request.ownerUid, folder);
    }
    for (const item of request.body.items ?? []) {
      await upsertItem(client, request.ownerUid, item);
    }
    for (const task of request.body.tasks ?? []) {
      await upsertTask(client, request.ownerUid, task);
    }
    await client.query("COMMIT");
    response.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

app.post("/api/migrations/complete", async (request, response, next) => {
  try {
    await pool.query(
      `INSERT INTO user_migrations (owner_uid, legacy_import_completed_at)
       VALUES ($1, NOW()) ON CONFLICT (owner_uid)
       DO UPDATE SET legacy_import_completed_at = NOW()`,
      [request.ownerUid],
    );
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error(error);
  if (response.headersSent) return response.end();
  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status === 500 ? "The server could not complete that request." : error.message;
  response.status(status).json({ error: message });
});

app.use((request, response) => {
  response.status(404).json({ error: `No route for ${request.method} ${path.basename(request.path)}.` });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Workspace API listening on ${port}.`);
});
