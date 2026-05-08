export const metadata = {
  title: "Slack Archive",
  description: "Local Slack log archive"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
