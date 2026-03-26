"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { getCampaign, addMessage, saveSessionRecap } from "@/lib/storage";
import { getPlan } from "@/lib/subscription";
import type { Campaign, Session, Message, InitiativeCombatant } from "@/lib/types";
import type { PlanId } from "@/lib/subscription";

type SidePanel = "dice" | "initiative" | null;

const DICE = [
  { label: "d4", sides: 4 },
  { label: "d6", sides: 6 },
  { label: "d8", sides: 8 },
  { label: "d10", sides: 10 },
  { label: "d12", sides: 12 },
  { label: "d20", sides: 20 },
  { label: "d100", sides: 100 },
];

function roll(sides: number) {
  return Math.floor(Math.random() * sides) + 1;
}

export default function SessionPage() {
  const { campaignId, sessionId } = useParams<{ campaignId: string; sessionId: string }>();
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.id;
  const planId = (user?.publicMetadata?.planId as PlanId) ?? "free";
  const plan = getPlan(planId);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);

  // Dice
  const [diceLog, setDiceLog] = useState<{ label: string; result: number; max: number }[]>([]);
  const [diceCount, setDiceCount] = useState(1);

  // Initiative
  const [combatants, setCombatants] = useState<InitiativeCombatant[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [newCombatant, setNewCombatant] = useState({ name: "", initiative: 10, hp: 10, maxHp: 10, isPlayer: true });
  const [showAddCombatant, setShowAddCombatant] = useState(false);

  // Recap
  const [recapLoading, setRecapLoading] = useState(false);
  const [recap, setRecap] = useState("");
  const [showRecap, setShowRecap] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = getCampaign(campaignId, userId);
    if (!c) { router.push("/campaigns"); return; }
    const s = c.sessions.find((s) => s.id === sessionId);
    if (!s) { router.push(`/campaigns/${campaignId}`); return; }
    setCampaign(c);
    setSession(s);
    setMessages(s.messages);
    if (s.recap) setRecap(s.recap);

    if (s.messages.length === 0) {
      setTimeout(() => sendMessage("", c, s, []), 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, sessionId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  const sendMessage = useCallback(async (playerInput: string, c?: Campaign, s?: Session, existingMsgs?: Message[]) => {
    const activeCampaign = c || campaign;
    const activeSession = s || session;
    const currentMsgs = existingMsgs ?? messages;
    if (!activeCampaign || !activeSession || loading) return;

    const newMessages = [...currentMsgs];

    if (playerInput.trim()) {
      const playerMsg: Message = { role: "player", content: playerInput.trim(), timestamp: new Date().toISOString() };
      newMessages.push(playerMsg);
      setMessages([...newMessages]);
      addMessage(campaignId, sessionId, playerMsg, userId);
      setInput("");
    }

    setLoading(true);
    setStreamText("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "session",
          campaign: activeCampaign,
          sessionTitle: activeSession.title,
          messages: newMessages,
          playerInput: playerInput.trim(),
        }),
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value);
        setStreamText(full);
      }

      const dmMsg: Message = { role: "dm", content: full, timestamp: new Date().toISOString() };
      setMessages([...newMessages, dmMsg]);
      addMessage(campaignId, sessionId, dmMsg, userId);
      setStreamText("");
    } catch (err) {
      console.error(err);
      setStreamText("*The magic falters... An error occurred.*");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign, session, messages, loading, campaignId, sessionId, userId]);

  async function handleRecap() {
    if (!campaign || !session || recapLoading) return;
    setRecapLoading(true);
    setShowRecap(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "tool", campaign, toolType: "recap", prompt: JSON.stringify(messages.slice(-30)) }),
      });
      const text = await res.text();
      setRecap(text);
      saveSessionRecap(campaignId, sessionId, text, userId);
    } finally {
      setRecapLoading(false);
    }
  }

  function handleExport() {
    if (!campaign || !session) return;
    const lines = [
      `# ${campaign.name} — ${session.title}`,
      `Date: ${new Date(session.createdAt).toLocaleDateString()}`,
      "",
      ...messages.map((m) => `[${m.role === "dm" ? "DUNGEON MASTER" : "PARTY"}]\n${m.content}`),
      recap ? `\n---\n# Session Recap\n${recap}` : "",
    ];
    const blob = new Blob([lines.join("\n\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${campaign.name} - ${session.title}.txt`;
    a.click();
  }

  function rollDice(sides: number) {
    const results = Array.from({ length: diceCount }, () => roll(sides));
    const total = results.reduce((a, b) => a + b, 0);
    setDiceLog((prev) => [{ label: `${diceCount}d${sides}`, result: total, max: sides * diceCount }, ...prev.slice(0, 19)]);
  }

  function addCombatant() {
    if (!newCombatant.name.trim()) return;
    const sorted = [...combatants, { ...newCombatant, id: crypto.randomUUID() }]
      .sort((a, b) => b.initiative - a.initiative);
    setCombatants(sorted);
    setShowAddCombatant(false);
    setNewCombatant({ name: "", initiative: 10, hp: 10, maxHp: 10, isPlayer: true });
  }

  function updateCombatantHp(id: string, delta: number) {
    setCombatants((prev) => prev.map((c) => c.id === id ? { ...c, hp: Math.max(0, Math.min(c.maxHp, c.hp + delta)) } : c));
  }

  function nextTurn() {
    setCurrentTurn((prev) => (prev + 1) % combatants.length);
  }

  if (!campaign || !session) return null;

  const sorted = [...combatants];
  const activeCombatant = sorted[currentTurn];

  return (
    <main className="flex flex-col h-screen" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #150e0e 100%)" }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ borderBottom: "1px solid rgba(201,168,76,0.2)", background: "rgba(0,0,0,0.5)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/campaigns/${campaignId}`} className="text-gold opacity-50 hover:opacity-100 transition-opacity text-sm shrink-0">←</Link>
          <div className="min-w-0">
            <span className="text-sm font-semibold block truncate" style={{ color: "rgba(245,230,200,0.85)" }}>{session.title}</span>
            <span className="text-xs truncate" style={{ color: "rgba(245,230,200,0.3)" }}>{campaign.name} &bull; Lvl {campaign.partyLevel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Dice toggle */}
          <button
            onClick={() => setSidePanel((p) => p === "dice" ? null : "dice")}
            className="text-xs py-1 px-2 rounded transition-all"
            title="Dice Roller"
            style={{
              background: sidePanel === "dice" ? "rgba(201,168,76,0.15)" : "transparent",
              border: `1px solid ${sidePanel === "dice" ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.1)"}`,
              color: sidePanel === "dice" ? "var(--gold)" : "rgba(245,230,200,0.4)",
            }}
          >🎲 Dice</button>

          {/* Initiative toggle */}
          {plan.canInitiative && (
            <button
              onClick={() => setSidePanel((p) => p === "initiative" ? null : "initiative")}
              className="text-xs py-1 px-2 rounded transition-all"
              title="Initiative Tracker"
              style={{
                background: sidePanel === "initiative" ? "rgba(139,0,0,0.2)" : "transparent",
                border: `1px solid ${sidePanel === "initiative" ? "rgba(139,0,0,0.6)" : "rgba(255,255,255,0.1)"}`,
                color: sidePanel === "initiative" ? "#fca5a5" : "rgba(245,230,200,0.4)",
              }}
            >⚔️ Combat</button>
          )}

          {/* Recap */}
          {plan.canRecap && (
            <button
              onClick={() => showRecap ? setShowRecap(false) : (recap ? setShowRecap(true) : handleRecap())}
              className="text-xs py-1 px-2 rounded transition-all"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,230,200,0.4)" }}
            >
              {recapLoading ? "..." : "📜 Recap"}
            </button>
          )}

          {/* Export */}
          {plan.canExport && (
            <button onClick={handleExport} className="text-xs py-1 px-2 rounded transition-all"
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(245,230,200,0.4)" }}>
              ↓ Export
            </button>
          )}

          <Link href={`/tools?campaign=${campaignId}`}>
            <button className="btn-secondary text-xs py-1 px-2">🛠 Tools</button>
          </Link>
        </div>
      </header>

      {/* Recap overlay */}
      {showRecap && (
        <div className="shrink-0 p-4" style={{ background: "rgba(0,0,0,0.5)", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
          <div className="max-w-3xl mx-auto flex items-start gap-3">
            <div className="flex-1 text-sm leading-relaxed" style={{ color: "rgba(245,230,200,0.7)" }}>
              {recapLoading ? <span style={{ color: "rgba(245,230,200,0.3)" }}>Generating session recap...</span> : recap}
            </div>
            <button onClick={() => setShowRecap(false)} className="text-gold opacity-40 hover:opacity-80 shrink-0">✕</button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Messages */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`fade-in ${msg.role === "dm" ? "msg-dm" : "msg-player"}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: msg.role === "dm" ? "var(--blood)" : "#2a7ac0" }}>
                      {msg.role === "dm" ? "🎲 Dungeon Master" : "⚔️ Party"}
                    </span>
                    <span className="text-xs" style={{ color: "rgba(245,230,200,0.2)" }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(245,230,200,0.85)" }}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {(loading || streamText) && (
                <div className="msg-dm fade-in">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--blood)" }}>🎲 Dungeon Master</span>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "rgba(245,230,200,0.85)" }}>
                    {streamText || <span style={{ color: "rgba(245,230,200,0.3)" }}>The DM considers the situation...</span>}
                    {loading && <span className="cursor-blink" />}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="shrink-0 px-4 py-3" style={{ borderTop: "1px solid rgba(201,168,76,0.1)", background: "rgba(0,0,0,0.3)" }}>
            <div className="max-w-3xl mx-auto flex gap-3">
              <textarea
                className="input-fantasy flex-1 resize-none"
                rows={2}
                placeholder="Describe your action or speak in character… (Enter to send, Shift+Enter for newline)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (input.trim()) sendMessage(input); } }}
                disabled={loading}
                style={{ opacity: loading ? 0.5 : 1 }}
              />
              <button className="btn-primary px-5 self-end" onClick={() => input.trim() && sendMessage(input)}
                disabled={loading || !input.trim()} style={{ opacity: loading || !input.trim() ? 0.4 : 1, cursor: loading || !input.trim() ? "not-allowed" : "pointer" }}>
                {loading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>

        {/* Side panel */}
        {sidePanel && (
          <aside className="w-64 shrink-0 flex flex-col overflow-hidden" style={{ borderLeft: "1px solid rgba(201,168,76,0.15)", background: "rgba(0,0,0,0.3)" }}>

            {/* Dice Roller */}
            {sidePanel === "dice" && (
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-bold text-gold mb-3">🎲 Dice Roller</h3>

                <div className="mb-3">
                  <label className="text-xs mb-1 block" style={{ color: "rgba(245,230,200,0.4)" }}>Count</label>
                  <div className="flex gap-1">
                    {[1,2,3,4].map((n) => (
                      <button key={n} onClick={() => setDiceCount(n)}
                        className="flex-1 py-1 rounded text-sm"
                        style={{
                          background: diceCount === n ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${diceCount === n ? "var(--gold)" : "rgba(255,255,255,0.1)"}`,
                          color: diceCount === n ? "var(--gold)" : "rgba(245,230,200,0.5)",
                        }}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {DICE.map(({ label, sides }) => (
                    <button key={label} onClick={() => rollDice(sides)}
                      className="py-2 rounded font-bold text-sm transition-all hover:scale-105"
                      style={{ background: "rgba(139,0,0,0.3)", border: "1px solid rgba(139,0,0,0.6)", color: "var(--gold-light)" }}>
                      {diceCount > 1 ? `${diceCount}${label}` : label}
                    </button>
                  ))}
                </div>

                {diceLog.length > 0 && (
                  <>
                    <h4 className="text-xs mb-2 uppercase tracking-widest" style={{ color: "rgba(245,230,200,0.3)" }}>Roll History</h4>
                    <div className="space-y-1.5">
                      {diceLog.map((r, i) => (
                        <div key={i} className="flex items-center justify-between px-2 py-1 rounded"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          <span className="text-xs" style={{ color: "rgba(245,230,200,0.4)" }}>{r.label}</span>
                          <span className="font-bold text-sm" style={{
                            color: r.result === r.max ? "#ffd700" : r.result === diceCount ? "#ef4444" : "var(--gold-light)",
                          }}>
                            {r.result}
                            {r.result === r.max && " ✦"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Initiative Tracker */}
            {sidePanel === "initiative" && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gold">⚔️ Initiative</h3>
                  {combatants.length > 0 && (
                    <button onClick={nextTurn} className="btn-primary text-xs py-1 px-2">Next →</button>
                  )}
                </div>

                {combatants.length > 0 && activeCombatant && (
                  <div className="mb-3 px-2 py-1.5 rounded text-xs" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}>
                    <span style={{ color: "rgba(245,230,200,0.5)" }}>Turn: </span>
                    <span className="font-bold text-gold">{activeCombatant.name}</span>
                  </div>
                )}

                <div className="space-y-2 mb-3">
                  {combatants.map((c, i) => (
                    <div key={c.id} className="rounded p-2" style={{
                      background: i === currentTurn ? "rgba(139,0,0,0.3)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${i === currentTurn ? "rgba(139,0,0,0.6)" : "rgba(255,255,255,0.08)"}`,
                    }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold" style={{ color: i === currentTurn ? "var(--gold)" : "rgba(245,230,200,0.7)" }}>
                          {i === currentTurn ? "▶ " : ""}{c.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs" style={{ color: "rgba(245,230,200,0.3)" }}>Init: {c.initiative}</span>
                          <button onClick={() => setCombatants((prev) => prev.filter((x) => x.id !== c.id))} className="text-xs opacity-20 hover:opacity-60 ml-1">✕</button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full" style={{ width: `${(c.hp / c.maxHp) * 100}%`, background: c.hp === 0 ? "#ef4444" : c.isPlayer ? "#2a7ac0" : "var(--blood)" }} />
                        </div>
                        <span className="text-xs" style={{ color: "rgba(245,230,200,0.4)" }}>{c.hp}/{c.maxHp}</span>
                      </div>
                      <div className="flex gap-1 mt-1.5">
                        {[-5, -1, 1, 5].map((d) => (
                          <button key={d} onClick={() => updateCombatantHp(c.id, d)}
                            className="flex-1 text-xs py-0.5 rounded"
                            style={{
                              background: d < 0 ? "rgba(139,0,0,0.3)" : "rgba(0,100,0,0.3)",
                              border: `1px solid ${d < 0 ? "rgba(139,0,0,0.4)" : "rgba(0,150,0,0.4)"}`,
                              color: d < 0 ? "#fca5a5" : "#86efac",
                            }}>
                            {d > 0 ? `+${d}` : d}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {showAddCombatant ? (
                  <div className="space-y-2 p-2 rounded" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <input className="input-fantasy text-xs py-1" placeholder="Name" value={newCombatant.name}
                      onChange={(e) => setNewCombatant((p) => ({ ...p, name: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="text-xs" style={{ color: "rgba(245,230,200,0.3)" }}>Initiative</label>
                        <input type="number" className="input-fantasy text-xs py-1" value={newCombatant.initiative}
                          onChange={(e) => setNewCombatant((p) => ({ ...p, initiative: Number(e.target.value) }))} />
                      </div>
                      <div>
                        <label className="text-xs" style={{ color: "rgba(245,230,200,0.3)" }}>Max HP</label>
                        <input type="number" className="input-fantasy text-xs py-1" value={newCombatant.maxHp}
                          onChange={(e) => setNewCombatant((p) => ({ ...p, maxHp: Number(e.target.value), hp: Number(e.target.value) }))} />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(245,230,200,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
                        onClick={() => setNewCombatant((p) => ({ ...p, isPlayer: !p.isPlayer }))}>
                        {newCombatant.isPlayer ? "👤 Player" : "💀 Enemy"}
                      </button>
                      <button className="flex-1 btn-primary text-xs py-1" onClick={addCombatant} disabled={!newCombatant.name.trim()}>Add</button>
                      <button className="btn-secondary text-xs py-1 px-2" onClick={() => setShowAddCombatant(false)}>✕</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <button className="w-full btn-secondary text-xs py-1.5" onClick={() => setShowAddCombatant(true)}>+ Add Combatant</button>
                    {combatants.length > 0 && (
                      <button className="w-full text-xs py-1" style={{ color: "rgba(245,230,200,0.2)" }}
                        onClick={() => { setCombatants([]); setCurrentTurn(0); }}>Clear all</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </main>
  );
}
