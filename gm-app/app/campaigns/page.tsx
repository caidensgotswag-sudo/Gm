"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCampaigns, deleteCampaign } from "@/lib/storage";
import type { Campaign } from "@/lib/types";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    setCampaigns(getCampaigns());
  }, []);

  function handleDelete(id: string) {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    deleteCampaign(id);
    setCampaigns(getCampaigns());
  }

  return (
    <main className="min-h-screen px-4 py-10" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 100%)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gold opacity-60 hover:opacity-100 transition-opacity">← Home</Link>
            <h1 className="text-3xl font-bold text-gold">My Campaigns</h1>
          </div>
          <Link href="/campaign/new">
            <button className="btn-primary">⚔️ New Campaign</button>
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="card-parchment p-12 text-center">
            <div className="text-5xl mb-4">🏰</div>
            <h2 className="text-xl font-bold text-gold mb-2">No campaigns yet</h2>
            <p className="mb-6" style={{ color: "rgba(245,230,200,0.5)" }}>Your adventure awaits. Create your first campaign to begin.</p>
            <Link href="/campaign/new">
              <button className="btn-primary">🔥 Forge Your First Campaign</button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((c) => (
              <div key={c.id} className="card-parchment p-6 fade-in">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-lg font-bold text-gold">{c.name}</h2>
                  <button onClick={() => handleDelete(c.id)} className="text-xs opacity-30 hover:opacity-70 hover:text-red-400 transition-all" title="Delete">✕</button>
                </div>
                <p className="text-sm mb-1" style={{ color: "rgba(245,230,200,0.5)" }}>
                  {c.setting} &bull; {c.tone}
                </p>
                <p className="text-sm mb-4" style={{ color: "rgba(245,230,200,0.4)" }}>
                  Party of {c.partySize} &bull; Level {c.partyLevel} &bull; {c.sessions?.length || 0} session{c.sessions?.length !== 1 ? "s" : ""}
                </p>
                <p className="text-sm mb-5 line-clamp-2" style={{ color: "rgba(245,230,200,0.4)", fontStyle: "italic" }}>
                  {c.lore}
                </p>
                <div className="flex gap-2">
                  <Link href={`/campaigns/${c.id}`} className="flex-1">
                    <button className="btn-primary w-full text-sm">▶ Continue</button>
                  </Link>
                  <Link href={`/tools?campaign=${c.id}`}>
                    <button className="btn-secondary text-sm">🛠 Tools</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
