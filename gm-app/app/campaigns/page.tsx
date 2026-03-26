"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { getCampaigns, deleteCampaign } from "@/lib/storage";
import { getPlan, canCreateCampaign } from "@/lib/subscription";
import type { Campaign } from "@/lib/types";
import type { PlanId } from "@/lib/subscription";
import Navbar from "@/app/components/Navbar";

export default function CampaignsPage() {
  const { user } = useUser();
  const userId = user?.id;
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const planId = (user?.publicMetadata?.planId as PlanId) ?? "free";
  const plan = getPlan(planId);

  useEffect(() => {
    setCampaigns(getCampaigns(userId));
  }, []);

  function handleDelete(id: string) {
    if (!confirm("Delete this campaign? This cannot be undone.")) return;
    deleteCampaign(id, userId);
    setCampaigns(getCampaigns(userId));
  }

  const canAdd = canCreateCampaign(plan, campaigns.length);

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 100%)" }}>
      <Navbar />
      <div className="max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gold">My Campaigns</h1>
          {canAdd ? (
            <Link href="/campaign/new">
              <button className="btn-primary">⚔️ New Campaign</button>
            </Link>
          ) : (
            <Link href="/pricing">
              <button className="btn-primary">⚡ Upgrade to Add More</button>
            </Link>
          )}
        </div>

        {/* Plan limit warning */}
        {!canAdd && (
          <div className="mb-6 p-4 rounded fade-in" style={{ background: "rgba(139,0,0,0.2)", border: "1px solid rgba(139,0,0,0.5)" }}>
            <p className="text-sm" style={{ color: "rgba(245,230,200,0.7)" }}>
              You&apos;ve reached the <span className="text-gold font-bold">{plan.name}</span> plan limit of{" "}
              <strong>{plan.limits.campaigns} campaign{plan.limits.campaigns !== 1 ? "s" : ""}</strong>.{" "}
              <Link href="/pricing" className="underline text-gold">Upgrade your plan</Link> to add more.
            </p>
          </div>
        )}

        {/* Plan badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", color: "rgba(201,168,76,0.7)" }}>
            {plan.name} Plan &bull; {campaigns.length}/{plan.limits.campaigns === -1 ? "∞" : plan.limits.campaigns} campaigns
          </span>
          <Link href="/pricing" className="text-xs" style={{ color: "rgba(245,230,200,0.3)" }}>Upgrade →</Link>
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
