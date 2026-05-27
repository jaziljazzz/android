import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "skipQ Partner",
  description: "Manage your salon's live queue.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
