"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { SharedCampaignData } from "@/lib/types";

const REP_LABELS: Record<string, string> = { active: "Active", completed: "Completed", failed: "Failed" };
const REP_COLORS: Record<string, string> = { active: "rgba(201,168,76,0.8)", completed: "rgba(0,200,0,0.7)", failed: "rgba(200,0,0,0.7)" };

export default function PlayerPortalPage() {
  const { userId, campaignId } = useParams<{ userId: string; campaignId: string }>();
  const [data, setData] = useState<SharedCampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/portal/${userId}/${campaignId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId, campaignId]);

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 100%)" }}>
      <div className="text-center"><div className="text-4xl mb-4 flicker">🔥</div><p style={{ color: "rgba(245,230,200,0.4)" }}>Loading campaign...</p></div>
    </main>
  );

  if (error || !data) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 100%)" }}>
      <div className="text-center card-parchment p-10">
        <div className="text-5xl mb-4">🏰</div>
        <h1 className="text-xl font-bold text-gold mb-2">Campaign Not Found</h1>
        <p style={{ color: "rgba(245,230,200,0.45)" }}>This share link may have expired or the DM hasn&apos;t shared this campaign yet.</p>
        <Link href="/" className="mt-4 inline-block"><button className="btn-primary mt-4">← Dungeon Forge</button></Link>
      </div>
    </main>
  );

  const activeQuests = data.quests.filter((q) => q.status === "active");
  const completedQuests = data.quests.filter((q) => q.status === "completed");

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 100%)" }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
        <div className="flex items-center gap-3">
          <span className="text-xl">⚔️</span>
          <span className="text-sm font-bold text-gold" style={{ letterSpacing: "0.08em" }}>DUNGEON FORGE</span>
        </div>
        <span className="text-xs" style={{ color: "rgba(245,230,200,0.3)" }}>Player Portal</span>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Campaign header */}
        <div className="text-center py-6">
          <div className="text-5xl mb-3">🐉</div>
          <h1 className="text-4xl font-bold text-gold mb-2">{data.name}</h1>
          <p style={{ color: "rgba(245,230,200,0.5)" }}>{data.setting} &bull; {data.tone} &bull; Party Level {data.partyLevel}</p>
          <p className="text-xs mt-2" style={{ color: "rgba(245,230,200,0.25)" }}>Last updated {new Date(data.updatedAt).toLocaleDateString()}</p>
        </div>

        {/* Party */}
        {data.party.length > 0 && (
          <div className="card-parchment p-5">
            <h2 className="text-sm font-bold text-gold uppercase tracking-widest mb-4">⚔️ The Party</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.party.map((m, i) => (
                <div key={i} className="text-center p-3 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="text-2xl mb-1">🧙</div>
                  <p className="font-bold text-sm" style={{ color: "rgba(245,230,200,0.9)" }}>{m.name}</p>
                  <p className="text-xs" style={{ color: "rgba(245,230,200,0.45)" }}>Lvl {m.level} {m.race} {m.class}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Quests */}
        {activeQuests.length > 0 && (
          <div className="card-parchment p-5">
            <h2 className="text-sm font-bold text-gold uppercase tracking-widest mb-4">📋 Active Quests</h2>
            <div className="space-y-3">
              {activeQuests.map((q, i) => (
                <div key={i} className="p-3 rounded" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)" }}>
                  <p className="font-semibold text-sm" style={{ color: "rgba(245,230,200,0.9)" }}>{q.title}</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "rgba(245,230,200,0.5)" }}>{q.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Recaps */}
        {data.recaps.length > 0 && (
          <div className="card-parchment p-5">
            <h2 className="text-sm font-bold text-gold uppercase tracking-widest mb-4">📖 Session Recaps</h2>
            <div className="space-y-5">
              {data.recaps.map((r, i) => (
                <div key={i}>
                  <h3 className="font-bold text-sm mb-2" style={{ color: "rgba(245,230,200,0.7)" }}>{r.sessionTitle}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(245,230,200,0.55)", fontStyle: "italic" }}>{r.recap}</p>
                  {i < data.recaps.length - 1 && <hr className="divider mt-5" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Quests */}
        {completedQuests.length > 0 && (
          <div className="card-parchment p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(245,230,200,0.3)" }}>✓ Completed Quests</h2>
            <div className="space-y-2">
              {completedQuests.map((q, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span style={{ color: REP_COLORS[q.status] }}>✓</span>
                  <span className="text-sm line-through" style={{ color: "rgba(245,230,200,0.3)" }}>{q.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs" style={{ color: "rgba(245,230,200,0.2)" }}>
          Powered by <Link href="/" className="text-gold opacity-50 hover:opacity-80">The Dungeon Forge</Link>
        </p>
      </div>
    </main>
  );
}
