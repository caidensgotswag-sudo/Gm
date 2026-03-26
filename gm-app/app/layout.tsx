import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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
    <ClerkProvider>
      <html lang="en">
        <body>
          <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('dungeon_forge_theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();` }} />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
