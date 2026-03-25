"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCampaign, addMessage } from "@/lib/storage";
import type { Campaign, Session, Message } from "@/lib/types";

export default function SessionPage() {
  const { campaignId, sessionId } = useParams<{ campaignId: string; sessionId: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const c = getCampaign(campaignId);
    if (!c) { router.push("/campaigns"); return; }
    const s = c.sessions.find((s) => s.id === sessionId);
    if (!s) { router.push(`/campaigns/${campaignId}`); return; }
    setCampaign(c);
    setSession(s);
    setMessages(s.messages);

    // Auto-open with DM intro if first time
    if (s.messages.length === 0) {
      setTimeout(() => sendMessage("", c, s, []), 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  async function sendMessage(playerInput: string, c?: Campaign, s?: Session, existingMsgs?: Message[]) {
    const activeCampaign = c || campaign;
    const activeSession = s || session;
    const currentMsgs = existingMsgs ?? messages;
    if (!activeCampaign || !activeSession) return;
    if (loading) return;

    const newMessages = [...currentMsgs];

    if (playerInput.trim()) {
      const playerMsg: Message = { role: "player", content: playerInput.trim(), timestamp: new Date().toISOString() };
      newMessages.push(playerMsg);
      setMessages([...newMessages]);
      addMessage(campaignId, sessionId, playerMsg);
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
        const chunk = decoder.decode(value);
        full += chunk;
        setStreamText(full);
      }

      const dmMsg: Message = { role: "dm", content: full, timestamp: new Date().toISOString() };
      const finalMsgs = [...newMessages, dmMsg];
      setMessages(finalMsgs);
      addMessage(campaignId, sessionId, dmMsg);
      setStreamText("");
    } catch (err) {
      console.error(err);
      setStreamText("*The magic falters... An error occurred. Check your API key.*");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) sendMessage(input);
    }
  }

  if (!campaign || !session) return null;

  return (
    <main className="flex flex-col h-screen" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #150e0e 100%)" }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 shrink-0" style={{ borderBottom: "1px solid rgba(201,168,76,0.2)", background: "rgba(0,0,0,0.4)" }}>
        <div className="flex items-center gap-4">
          <Link href={`/campaigns/${campaignId}`} className="text-gold opacity-50 hover:opacity-100 transition-opacity text-sm">← {campaign.name}</Link>
          <span className="text-sm font-semibold" style={{ color: "rgba(245,230,200,0.8)" }}>{session.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "rgba(245,230,200,0.3)" }}>
            {campaign.setting} &bull; {campaign.tone} &bull; Lvl {campaign.partyLevel}
          </span>
          <Link href={`/tools?campaign=${campaignId}`}>
            <button className="btn-secondary text-xs py-1 px-3">🛠 Tools</button>
          </Link>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`fade-in ${msg.role === "dm" ? "msg-dm" : "msg-player"}`}>
              <div className="flex items-center gap-2 mb-2">
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

          {/* Streaming */}
          {(loading || streamText) && (
            <div className="msg-dm fade-in">
              <div className="flex items-center gap-2 mb-2">
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
      <div className="shrink-0 px-4 py-4" style={{ borderTop: "1px solid rgba(201,168,76,0.15)", background: "rgba(0,0,0,0.3)" }}>
        <div className="max-w-3xl mx-auto flex gap-3">
          <textarea
            ref={textareaRef}
            className="input-fantasy flex-1 resize-none"
            rows={2}
            placeholder="Describe your action, speak as your character, or ask the DM a question… (Enter to send, Shift+Enter for newline)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            style={{ opacity: loading ? 0.5 : 1 }}
          />
          <button
            className="btn-primary px-5 self-end"
            onClick={() => input.trim() && sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{ opacity: loading || !input.trim() ? 0.4 : 1, cursor: loading || !input.trim() ? "not-allowed" : "pointer" }}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
        <p className="text-xs text-center mt-2" style={{ color: "rgba(245,230,200,0.2)" }}>
          Powered by Gemini AI &bull; Describe your actions as a party &bull; The DM will narrate the outcome
        </p>
      </div>
    </main>
  );
}
