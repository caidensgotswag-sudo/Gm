"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";

export default function Home() {
  const { user, isLoaded } = useUser();

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 50%, #0d0a0a 100%)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚔️</span>
          <span className="text-xl font-bold text-gold" style={{ letterSpacing: "0.1em" }}>THE DUNGEON FORGE</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/pricing">
            <button className="btn-secondary text-sm">Pricing</button>
          </Link>
          {isLoaded && user ? (
            <>
              <Link href="/campaigns">
                <button className="btn-primary text-sm">My Campaigns</button>
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <button className="btn-secondary text-sm">Sign In</button>
              </Link>
              <Link href="/sign-up">
                <button className="btn-primary text-sm">Get Started</button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="flicker text-6xl mb-6">🔥</div>
        <h1 className="text-5xl md:text-7xl font-bold mb-4 text-gold" style={{ textShadow: "0 0 30px rgba(201,168,76,0.4)", letterSpacing: "0.05em" }}>
          DUNGEON FORGE
        </h1>
        <p className="text-xl md:text-2xl mb-3" style={{ color: "rgba(245,230,200,0.7)" }}>
          AI-Powered Dungeons &amp; Dragons Campaign Builder
        </p>
        <p className="text-base max-w-xl mb-10" style={{ color: "rgba(245,230,200,0.5)" }}>
          Craft epic worlds, generate NPCs, build encounters, and run immersive live sessions — all powered by AI, all at your fingertips.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/campaign/new">
            <button className="btn-primary text-lg px-8 py-3">
              ⚔️ Forge a Campaign
            </button>
          </Link>
          <Link href="/campaigns">
            <button className="btn-secondary text-lg px-8 py-3">
              📜 My Campaigns
            </button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto w-full">
        <h2 className="text-center text-3xl font-bold text-gold mb-2" style={{ letterSpacing: "0.08em" }}>WHAT YOU CAN DO</h2>
        <hr className="divider mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🗺️",
              title: "Build Campaigns",
              desc: "Define your world's lore, tone, setting, and rules. The AI learns your campaign and stays consistent.",
            },
            {
              icon: "🧙",
              title: "Generate NPCs",
              desc: "Instantly create named NPCs with backstories, personalities, and voices — ready to drop into any scene.",
            },
            {
              icon: "🐉",
              title: "Run Live Sessions",
              desc: "Act as DM with AI narrating descriptions, handling dice logic, and adapting to player choices in real time.",
            },
            {
              icon: "⚔️",
              title: "Design Encounters",
              desc: "Generate balanced combat encounters, traps, and puzzles scaled to your party's level and campaign tone.",
            },
            {
              icon: "📖",
              title: "Session History",
              desc: "Every session is saved. Review past events, pick up where you left off, and keep the story consistent.",
            },
            {
              icon: "🏰",
              title: "Dungeon Builder",
              desc: "Describe a dungeon and the AI generates room descriptions, secrets, lore, and encounters.",
            },
          ].map((f) => (
            <div key={f.title} className="card-parchment p-6 fade-in">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-bold text-gold mb-2">{f.title}</h3>
              <p style={{ color: "rgba(245,230,200,0.6)", fontSize: "0.9rem", lineHeight: "1.6" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 px-6" style={{ background: "rgba(139,0,0,0.08)", borderTop: "1px solid rgba(201,168,76,0.15)" }}>
        <h2 className="text-3xl font-bold text-gold mb-4">Ready to begin your adventure?</h2>
        <p style={{ color: "rgba(245,230,200,0.5)", marginBottom: "2rem" }}>No sign-up required. Your campaigns are saved locally in your browser.</p>
        <Link href="/campaign/new">
          <button className="btn-primary text-xl px-10 py-4">
            🎲 Start for Free
          </button>
        </Link>
      </section>

      <footer className="text-center py-6 text-sm" style={{ color: "rgba(245,230,200,0.3)", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        The Dungeon Forge &mdash; Powered by Gemini AI &mdash; Built for Game Masters
      </footer>
    </main>
  );
}
