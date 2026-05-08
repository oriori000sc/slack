import fs from "node:fs";
import path from "node:path";
import boltPkg from "@slack/bolt";
const { App } = boltPkg;
import { openDb, initSchema, nowUnix } from "./store.js";
import { slackClient, listPublicChannels, ensureChannelJoined, getPermalink } from "./slack.js";
import { runBackfill } from "./backfill.js";
import { downloadSlackFile } from "./files.js";

const BOT = process.env.SLACK_BOT_TOKEN;
const APP = process.env.SLACK_APP_TOKEN;
const DB_PATH = process.env.DB_PATH || "/data/app.db";
const FILES_DIR = process.env.FILES_DIR || "/data/files";
const BACKFILL_INTERVAL_SEC = parseInt(process.env.BACKFILL_INTERVAL_SEC || "600", 10);
const BACKFILL_BUFFER_SEC = parseInt(process.env.BACKFILL_BUFFER_SEC || "600", 10);
const BACKFILL_PAGE_LIMIT = parseInt(process.env.BACKFILL_PAGE_LIMIT || "200", 10);

if (!BOT || !APP) throw new Error("Missing SLACK_BOT_TOKEN or SLACK_APP_TOKEN");

const db = openDb(DB_PATH);
const schema = fs.readFileSync(new URL("./schema.sql", import.meta.url), "utf-8");
initSchema(db, schema);

const client = slackClient(BOT);

const insertChannel = db.prepare(`
  INSERT INTO channels(id, name, is_archived, selected, updated_at)
  VALUES(?,?,?,?,?)
  ON CONFLICT(id) DO UPDATE SET name=excluded.name, is_archived=excluded.is_archived, updated_at=excluded.updated_at
`);

const upsertUser = db.prepare(`
  INSERT INTO users(id, display_name, real_name, avatar_url, updated_at)
  VALUES(?,?,?,?,?)
  ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name, real_name=excluded.real_name, avatar_url=excluded.avatar_url, updated_at=excluded.updated_at
`);

const upsertMessage = db.prepare(`
  INSERT INTO messages(channel_id, ts, thread_ts, user_id, text, permalink, has_files, edited_ts, is_deleted, deleted_ts, raw_json, created_at, updated_at)
  VALUES (@channel_id, @ts, @thread_ts, @user_id, @text, @permalink, @has_files, @edited_ts, @is_deleted, @deleted_ts, @raw_json, @created_at, @updated_at)
  ON CONFLICT(channel_id, ts) DO UPDATE SET
    text=excluded.text,
    permalink=coalesce(excluded.permalink, messages.permalink),
    has_files=excluded.has_files,
    edited_ts=excluded.edited_ts,
    is_deleted=excluded.is_deleted,
    deleted_ts=excluded.deleted_ts,
    raw_json=excluded.raw_json,
    updated_at=excluded.updated_at
`);

const insertFile = db.prepare(`
  INSERT INTO files(id, channel_id, message_ts, name, mimetype, size, url_private, local_path, sha256, is_deleted, created_at)
  VALUES (@id, @channel_id, @message_ts, @name, @mimetype, @size, @url_private, @local_path, @sha256, @is_deleted, @created_at)
  ON CONFLICT(id) DO UPDATE SET
    local_path=coalesce(excluded.local_path, files.local_path),
    sha256=coalesce(excluded.sha256, files.sha256),
    is_deleted=excluded.is_deleted
`);

async function refreshChannels() {
  let cursor;
  do {
    const r = await listPublicChannels(client, cursor);
    for (const c of r.channels ?? []) {
      insertChannel.run(c.id, c.name, c.is_archived ? 1 : 0, 0, nowUnix());
    }
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);
}

function isTracking(channelId) {
  const row = db.prepare("SELECT selected FROM channels WHERE id=?").get(channelId);
  return row?.selected === 1;
}

const app = new App({
  token: BOT,
  appToken: APP,
  socketMode: true
});

app.event("message", async ({ event }) => {
  const e = event;
  const channel_id = e.channel;
  if (!channel_id) return;
  if (!isTracking(channel_id)) return;

  await ensureChannelJoined(client, channel_id);

  // 削除イベント：message_deleted は deleted_ts が「元メッセージのts」
  if (e.subtype === "message_deleted") {
    const origTs = e.deleted_ts;
    if (!origTs) return;
    upsertMessage.run({
      channel_id,
      ts: origTs,
      thread_ts: origTs,
      user_id: null,
      text: "",
      permalink: null,
      has_files: 0,
      edited_ts: null,
      is_deleted: 1,
      deleted_ts: nowUnix().toString(),
      raw_json: JSON.stringify(e),
      created_at: nowUnix(),
      updated_at: nowUnix()
    });
    return;
  }

  // 編集イベント：message_changed は e.message に新しい本文が入る
  let msg = e;
  if (e.subtype === "message_changed" && e.message) msg = e.message;

  if (!msg.ts) return;

  const thread_ts = msg.thread_ts ?? msg.ts;
  const has_files = Array.isArray(msg.files) && msg.files.length > 0 ? 1 : 0;
  const permalink = await getPermalink(client, channel_id, msg.ts);

  upsertMessage.run({
    channel_id,
    ts: msg.ts,
    thread_ts,
    user_id: msg.user ?? null,
    text: msg.text ?? "",
    permalink,
    has_files,
    edited_ts: msg.edited?.ts ?? null,
    is_deleted: 0,
    deleted_ts: null,
    raw_json: JSON.stringify(msg),
    created_at: nowUnix(),
    updated_at: nowUnix()
  });

  // ユーザー情報（ベストエフォート）
  if (msg.user) {
    try {
      const u = await client.users.info({ user: msg.user });
      const profile = u.user?.profile;
      upsertUser.run(
        msg.user,
        profile?.display_name || u.user?.name || "",
        profile?.real_name || "",
        profile?.image_72 || "",
        nowUnix()
      );
    } catch {}
  }

  // 添付ファイルをローカルDL
  if (msg.files?.length) {
    for (const f of msg.files) {
      const dl = f.url_private_download;
      if (!f.id || !dl) continue;

      const safeName = (f.name || f.id).replace(/[\\/:*?"<>|]/g, "_");
      const outPath = path.join(FILES_DIR, channel_id, safeName);

      try {
        const { sha256 } = await downloadSlackFile({ url: dl, token: BOT, outPath });
        insertFile.run({
          id: f.id,
          channel_id,
          message_ts: msg.ts,
          name: f.name ?? "",
          mimetype: f.mimetype ?? "",
          size: f.size ?? null,
          url_private: f.url_private ?? "",
          local_path: outPath,
          sha256,
          is_deleted: 0,
          created_at: nowUnix()
        });
      } catch (err) {
        console.error("file download failed", f.id, err.message);
      }
    }
  }
});

async function backfillLoop() {
  while (true) {
    try {
      const selected = db.prepare("SELECT id FROM channels WHERE selected=1").all();
      for (const row of selected) {
        await ensureChannelJoined(client, row.id);
        await runBackfill({
          db,
          client,
          channelId: row.id,
          bufferSec: BACKFILL_BUFFER_SEC,
          pageLimit: BACKFILL_PAGE_LIMIT
        });
      }
    } catch (e) {
      console.error("backfill error", e);
    }
    await new Promise(r => setTimeout(r, BACKFILL_INTERVAL_SEC * 1000));
  }
}

(async () => {
  await refreshChannels();
  await app.start();
  console.log("ingestor started (socket mode)");
  backfillLoop();
})();
