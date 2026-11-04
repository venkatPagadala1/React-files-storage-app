import express from "express";
import multer from "multer";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = "demo-vsr-workspace";
const port = 8787;

if (process.env.NODE_ENV === "production") {
  throw new Error("The in-memory emulator API must never run in production.");
}
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.GCLOUD_PROJECT = projectId;

initializeApp({ projectId });

const app = express();
const users = new Map();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1 } });

function stateFor(uid) {
  if (!users.has(uid)) {
    users.set(uid, {
      folders: new Map(),
      items: new Map(),
      tasks: new Map(),
      accountData: new Map(),
      files: new Map(),
      legacyImportCompleted: false,
    });
  }
  return users.get(uid);
}

function defaultFolders(state) {
  const defaults = [
    ["folder-interview-prep", "Interview Preparation", "#7c6cf2"],
    ["folder-study-notes", "Study Notes", "#22a996"],
    ["folder-project-plans", "Project Plans", "#e5a84b"],
    ["folder-resources", "Resources", "#e87991"],
  ];
  defaults.forEach(([id, name, color], order) => {
    if (!state.folders.has(id)) state.folders.set(id, { id, name, parentId: null, color, order });
  });
}

function validItem(item) {
  return item && typeof item.id === "string" && ["note", "file"].includes(item.kind) &&
    typeof item.folderId === "string" && typeof item.title === "string" && item.title.trim();
}

function mapItem(state, item) {
  const storedFile = state.files.get(item.id);
  return {
    ...item,
    topics: Array.isArray(item.topics) ? item.topics : [],
    boardStrokes: Array.isArray(item.boardStrokes) ? item.boardStrokes : [],
    hasFile: Boolean(storedFile),
    ...(storedFile ? { mimeType: storedFile.mimeType, size: storedFile.buffer.length } : {}),
    blob: undefined,
  };
}

app.disable("x-powered-by");
app.use((request, response, next) => {
  const origin = request.get("origin");
  if (origin && /^http:\/\/(localhost|127\.0\.0\.1):\d{1,5}$/.test(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.setHeader("Cache-Control", "private, no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (request.method === "OPTIONS") return response.sendStatus(204);
  next();
});
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_request, response) => response.json({ status: "ok", mode: "local-emulator" }));

app.use("/api", async (request, response, next) => {
  const token = request.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return response.status(401).json({ error: "Sign in with the local Auth Emulator first." });
  try {
    const decoded = await getAuth().verifyIdToken(token);
    request.ownerUid = decoded.uid;
    request.userState = stateFor(decoded.uid);
    next();
  } catch {
    response.status(401).json({ error: "The local Auth Emulator token is invalid or expired." });
  }
});

app.get("/api/workspace", (request, response) => {
  defaultFolders(request.userState);
  response.json({
    folders: [...request.userState.folders.values()],
    items: [...request.userState.items.values()].map((item) => mapItem(request.userState, item)),
  });
});

app.post("/api/folders", (request, response) => {
  const folder = request.body;
  if (!folder?.id || !folder.name?.trim()) return response.status(400).json({ error: "Folder data is invalid." });
  request.userState.folders.set(folder.id, folder);
  response.status(201).json({ folder });
});

app.put("/api/folders/bulk", (request, response) => {
  for (const folder of request.body.folders ?? []) {
    if (!folder?.id || !folder.name?.trim()) return response.status(400).json({ error: "Folder data is invalid." });
    request.userState.folders.set(folder.id, folder);
  }
  response.json({ ok: true });
});

app.delete("/api/folders", (request, response) => {
  const ids = Array.isArray(request.body?.ids) ? request.body.ids : [];
  for (const id of ids) {
    request.userState.folders.delete(id);
    for (const [itemId, item] of request.userState.items) {
      if (item.folderId === id) {
        request.userState.items.delete(itemId);
        request.userState.files.delete(itemId);
      }
    }
  }
  response.sendStatus(204);
});

app.put("/api/items", (request, response) => {
  const item = request.body;
  if (!validItem(item)) return response.status(400).json({ error: "Document data is invalid." });
  request.userState.items.set(item.id, { ...item, blob: undefined });
  response.json({ ok: true });
});

app.delete("/api/items/:id", (request, response) => {
  request.userState.items.delete(request.params.id);
  request.userState.files.delete(request.params.id);
  response.sendStatus(204);
});

app.put("/api/items/:id/file", upload.single("file"), (request, response) => {
  const item = request.userState.items.get(request.params.id);
  if (!item || item.kind !== "file") return response.status(404).json({ error: "File not found." });
  if (!request.file) return response.status(400).json({ error: "Choose a file to upload." });
  request.userState.files.set(item.id, {
    buffer: request.file.buffer,
    mimeType: request.file.mimetype || "application/octet-stream",
    title: request.file.originalname,
  });
  item.title = request.file.originalname;
  item.mimeType = request.file.mimetype || "application/octet-stream";
  item.size = request.file.size;
  response.json({ ok: true });
});

app.get("/api/items/:id/file", (request, response) => {
  const file = request.userState.files.get(request.params.id);
  if (!file) return response.status(404).json({ error: "File content is missing." });
  response.type(file.mimeType).send(file.buffer);
});

app.get("/api/tasks", (request, response) => {
  response.json({ tasks: [...request.userState.tasks.values()] });
});

app.put("/api/tasks/:id", (request, response) => {
  const task = request.body;
  if (!task?.title?.trim()) return response.status(400).json({ error: "Task data is invalid." });
  request.userState.tasks.set(request.params.id, { ...task, id: request.params.id, title: task.title.trim() });
  response.json({ ok: true });
});

app.delete("/api/tasks/:id", (request, response) => {
  request.userState.tasks.delete(request.params.id);
  response.sendStatus(204);
});

app.get("/api/account-data/:key", (request, response) => {
  if (!["profile", "calendar", "whiteboard"].includes(request.params.key)) {
    return response.status(404).json({ error: "Account data was not found." });
  }
  response.json({ data: request.userState.accountData.get(request.params.key) ?? null });
});

app.put("/api/account-data/:key", (request, response) => {
  if (!["profile", "calendar", "whiteboard"].includes(request.params.key)) {
    return response.status(404).json({ error: "Account data was not found." });
  }
  const data = request.body?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return response.status(400).json({ error: "Account data must be a JSON object." });
  }
  if (Buffer.byteLength(JSON.stringify(data), "utf8") > 5 * 1024 * 1024) {
    return response.status(413).json({ error: "Account data exceeds the 5 MB limit." });
  }
  request.userState.accountData.set(request.params.key, data);
  response.json({ ok: true });
});

app.get("/api/migrations/status", (request, response) => {
  response.json({ completed: request.userState.legacyImportCompleted });
});

app.post("/api/migrations/import", (request, response) => {
  if (request.userState.legacyImportCompleted) return response.status(409).json({ error: "This browser import was already completed." });
  for (const folder of request.body.folders ?? []) request.userState.folders.set(folder.id, folder);
  for (const item of request.body.items ?? []) {
    if (!validItem(item)) return response.status(400).json({ error: "Document data is invalid." });
    request.userState.items.set(item.id, item);
  }
  for (const task of request.body.tasks ?? []) request.userState.tasks.set(task.id, task);
  response.json({ ok: true });
});

app.post("/api/migrations/complete", (request, response) => {
  request.userState.legacyImportCompleted = true;
  response.json({ ok: true });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(Number.isInteger(error.status) ? error.status : 500).json({
    error: Number.isInteger(error.status) ? error.message : "The local emulator API could not complete that request.",
  });
});

app.listen(port, "127.0.0.1", () => {
  console.log(`LOCAL ONLY: emulator API listening at http://127.0.0.1:${port} for ${projectId}. Data is in memory and clears when this process stops.`);
});
