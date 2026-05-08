export const dynamic = "force-dynamic";

import fs from "node:fs";
import path from "node:path";

export async function GET(req, { params }) {
  const baseDir = process.env.FILES_DIR || "/data/files";
  const rel = (params.path || []).join("/");
  const full = path.join(baseDir, rel);

  // パストラバーサル対策（念のため）
  if (!full.startsWith(baseDir)) {
    return new Response("bad path", { status: 400 });
  }
  if (!fs.existsSync(full)) {
    return new Response("not found", { status: 404 });
  }

  const ext = path.extname(full).toLowerCase();
  const contentType =
    ext === ".png" ? "image/png" :
    ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
    ext === ".gif" ? "image/gif" :
    ext === ".pdf" ? "application/pdf" :
    "application/octet-stream";

  const buf = fs.readFileSync(full);
  return new Response(buf, {
    headers: {
      "content-type": contentType,
      "content-disposition": `inline; filename="${path.basename(full)}"`
    }
  });
}