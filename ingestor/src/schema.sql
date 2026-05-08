PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_archived INTEGER DEFAULT 0,
  selected INTEGER DEFAULT 0,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  real_name TEXT,
  avatar_url TEXT,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS messages (
  channel_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  thread_ts TEXT NOT NULL,
  user_id TEXT,
  text TEXT,
  permalink TEXT,
  has_files INTEGER DEFAULT 0,
  edited_ts TEXT,
  is_deleted INTEGER DEFAULT 0,
  deleted_ts TEXT,
  raw_json TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  PRIMARY KEY(channel_id, ts)
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  message_ts TEXT NOT NULL,
  name TEXT,
  mimetype TEXT,
  size INTEGER,
  url_private TEXT,
  local_path TEXT,
  sha256 TEXT,
  is_deleted INTEGER DEFAULT 0,
  created_at INTEGER
);

CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts
USING fts5(text, channel_id UNINDEXED, ts UNINDEXED, thread_ts UNINDEXED);

CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
  INSERT INTO messages_fts(rowid, text, channel_id, ts, thread_ts)
  VALUES (new.rowid, coalesce(new.text,''), new.channel_id, new.ts, new.thread_ts);
END;

CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
  DELETE FROM messages_fts WHERE rowid = old.rowid;
  INSERT INTO messages_fts(rowid, text, channel_id, ts, thread_ts)
  VALUES (new.rowid, coalesce(new.text,''), new.channel_id, new.ts, new.thread_ts);
END;

CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
  DELETE FROM messages_fts WHERE rowid = old.rowid;
END;

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
