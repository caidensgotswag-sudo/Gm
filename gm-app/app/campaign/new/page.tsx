"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { saveCampaign } from "@/lib/storage";
import type { Campaign } from "@/lib/types";
import Navbar from "@/app/components/Navbar";

const TONES = ["High Fantasy", "Dark & Gritty", "Heroic Epic", "Horror", "Political Intrigue", "Swashbuckling", "Cosmic Horror"];
const SETTINGS = ["Forgotten Realms", "Eberron", "Homebrew World", "Ancient Rome", "Dark Ages", "Steampunk", "Post-Apocalyptic Fantasy", "Underwater", "Planar/Multiverse"];

export default function NewCampaignPage() {
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.id;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    setting: "",
    tone: "",
    partySize: 4,
    partyLevel: 1,
    lore: "",
  });

  function update(key: string, val: string | number) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function handleCreate() {
    const campaign: Campaign = {
      id: crypto.randomUUID(),
      ...form,
      notes: "",
      homebrewRules: "",
      party: [],
      createdAt: new Date().toISOString(),
      sessions: [],
    };
    saveCampaign(campaign, userId);
    router.push(`/campaigns/${campaign.id}`);
  }

  const canNext1 = form.name.trim().length > 0 && form.setting.trim().length > 0;
  const canNext2 = form.tone.trim().length > 0;
  const canCreate = form.lore.trim().length > 0;

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 100%)" }}>
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/campaigns" className="text-gold opacity-60 hover:opacity-100 transition-opacity">← Campaigns</Link>
          <h1 className="text-3xl font-bold text-gold">Forge a New Campaign</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: step >= s ? "var(--blood)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${step >= s ? "var(--gold)" : "rgba(255,255,255,0.1)"}`,
                  color: step >= s ? "var(--gold-light)" : "rgba(255,255,255,0.3)",
                }}>
                {s}
              </div>
              {s < 3 && <div className="flex-1 h-px w-12" style={{ background: step > s ? "var(--gold)" : "rgba(255,255,255,0.1)" }} />}
            </div>
          ))}
          <span className="ml-2 text-sm" style={{ color: "rgba(245,230,200,0.4)" }}>
            {step === 1 ? "World Setup" : step === 2 ? "Tone & Party" : "Campaign Lore"}
          </span>
        </div>

        <div className="card-parchment p-8">
          {/* Step 1 */}
          {step === 1 && (
            <div className="fade-in">
              <h2 className="text-xl font-bold text-gold mb-6">🗺️ Name Your World</h2>
              <div className="mb-5">
                <label className="block text-sm mb-2" style={{ color: "rgba(245,230,200,0.6)" }}>Campaign Name *</label>
                <input
                  className="input-fantasy"
                  placeholder="e.g. The Fall of Shadowmere"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm mb-2" style={{ color: "rgba(245,230,200,0.6)" }}>Setting *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                  {SETTINGS.map((s) => (
                    <button key={s} onClick={() => update("setting", s)}
                      className="text-sm px-3 py-2 rounded transition-all text-left"
                      style={{
                        background: form.setting === s ? "rgba(139,0,0,0.5)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${form.setting === s ? "var(--gold)" : "rgba(255,255,255,0.1)"}`,
                        color: form.setting === s ? "var(--gold-light)" : "rgba(245,230,200,0.5)",
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
                <input
                  className="input-fantasy mt-2"
                  placeholder="Or type a custom setting..."
                  value={SETTINGS.includes(form.setting) ? "" : form.setting}
                  onChange={(e) => update("setting", e.target.value)}
                />
              </div>
              <div className="flex justify-end mt-6">
                <button className="btn-primary" disabled={!canNext1} onClick={() => setStep(2)}
                  style={{ opacity: canNext1 ? 1 : 0.4, cursor: canNext1 ? "pointer" : "not-allowed" }}>
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="fade-in">
              <h2 className="text-xl font-bold text-gold mb-6">⚔️ Tone &amp; Party</h2>
              <div className="mb-5">
                <label className="block text-sm mb-2" style={{ color: "rgba(245,230,200,0.6)" }}>Campaign Tone *</label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map((t) => (
                    <button key={t} onClick={() => update("tone", t)}
                      className="text-sm px-3 py-2 rounded transition-all text-left"
                      style={{
                        background: form.tone === t ? "rgba(139,0,0,0.5)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${form.tone === t ? "var(--gold)" : "rgba(255,255,255,0.1)"}`,
                        color: form.tone === t ? "var(--gold-light)" : "rgba(245,230,200,0.5)",
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm mb-2" style={{ color: "rgba(245,230,200,0.6)" }}>Party Size</label>
                  <select className="input-fantasy" value={form.partySize} onChange={(e) => update("partySize", Number(e.target.value))}>
                    {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n} player{n > 1 ? "s" : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: "rgba(245,230,200,0.6)" }}>Starting Level</label>
                  <select className="input-fantasy" value={form.partyLevel} onChange={(e) => update("partyLevel", Number(e.target.value))}>
                    {Array.from({length: 20}, (_, i) => i + 1).map((n) => <option key={n} value={n}>Level {n}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="btn-primary" disabled={!canNext2} onClick={() => setStep(3)}
                  style={{ opacity: canNext2 ? 1 : 0.4, cursor: canNext2 ? "pointer" : "not-allowed" }}>
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="fade-in">
              <h2 className="text-xl font-bold text-gold mb-6">📜 Campaign Lore</h2>
              <p className="text-sm mb-4" style={{ color: "rgba(245,230,200,0.5)" }}>
                Describe your world's backstory, key factions, current conflicts, and any lore the AI should know. The more detail you add, the better the AI will perform.
              </p>
              <textarea
                className="input-fantasy"
                rows={8}
                placeholder="e.g. The kingdom of Valdros has been at peace for 200 years, but dark forces stir in the Shadowfen. A mysterious cult called the Ashen Circle has begun abducting villagers from the northern villages. The party are newly arrived adventurers hired by the Lord Mayor of Thornwall to investigate..."
                value={form.lore}
                onChange={(e) => update("lore", e.target.value)}
                style={{ resize: "vertical" }}
              />
              <div className="flex justify-between mt-6">
                <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
                <button className="btn-primary" disabled={!canCreate} onClick={handleCreate}
                  style={{ opacity: canCreate ? 1 : 0.4, cursor: canCreate ? "pointer" : "not-allowed" }}>
                  🔥 Forge Campaign
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
