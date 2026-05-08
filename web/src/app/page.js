import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Slack Archive</h1>
      <p><Link href="/channels">Channels</Link></p>
    </main>
  );
}
