export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "../../../../../lib/db";

export async function GET(req, { params }) {
  const db = getDb();
  const url = new URL(req.url);

  const channelId = params.id;
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
  const before = url.searchParams.get("before");

  let sql = `
    SELECT m.*, u.display_name
    FROM messages m
    LEFT JOIN users u ON u.id = m.user_id
    WHERE m.channel_id = ?
      AND m.is_deleted = 0
  `;
  const args = [channelId];

  if (before) {
    sql += " AND CAST(m.ts AS REAL) < CAST(? AS REAL)";
    args.push(before);
  }

  sql += " ORDER BY CAST(m.ts AS REAL) DESC LIMIT ?";
  args.push(limit);

  const rows = db.prepare(sql).all(...args);

  // 添付をまとめて取る
  const tsList = rows.map(r => r.ts);
  const filesByTs = {};
  if (tsList.length) {
    const q = `
      SELECT message_ts, name, local_path
      FROM files
      WHERE channel_id = ?
        AND message_ts IN (${tsList.map(() => "?").join(",")})
    `;
    const frows = db.prepare(q).all(channelId, ...tsList);
    for (const f of frows) {
      (filesByTs[f.message_ts] ||= []).push(f);
    }
  }

  // local_path(/data/files/...) → /files/... に変換
  const baseDir = process.env.FILES_DIR || "/data/files";
  for (const r of rows) {
    r.files = (filesByTs[r.ts] || []).map(f => {
      const rel = f.local_path.replace(baseDir, "").replace(/^\/+/, "");
      return { name: f.name, url: `/files/${rel}` };
    });
  }

  return NextResponse.json(rows);
}