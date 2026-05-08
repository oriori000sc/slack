import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export function openDb(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  return db;
}

export function initSchema(db, schemaSql) {
  db.exec(schemaSql);
}

export function nowUnix() {
  return Math.floor(Date.now() / 1000);
}

export function setMeta(db, key, value) {
  db.prepare(
    "INSERT INTO app_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
  ).run(key, value);
}

export function getMeta(db, key) {
  const r = db.prepare("SELECT value FROM app_meta WHERE key=?").get(key);
  return r?.value ?? null;
}
