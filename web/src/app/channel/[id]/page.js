"use client";

import { useEffect, useState } from "react";

export default function ChannelPage({ params }) {
  const [rows, setRows] = useState(null); // null=未取得
  const [err, setErr] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr("");
        setStatus("fetching...");

        const url = `/api/channel/${params.id}/messages?limit=50`;
        const res = await fetch(url, { cache: "no-store" });

        setStatus(`HTTP ${res.status}`);
        const text = await res.text();

        // JSONかどうかに関わらず表示できるようにする
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Non-JSON response: ${text.slice(0, 300)}`);
        }

        if (!res.ok) {
          throw new Error(`API ${res.status}: ${text.slice(0, 300)}`);
        }

        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) setErr(String(e?.message ?? e));
      }
    })();

    return () => { cancelled = true; };
  }, [params.id]);

  return (
    <main style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Channel: {params.id}</h2>

      {/* デバッグ */}
      <div style={{ padding: 10, background: "#f7f7f7", borderRadius: 8, marginBottom: 12 }}>
        <div><b>Status:</b> {status || "(none)"}</div>
        <div><b>rows type:</b> {rows === null ? "null" : Array.isArray(rows) ? "array" : typeof rows}</div>
        <div><b>rows length:</b> {Array.isArray(rows) ? rows.length : "-"}</div>
        {err ? <div style={{ color: "crimson" }}><b>Error:</b> {err}</div> : null}
      </div>

      {/* 本文 */}
      {Array.isArray(rows) && rows.map(m => (
        <div key={m.ts} style={{ padding: 10, borderBottom: "1px solid #eee" }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {m.display_name || m.user_id || "unknown"} · {m.ts}
          </div>
          <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
        </div>
      ))}

      {Array.isArray(rows) && rows.length === 0 && !err && (
        <p>0件です（APIは返っているが配列が空）</p>
      )}
    </main>
  );
}
