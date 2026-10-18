import type { Metadata } from "next";
import "@fontsource-variable/noto-serif/wght.css";
import "../globals.css";

// Admin is never indexed (also enforced by the X-Robots-Tag header in src/proxy.ts).
export const metadata: Metadata = {
  title: { default: "Administration", template: "%s | Administration" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="ui min-h-dvh bg-parchment/40 text-ink antialiased">{children}</body>
    </html>
  );
}
