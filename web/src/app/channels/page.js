"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Channels() {
  const [chs, setChs] = useState([]);

  async function load() {
    const r = await fetch("/api/channels");
    setChs(await r.json());
  }

  async function toggle(id, selected) {
    await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, selected })
    });
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <main style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Channels</h2>
      <ul>
        {chs.map(c => (
          <li key={c.id} style={{ marginBottom: 8 }}>
            <button onClick={() => toggle(c.id, !c.selected)}>
              {c.selected ? "✓ Tracking" : "Track"}
            </button>{" "}
            <Link href={`/channel/${c.id}`}>#{c.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
