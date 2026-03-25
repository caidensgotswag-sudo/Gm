"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCampaign, createSession } from "@/lib/storage";
import type { Campaign } from "@/lib/types";

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");

  useEffect(() => {
    const c = getCampaign(id);
    if (!c) router.push("/campaigns");
    else setCampaign(c);
  }, [id, router]);

  function handleNewSession() {
    if (!campaign) return;
    const title = sessionTitle.trim() || `Session ${(campaign.sessions?.length || 0) + 1}`;
    const session = createSession(campaign.id, title);
    router.push(`/session/${campaign.id}/${session.id}`);
  }

  if (!campaign) return null;

  return (
    <main className="min-h-screen px-4 py-10" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 100%)" }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <Link href="/campaigns" className="text-gold opacity-60 hover:opacity-100 transition-opacity">← Campaigns</Link>
        </div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gold">{campaign.name}</h1>
            <p className="mt-1 text-sm" style={{ color: "rgba(245,230,200,0.5)" }}>
              {campaign.setting} &bull; {campaign.tone} &bull; Party of {campaign.partySize} &bull; Level {campaign.partyLevel}
            </p>
          </div>
          <Link href={`/tools?campaign=${campaign.id}`}>
            <button className="btn-secondary text-sm">🛠 GM Tools</button>
          </Link>
        </div>

        {/* Lore */}
        <div className="card-parchment p-6 mb-8">
          <h2 className="text-sm font-bold text-gold mb-3 uppercase tracking-widest opacity-60">Campaign Lore</h2>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(245,230,200,0.65)", fontStyle: "italic" }}>{campaign.lore}</p>
        </div>

        {/* New Session */}
        <div className="card-parchment p-6 mb-6">
          <h2 className="text-lg font-bold text-gold mb-4">▶ Start a New Session</h2>
          <div className="flex gap-3">
            <input
              className="input-fantasy flex-1"
              placeholder={`Session ${(campaign.sessions?.length || 0) + 1} — The name of this chapter...`}
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNewSession()}
            />
            <button className="btn-primary" onClick={handleNewSession}>Begin →</button>
          </div>
        </div>

        {/* Past Sessions */}
        {campaign.sessions && campaign.sessions.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gold mb-4">📖 Past Sessions</h2>
            <div className="flex flex-col gap-3">
              {[...campaign.sessions].reverse().map((s) => (
                <div key={s.id} className="card-parchment p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: "rgba(245,230,200,0.85)" }}>{s.title}</p>
                    <p className="text-xs mt-1" style={{ color: "rgba(245,230,200,0.35)" }}>
                      {new Date(s.createdAt).toLocaleDateString()} &bull; {s.messages.length} message{s.messages.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Link href={`/session/${campaign.id}/${s.id}`}>
                    <button className="btn-secondary text-sm">Resume</button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
