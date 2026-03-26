"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { getCampaign, createSession, saveParty, saveNotes, saveHomebrew } from "@/lib/storage";
import { getPlan } from "@/lib/subscription";
import type { Campaign, PartyMember } from "@/lib/types";
import type { PlanId } from "@/lib/subscription";
import Navbar from "@/app/components/Navbar";

type Tab = "sessions" | "party" | "notes" | "homebrew";

const CLASSES = ["Barbarian","Bard","Cleric","Druid","Fighter","Monk","Paladin","Ranger","Rogue","Sorcerer","Warlock","Wizard","Artificer","Blood Hunter"];
const RACES = ["Human","Elf","Dwarf","Halfling","Gnome","Half-Elf","Half-Orc","Tiefling","Dragonborn","Aasimar","Tabaxi","Kenku","Firbolg","Goliath","Custom"];

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const userId = user?.id;
  const planId = (user?.publicMetadata?.planId as PlanId) ?? "free";
  const plan = getPlan(planId);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [tab, setTab] = useState<Tab>("sessions");
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [homebrew, setHomebrew] = useState("");
  const [homebrewSaved, setHomebrewSaved] = useState(false);
  const [party, setParty] = useState<PartyMember[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState<Omit<PartyMember, "id">>({ name: "", race: "Human", class: "Fighter", level: 1, hp: 10, maxHp: 10, ac: 10, notes: "" });

  useEffect(() => {
    const c = getCampaign(id, userId);
    if (!c) { router.push("/campaigns"); return; }
    setCampaign(c);
    setNotes(c.notes || "");
    setHomebrew(c.homebrewRules || "");
    setParty(c.party || []);
  }, [id, userId, router]);

  function handleNewSession() {
    if (!campaign) return;
    const title = sessionTitle.trim() || `Session ${(campaign.sessions?.length || 0) + 1}`;
    const session = createSession(campaign.id, title, userId);
    router.push(`/session/${campaign.id}/${session.id}`);
  }

  function handleSaveNotes() {
    if (!campaign) return;
    saveNotes(campaign.id, notes, userId);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  function handleSaveHomebrew() {
    if (!campaign) return;
    saveHomebrew(campaign.id, homebrew, userId);
    setHomebrewSaved(true);
    setTimeout(() => setHomebrewSaved(false), 2000);
  }

  function handleAddMember() {
    if (!campaign || !newMember.name.trim()) return;
    const member: PartyMember = { ...newMember, id: crypto.randomUUID() };
    const updated = [...party, member];
    setParty(updated);
    saveParty(campaign.id, updated, userId);
    setShowAddMember(false);
    setNewMember({ name: "", race: "Human", class: "Fighter", level: 1, hp: 10, maxHp: 10, ac: 10, notes: "" });
  }

  function handleUpdateHp(memberId: string, delta: number) {
    if (!campaign) return;
    const updated = party.map((m) => m.id === memberId ? { ...m, hp: Math.max(0, Math.min(m.maxHp, m.hp + delta)) } : m);
    setParty(updated);
    saveParty(campaign.id, updated, userId);
  }

  function handleRemoveMember(memberId: string) {
    if (!campaign) return;
    const updated = party.filter((m) => m.id !== memberId);
    setParty(updated);
    saveParty(campaign.id, updated, userId);
  }

  if (!campaign) return null;

  const tabs: { id: Tab; label: string; icon: string; locked?: boolean }[] = [
    { id: "sessions", label: "Sessions", icon: "📖" },
    { id: "party", label: "Party", icon: "⚔️", locked: !plan.canPartyTrack },
    { id: "notes", label: "Notes", icon: "📝", locked: !plan.canNotes },
    { id: "homebrew", label: "Homebrew", icon: "🔮", locked: !plan.canHomebrew },
  ];

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 100%)" }}>
      <Navbar />

      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <Link href="/campaigns" className="text-xs text-gold opacity-50 hover:opacity-100 transition-opacity">← All Campaigns</Link>
            <h1 className="text-3xl font-bold text-gold mt-1">{campaign.name}</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(245,230,200,0.45)" }}>
              {campaign.setting} &bull; {campaign.tone} &bull; Party of {campaign.partySize} &bull; Level {campaign.partyLevel}
            </p>
          </div>
          <Link href={`/tools?campaign=${campaign.id}`}>
            <button className="btn-secondary text-sm">🛠 GM Tools</button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6" style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => t.locked ? router.push("/pricing") : setTab(t.id)}
              className="px-4 py-2 text-sm transition-all relative"
              style={{
                color: tab === t.id ? "var(--gold)" : "rgba(245,230,200,0.4)",
                borderBottom: tab === t.id ? "2px solid var(--gold)" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {t.icon} {t.label}
              {t.locked && <span className="ml-1 text-xs opacity-50">🔒</span>}
            </button>
          ))}
        </div>

        {/* Sessions tab */}
        {tab === "sessions" && (
          <div className="fade-in space-y-6">
            {/* Lore */}
            <div className="card-parchment p-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gold opacity-50 mb-3">Campaign Lore</h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(245,230,200,0.6)", fontStyle: "italic" }}>{campaign.lore}</p>
            </div>

            {/* New Session */}
            <div className="card-parchment p-5">
              <h2 className="text-base font-bold text-gold mb-3">▶ Start a New Session</h2>
              <div className="flex gap-3">
                <input
                  className="input-fantasy flex-1"
                  placeholder={`Session ${(campaign.sessions?.length || 0) + 1} — Give this chapter a name...`}
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
                <h2 className="text-base font-bold text-gold mb-3">Past Sessions</h2>
                <div className="space-y-2">
                  {[...campaign.sessions].reverse().map((s) => (
                    <div key={s.id} className="card-parchment p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "rgba(245,230,200,0.85)" }}>{s.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(245,230,200,0.3)" }}>
                          {new Date(s.createdAt).toLocaleDateString()} &bull; {s.messages.length} messages
                          {s.recap && <span className="ml-2 text-gold opacity-60">✓ Recap</span>}
                        </p>
                      </div>
                      <Link href={`/session/${campaign.id}/${s.id}`}>
                        <button className="btn-secondary text-xs py-1 px-3">Resume</button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Party tab */}
        {tab === "party" && (
          <div className="fade-in space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "rgba(245,230,200,0.4)" }}>
                Track your adventurers&apos; HP, AC, and notes during sessions.
              </p>
              <button className="btn-primary text-sm" onClick={() => setShowAddMember(true)}>+ Add Member</button>
            </div>

            {party.length === 0 && !showAddMember && (
              <div className="card-parchment p-10 text-center">
                <div className="text-4xl mb-3">⚔️</div>
                <p style={{ color: "rgba(245,230,200,0.4)" }}>No party members yet. Add your adventurers!</p>
              </div>
            )}

            {party.map((member) => (
              <div key={member.id} className="card-parchment p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gold">{member.name}</h3>
                    <p className="text-xs" style={{ color: "rgba(245,230,200,0.45)" }}>
                      {member.race} {member.class} &bull; Level {member.level} &bull; AC {member.ac}
                    </p>
                  </div>
                  <button onClick={() => handleRemoveMember(member.id)} className="text-xs opacity-25 hover:opacity-60 transition-opacity">✕</button>
                </div>

                {/* HP bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: "rgba(245,230,200,0.4)" }}>HP</span>
                    <span className="text-sm font-bold" style={{ color: member.hp === 0 ? "#ef4444" : member.hp < member.maxHp * 0.3 ? "#f97316" : "var(--gold)" }}>
                      {member.hp} / {member.maxHp}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${(member.hp / member.maxHp) * 100}%`,
                        background: member.hp === 0 ? "#ef4444" : member.hp < member.maxHp * 0.3 ? "#f97316" : "var(--blood)",
                      }} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[-10, -5, -1, 1, 5, 10].map((d) => (
                      <button key={d} onClick={() => handleUpdateHp(member.id, d)}
                        className="flex-1 py-1 rounded text-xs transition-all"
                        style={{
                          background: d < 0 ? "rgba(139,0,0,0.3)" : "rgba(0,100,0,0.3)",
                          border: `1px solid ${d < 0 ? "rgba(139,0,0,0.5)" : "rgba(0,150,0,0.5)"}`,
                          color: d < 0 ? "#fca5a5" : "#86efac",
                        }}>
                        {d > 0 ? `+${d}` : d}
                      </button>
                    ))}
                  </div>
                </div>

                {member.notes && (
                  <p className="text-xs" style={{ color: "rgba(245,230,200,0.35)", fontStyle: "italic" }}>{member.notes}</p>
                )}
              </div>
            ))}

            {/* Add member form */}
            {showAddMember && (
              <div className="card-parchment p-5 fade-in">
                <h3 className="font-bold text-gold mb-4">New Party Member</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="col-span-2">
                    <label className="block text-xs mb-1" style={{ color: "rgba(245,230,200,0.4)" }}>Name *</label>
                    <input className="input-fantasy" placeholder="Character name" value={newMember.name}
                      onChange={(e) => setNewMember((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "rgba(245,230,200,0.4)" }}>Race</label>
                    <select className="input-fantasy" value={newMember.race} onChange={(e) => setNewMember((p) => ({ ...p, race: e.target.value }))}>
                      {RACES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "rgba(245,230,200,0.4)" }}>Class</label>
                    <select className="input-fantasy" value={newMember.class} onChange={(e) => setNewMember((p) => ({ ...p, class: e.target.value }))}>
                      {CLASSES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "rgba(245,230,200,0.4)" }}>Level</label>
                    <input type="number" className="input-fantasy" min={1} max={20} value={newMember.level}
                      onChange={(e) => setNewMember((p) => ({ ...p, level: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "rgba(245,230,200,0.4)" }}>AC</label>
                    <input type="number" className="input-fantasy" min={1} max={30} value={newMember.ac}
                      onChange={(e) => setNewMember((p) => ({ ...p, ac: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "rgba(245,230,200,0.4)" }}>Max HP</label>
                    <input type="number" className="input-fantasy" min={1} value={newMember.maxHp}
                      onChange={(e) => setNewMember((p) => ({ ...p, maxHp: Number(e.target.value), hp: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "rgba(245,230,200,0.4)" }}>Current HP</label>
                    <input type="number" className="input-fantasy" min={0} max={newMember.maxHp} value={newMember.hp}
                      onChange={(e) => setNewMember((p) => ({ ...p, hp: Number(e.target.value) }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs mb-1" style={{ color: "rgba(245,230,200,0.4)" }}>Notes (optional)</label>
                    <input className="input-fantasy" placeholder="Player name, special abilities, etc." value={newMember.notes}
                      onChange={(e) => setNewMember((p) => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary text-sm" onClick={handleAddMember} disabled={!newMember.name.trim()}>Add to Party</button>
                  <button className="btn-secondary text-sm" onClick={() => setShowAddMember(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes tab */}
        {tab === "notes" && (
          <div className="fade-in">
            <p className="text-sm mb-3" style={{ color: "rgba(245,230,200,0.4)" }}>
              Free-form notes for this campaign. Jot down clues, important NPCs, locations, or anything you want to remember.
            </p>
            <textarea
              className="input-fantasy w-full mb-3"
              rows={18}
              placeholder="Write your notes here...&#10;&#10;## NPCs&#10;- Theron, the innkeeper — knows about the cult&#10;&#10;## Locations&#10;- The Ashen Chapel — east of Thornwall&#10;&#10;## Clues&#10;- The missing villagers were last seen near the old mill..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.85rem" }}
            />
            <button className="btn-primary text-sm" onClick={handleSaveNotes}>
              {notesSaved ? "✓ Saved!" : "Save Notes"}
            </button>
          </div>
        )}

        {/* Homebrew tab */}
        {tab === "homebrew" && (
          <div className="fade-in">
            <p className="text-sm mb-3" style={{ color: "rgba(245,230,200,0.4)" }}>
              Define custom rules, house rules, or special mechanics. The AI DM will follow these during sessions.
            </p>
            <textarea
              className="input-fantasy w-full mb-3"
              rows={18}
              placeholder="e.g.&#10;- Critical hits deal max damage + roll&#10;- Death saves are made in secret by the DM&#10;- Players can spend Inspiration to reroll any d20&#10;- The Lingering Injuries table is used on crits&#10;- Flanking grants advantage&#10;- Short rest takes 10 minutes instead of 1 hour"
              value={homebrew}
              onChange={(e) => setHomebrew(e.target.value)}
              style={{ resize: "vertical", fontFamily: "monospace", fontSize: "0.85rem" }}
            />
            <button className="btn-primary text-sm" onClick={handleSaveHomebrew}>
              {homebrewSaved ? "✓ Saved!" : "Save Rules"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
