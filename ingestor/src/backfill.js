import { history, getPermalink } from "./slack.js";
import { nowUnix, setMeta, getMeta } from "./store.js";

export async function runBackfill({ db, client, channelId, bufferSec, pageLimit }) {
  const key = `last_ts:${channelId}`;
  const last = getMeta(db, key);
  const oldest = last ? (parseFloat(last) - bufferSec).toString() : "0";

  let cursor = undefined;
  let maxSeen = last ? parseFloat(last) : 0;

  const upsert = db.prepare(`
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

  do {
    const r = await history(client, channelId, oldest, cursor, pageLimit);
    const msgs = r.messages ?? [];
    for (const m of msgs) {
      if (!m.ts) continue;
      const tsNum = parseFloat(m.ts);
      if (tsNum > maxSeen) maxSeen = tsNum;

      const thread_ts = m.thread_ts ?? m.ts;
      const has_files = Array.isArray(m.files) && m.files.length > 0 ? 1 : 0;

      const permalink = await getPermalink(client, channelId, m.ts);

      upsert.run({
        channel_id: channelId,
        ts: m.ts,
        thread_ts,
        user_id: m.user ?? null,
        text: m.text ?? "",
        permalink,
        has_files,
        edited_ts: m.edited?.ts ?? null,
        is_deleted: 0,
        deleted_ts: null,
        raw_json: JSON.stringify(m),
        created_at: nowUnix(),
        updated_at: nowUnix()
      });
    }
    cursor = r.response_metadata?.next_cursor || undefined;
  } while (cursor);

  if (maxSeen > 0) setMeta(db, key, maxSeen.toString());
}
