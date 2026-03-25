import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Dungeon Forge — AI-Powered D&D Campaign Builder",
  description: "Create and run Dungeons & Dragons campaigns with the power of AI. Build worlds, generate NPCs, and run live sessions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
