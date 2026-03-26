"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { getCampaign, getCampaigns } from "@/lib/storage";
import { getPlan } from "@/lib/subscription";
import type { Campaign } from "@/lib/types";
import type { PlanId } from "@/lib/subscription";
import Navbar from "@/app/components/Navbar";

type ToolType = "npc" | "encounter" | "dungeon" | "general" | "world-lore" | "arc-planner";

interface ToolDef {
  id: ToolType;
  icon: string;
  label: string;
  desc: string;
  placeholder: string;
  minPlan?: PlanId;
}

const TOOLS: ToolDef[] = [
  {
    id: "npc",
    icon: "🧙",
    label: "NPC Generator",
    desc: "Generate a fully fleshed-out NPC with backstory, personality, secrets, and dialogue.",
    placeholder: "e.g. A shady fence who operates out of the docks district, secretly working for the thieves guild",
  },
  {
    id: "encounter",
    icon: "⚔️",
    label: "Encounter Designer",
    desc: "Design a balanced combat or social encounter scaled to your party.",
    placeholder: "e.g. An ambush on the forest road by bandits allied with a werewolf leader",
  },
  {
    id: "dungeon",
    icon: "🏰",
    label: "Dungeon Builder",
    desc: "Generate a dungeon or location with rooms, traps, monsters, and secrets.",
    placeholder: "e.g. An abandoned dwarven mine now occupied by undead, with a lich's phylactery in the deepest vault",
  },
  {
    id: "general",
    icon: "📜",
    label: "Ask the Oracle",
    desc: "Ask anything — lore questions, rulings, plot ideas, magic items, random tables.",
    placeholder: "e.g. What are some interesting complications when negotiating with a dragon?",
  },
  {
    id: "world-lore",
    icon: "🌍",
    label: "World Lore Generator",
    desc: "Generate deep world history, factions, pantheon, geography, and world-level secrets.",
    placeholder: "e.g. Expand the lore of this world — focus on the political tensions between the merchant guilds and the old noble houses",
    minPlan: "legend",
  },
  {
    id: "arc-planner",
    icon: "🗺️",
    label: "Arc Planner",
    desc: "Plan a multi-session story arc with acts, twists, NPCs, and foreshadowing.",
    placeholder: "e.g. A 6-session arc where the party uncovers the cult's plan to resurrect an ancient dragon god beneath the capital city",
    minPlan: "legend",
  },
];

const PLAN_ORDER: PlanId[] = ["free", "adventurer", "master", "legend"];

function planGte(userPlan: PlanId, required: PlanId): boolean {
  return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(required);
}

function ToolsInner() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const userId = user?.id;
  const planId = (user?.publicMetadata?.planId as PlanId) ?? "free";
  const plan = getPlan(planId);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [activeTool, setActiveTool] = useState<ToolType>("npc");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ tool: ToolType; prompt: string; result: string }[]>([]);

  useEffect(() => {
    const all = getCampaigns(userId);
    setCampaigns(all);
    const qId = searchParams.get("campaign");
    if (qId && all.find((c) => c.id === qId)) setSelectedCampaignId(qId);
    else if (all.length > 0) setSelectedCampaignId(all[0].id);
  }, [searchParams, userId]);

  const campaign = selectedCampaignId ? getCampaign(selectedCampaignId, userId) : null;
  const tool = TOOLS.find((t) => t.id === activeTool)!;
  const toolLocked = tool.minPlan ? !planGte(planId, tool.minPlan) : false;

  async function handleGenerate() {
    if (!campaign || !prompt.trim() || loading || toolLocked) return;
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "tool", campaign, toolType: activeTool, prompt: prompt.trim() }),
      });
      const text = await res.text();
      setResult(text);
      setHistory((prev) => [{ tool: activeTool, prompt: prompt.trim(), result: text }, ...prev.slice(0, 9)]);
    } catch {
      setResult("*The arcane connection failed. Please try again.*");
    } finally {
      setLoading(false);
    }
  }

  function renderMarkdown(text: string) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("### ")) return <h3 key={i} className="text-base font-bold mt-4 mb-1 text-gold">{line.slice(4)}</h3>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-bold mt-5 mb-2 text-gold">{line.slice(3)}</h2>;
      if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold mt-5 mb-2 text-gold">{line.slice(2)}</h1>;
      if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="ml-4 text-sm leading-relaxed" style={{ color: "rgba(245,230,200,0.8)" }}>• {line.slice(2)}</li>;
      if (line === "") return <br key={i} />;
      return <p key={i} className="text-sm leading-relaxed" style={{ color: "rgba(245,230,200,0.75)" }}>{line}</p>;
    });
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 100%)" }}>
      <Navbar />

      <div className="flex flex-1 min-h-0" style={{ height: "calc(100vh - 53px)" }}>
        {/* Sidebar */}
        <aside className="w-56 shrink-0 flex flex-col overflow-y-auto p-3 space-y-1" style={{ borderRight: "1px solid rgba(201,168,76,0.12)" }}>
          {/* Campaign selector */}
          {campaigns.length > 0 && (
            <div className="mb-3">
              <label className="text-xs mb-1 block uppercase tracking-widest" style={{ color: "rgba(245,230,200,0.3)" }}>Campaign</label>
              <select className="input-fantasy text-xs py-1.5" value={selectedCampaignId} onChange={(e) => setSelectedCampaignId(e.target.value)}>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "rgba(245,230,200,0.25)" }}>Tools</p>
          {TOOLS.map((t) => {
            const locked = t.minPlan ? !planGte(planId, t.minPlan) : false;
            return (
              <button key={t.id}
                onClick={() => { setActiveTool(t.id); setResult(""); setPrompt(""); }}
                className="w-full text-left px-3 py-2.5 rounded transition-all"
                style={{
                  background: activeTool === t.id ? "rgba(139,0,0,0.35)" : "transparent",
                  border: `1px solid ${activeTool === t.id ? "rgba(201,168,76,0.4)" : "transparent"}`,
                  color: activeTool === t.id ? "var(--gold-light)" : locked ? "rgba(245,230,200,0.25)" : "rgba(245,230,200,0.5)",
                }}
              >
                <div className="text-base mb-0.5">{t.icon}</div>
                <div className="text-xs font-bold">{t.label} {locked && "🔒"}</div>
              </button>
            );
          })}

          {history.length > 0 && (
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(201,168,76,0.08)" }}>
              <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: "rgba(245,230,200,0.2)" }}>Recent</p>
              {history.slice(0, 5).map((h, i) => (
                <button key={i} onClick={() => { setActiveTool(h.tool); setPrompt(h.prompt); setResult(h.result); }}
                  className="w-full text-left px-2 py-1.5 rounded mb-1 text-xs truncate"
                  style={{ color: "rgba(245,230,200,0.3)", background: "rgba(255,255,255,0.02)" }}>
                  {TOOLS.find((t) => t.id === h.tool)?.icon} {h.prompt.slice(0, 28)}…
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!campaign ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="text-5xl">🗺️</div>
              <p style={{ color: "rgba(245,230,200,0.4)" }}>Select or create a campaign to use the tools.</p>
              <Link href="/campaign/new"><button className="btn-primary">Create Campaign</button></Link>
            </div>
          ) : (
            <>
              {/* Tool input */}
              <div className="p-5" style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{tool.icon}</span>
                  <h2 className="text-base font-bold text-gold">{tool.label}</h2>
                  {tool.minPlan && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{
                      background: "rgba(160,100,255,0.15)",
                      border: "1px solid rgba(160,100,255,0.4)",
                      color: "rgba(200,150,255,0.8)",
                    }}>
                      Legend
                    </span>
                  )}
                </div>
                <p className="text-xs mb-3" style={{ color: "rgba(245,230,200,0.4)" }}>{tool.desc}</p>

                {toolLocked ? (
                  <div className="p-4 rounded text-center" style={{ background: "rgba(160,100,255,0.08)", border: "1px solid rgba(160,100,255,0.2)" }}>
                    <p className="text-sm mb-3" style={{ color: "rgba(245,230,200,0.5)" }}>
                      This tool requires the <strong className="text-gold">Legend</strong> plan.
                    </p>
                    <Link href="/pricing"><button className="btn-primary text-sm">View Plans →</button></Link>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <textarea className="input-fantasy flex-1 resize-none" rows={3} placeholder={tool.placeholder}
                      value={prompt} onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleGenerate(); }}
                      disabled={loading} />
                    <button className="btn-primary self-end px-5" onClick={handleGenerate}
                      disabled={loading || !prompt.trim()} style={{ opacity: loading || !prompt.trim() ? 0.4 : 1, cursor: loading || !prompt.trim() ? "not-allowed" : "pointer" }}>
                      {loading ? "..." : "Generate"}
                    </button>
                  </div>
                )}

                {!toolLocked && (
                  <p className="text-xs mt-1" style={{ color: "rgba(245,230,200,0.2)" }}>
                    For: <span style={{ color: "rgba(201,168,76,0.5)" }}>{campaign.name}</span> &bull; {plan.name} plan &bull; Ctrl+Enter
                  </p>
                )}
              </div>

              {/* Result */}
              <div className="flex-1 overflow-y-auto p-5">
                {loading && (
                  <div className="flex items-center gap-3" style={{ color: "rgba(245,230,200,0.4)" }}>
                    <span className="cursor-blink" />
                    <span className="text-sm">The oracle consults the ancient tomes...</span>
                  </div>
                )}
                {!loading && !result && !toolLocked && (
                  <div className="text-center mt-12" style={{ color: "rgba(245,230,200,0.2)" }}>
                    <div className="text-5xl mb-3">{tool.icon}</div>
                    <p className="text-sm">Describe what you need, then click Generate.</p>
                  </div>
                )}
                {result && !loading && (
                  <div className="card-parchment p-5 fade-in max-w-3xl">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs uppercase tracking-widest" style={{ color: "rgba(201,168,76,0.5)" }}>{tool.label} — {campaign.name}</span>
                      <button onClick={() => navigator.clipboard.writeText(result)} className="btn-secondary text-xs py-1 px-2">Copy</button>
                    </div>
                    <div>{renderMarkdown(result)}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ToolsPage() {
  return <Suspense><ToolsInner /></Suspense>;
}
