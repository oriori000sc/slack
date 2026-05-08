import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import fetch from "node-fetch";

export async function downloadSlackFile({ url, token, outPath }) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`File download failed: ${res.status} ${res.statusText}`);

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);

  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  return { sha256, bytes: buf.length };
}
