"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCampaign, getCampaigns } from "@/lib/storage";
import type { Campaign } from "@/lib/types";

type ToolType = "npc" | "encounter" | "dungeon" | "general";

const TOOLS: { id: ToolType; icon: string; label: string; desc: string; placeholder: string }[] = [
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
    desc: "Design a balanced combat or social encounter scaled to your party's level.",
    placeholder: "e.g. An ambush on the forest road by bandits allied with a werewolf leader",
  },
  {
    id: "dungeon",
    icon: "🏰",
    label: "Dungeon Builder",
    desc: "Generate a dungeon or location with rooms, traps, monsters, and secrets.",
    placeholder: "e.g. An abandoned dwarven mine now occupied by undead and a lich's phylactery hidden in the deepest vault",
  },
  {
    id: "general",
    icon: "📜",
    label: "Ask the Oracle",
    desc: "Ask anything — lore questions, rulings, plot ideas, magic items, random tables.",
    placeholder: "e.g. What are some interesting complications that could arise when the party tries to negotiate with a dragon?",
  },
];

function ToolsInner() {
  const searchParams = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [activeTool, setActiveTool] = useState<ToolType>("npc");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ tool: ToolType; prompt: string; result: string }[]>([]);

  useEffect(() => {
    const all = getCampaigns();
    setCampaigns(all);
    const qId = searchParams.get("campaign");
    if (qId && all.find((c) => c.id === qId)) {
      setSelectedCampaignId(qId);
    } else if (all.length > 0) {
      setSelectedCampaignId(all[0].id);
    }
  }, [searchParams]);

  const campaign = selectedCampaignId ? getCampaign(selectedCampaignId) : null;
  const tool = TOOLS.find((t) => t.id === activeTool)!;

  async function handleGenerate() {
    if (!campaign || !prompt.trim() || loading) return;
    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tool",
          campaign,
          toolType: activeTool,
          prompt: prompt.trim(),
        }),
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
    // Simple markdown: headers, bold, bullets
    return text
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("### ")) return <h3 key={i} className="text-base font-bold mt-4 mb-1" style={{ color: "var(--gold)" }}>{line.slice(4)}</h3>;
        if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-bold mt-5 mb-2" style={{ color: "var(--gold)" }}>{line.slice(3)}</h2>;
        if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold mt-5 mb-2 text-gold">{line.slice(2)}</h1>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="ml-4 text-sm leading-relaxed" style={{ color: "rgba(245,230,200,0.8)" }}>• {line.slice(2)}</li>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-bold text-sm" style={{ color: "rgba(245,230,200,0.9)" }}>{line.slice(2, -2)}</p>;
        if (line === "") return <br key={i} />;
        return <p key={i} className="text-sm leading-relaxed" style={{ color: "rgba(245,230,200,0.75)" }}>{line}</p>;
      });
  }

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 100%)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
        <div className="flex items-center gap-4">
          <Link href="/campaigns" className="text-gold opacity-60 hover:opacity-100 transition-opacity text-sm">← Campaigns</Link>
          <h1 className="text-xl font-bold text-gold">🛠 GM Tools</h1>
        </div>
        {campaigns.length > 0 && (
          <select
            className="input-fantasy text-sm"
            style={{ width: "auto", minWidth: "180px" }}
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 p-4 space-y-2" style={{ borderRight: "1px solid rgba(201,168,76,0.15)" }}>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTool(t.id); setResult(""); setPrompt(""); }}
              className="w-full text-left px-3 py-3 rounded transition-all"
              style={{
                background: activeTool === t.id ? "rgba(139,0,0,0.4)" : "transparent",
                border: `1px solid ${activeTool === t.id ? "rgba(201,168,76,0.5)" : "transparent"}`,
                color: activeTool === t.id ? "var(--gold-light)" : "rgba(245,230,200,0.5)",
              }}
            >
              <div className="text-lg mb-1">{t.icon}</div>
              <div className="text-xs font-bold">{t.label}</div>
            </button>
          ))}

          {history.length > 0 && (
            <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
              <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: "rgba(245,230,200,0.3)" }}>Recent</p>
              {history.slice(0, 5).map((h, i) => (
                <button key={i} onClick={() => { setActiveTool(h.tool); setPrompt(h.prompt); setResult(h.result); }}
                  className="w-full text-left px-2 py-2 rounded mb-1 text-xs truncate"
                  style={{ color: "rgba(245,230,200,0.35)", background: "rgba(255,255,255,0.02)" }}>
                  {TOOLS.find(t => t.id === h.tool)?.icon} {h.prompt.slice(0, 30)}…
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!campaign ? (
            <div className="flex-1 flex items-center justify-center flex-col gap-4">
              <div className="text-5xl">🗺️</div>
              <p style={{ color: "rgba(245,230,200,0.4)" }}>Select or create a campaign to use the tools.</p>
              <Link href="/campaign/new"><button className="btn-primary">Create Campaign</button></Link>
            </div>
          ) : (
            <>
              {/* Tool input */}
              <div className="p-6" style={{ borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{tool.icon}</span>
                  <h2 className="text-lg font-bold text-gold">{tool.label}</h2>
                </div>
                <p className="text-sm mb-4" style={{ color: "rgba(245,230,200,0.45)" }}>{tool.desc}</p>
                <div className="flex gap-3">
                  <textarea
                    className="input-fantasy flex-1 resize-none"
                    rows={3}
                    placeholder={tool.placeholder}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleGenerate(); }}
                    disabled={loading}
                  />
                  <button
                    className="btn-primary self-end px-6"
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    style={{ opacity: loading || !prompt.trim() ? 0.4 : 1, cursor: loading || !prompt.trim() ? "not-allowed" : "pointer" }}
                  >
                    {loading ? "..." : "Generate"}
                  </button>
                </div>
                <p className="text-xs mt-1" style={{ color: "rgba(245,230,200,0.2)" }}>
                  Generating for: <span style={{ color: "rgba(201,168,76,0.5)" }}>{campaign.name}</span> &bull; Ctrl+Enter to generate
                </p>
              </div>

              {/* Result */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading && (
                  <div className="flex items-center gap-3" style={{ color: "rgba(245,230,200,0.4)" }}>
                    <span className="cursor-blink" />
                    <span className="text-sm">The oracle consults the ancient tomes...</span>
                  </div>
                )}
                {!loading && !result && (
                  <div className="text-center mt-16" style={{ color: "rgba(245,230,200,0.2)" }}>
                    <div className="text-5xl mb-4">{tool.icon}</div>
                    <p>Describe what you need, then click Generate.</p>
                  </div>
                )}
                {result && !loading && (
                  <div className="card-parchment p-6 fade-in max-w-3xl">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs uppercase tracking-widest" style={{ color: "rgba(201,168,76,0.5)" }}>{tool.label} Result</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(result)}
                        className="text-xs btn-secondary py-1 px-2"
                      >
                        Copy
                      </button>
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
  return (
    <Suspense>
      <ToolsInner />
    </Suspense>
  );
}
