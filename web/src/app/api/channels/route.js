export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT id, name, selected FROM channels ORDER BY name").all();
  return NextResponse.json(rows);
}

export async function POST(req) {
  const { id, selected } = await req.json();
  const db = getDb();
  db.prepare("UPDATE channels SET selected=? WHERE id=?").run(selected ? 1 : 0, id);
  return NextResponse.json({ ok: true });
}
