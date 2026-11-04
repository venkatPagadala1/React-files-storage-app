CREATE TABLE IF NOT EXISTS workspace_folders (
  owner_uid TEXT NOT NULL,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id TEXT,
  color TEXT NOT NULL DEFAULT '#7c6cf2',
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (owner_uid, id),
  CONSTRAINT workspace_folders_parent_fk
    FOREIGN KEY (owner_uid, parent_id)
    REFERENCES workspace_folders (owner_uid, id)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS workspace_items (
  owner_uid TEXT NOT NULL,
  id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('note', 'file')),
  folder_id TEXT NOT NULL,
  title TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL DEFAULT '',
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  board_strokes JSONB NOT NULL DEFAULT '[]'::jsonb,
  mime_type TEXT,
  size BIGINT,
  storage_key TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (owner_uid, id),
  CONSTRAINT workspace_items_folder_fk
    FOREIGN KEY (owner_uid, folder_id)
    REFERENCES workspace_folders (owner_uid, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS workspace_items_folder_idx
  ON workspace_items (owner_uid, folder_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS sticky_tasks (
  owner_uid TEXT NOT NULL,
  id TEXT NOT NULL,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT FALSE,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (owner_uid, id)
);

CREATE TABLE IF NOT EXISTS user_migrations (
  owner_uid TEXT PRIMARY KEY,
  legacy_import_completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS account_data (
  owner_uid TEXT NOT NULL,
  data_key TEXT NOT NULL CHECK (data_key IN ('profile', 'calendar', 'whiteboard')),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (owner_uid, data_key)
);
