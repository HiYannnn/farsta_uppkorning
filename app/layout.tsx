import type { Metadata } from "next";
import "./globals.css";
import "./draw.css";
import "./bugfix.css";

export const metadata: Metadata = {
  title: "DrivePath – Farsta Practice Routes",
  description: "Record, repeat and share driving-practice routes around Farsta.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
