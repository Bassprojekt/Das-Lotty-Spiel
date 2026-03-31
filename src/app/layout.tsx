import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lucky Scratch - Scratch Card Game",
  description: "A satisfying scratch card incremental game!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ fontFamily: "'SF Mono', 'Cascadia Code', 'Fira Code', monospace" }}>
        {children}
      </body>
    </html>
  );
}
