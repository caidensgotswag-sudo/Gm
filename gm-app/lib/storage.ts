import type { Campaign, Session, Message, PartyMember, Quest, TrackedNPC, TimelineEvent, Faction } from "./types";

function storageKey(userId?: string) {
  return userId ? `dungeon_forge_campaigns_${userId}` : "dungeon_forge_campaigns";
}

function themeKey() { return "dungeon_forge_theme"; }

export function getTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(themeKey()) as "dark" | "light") ?? "dark";
}

export function setTheme(theme: "dark" | "light") {
  localStorage.setItem(themeKey(), theme);
  document.documentElement.setAttribute("data-theme", theme);
}

export function getCampaigns(userId?: string): Campaign[] {
  if (typeof window === "undefined") return [];
  try {
    const key = storageKey(userId);
    const data = localStorage.getItem(key);
    if (!data && userId) {
      const legacy = localStorage.getItem("dungeon_forge_campaigns");
      if (legacy) {
        localStorage.setItem(key, legacy);
        localStorage.removeItem("dungeon_forge_campaigns");
        return JSON.parse(legacy);
      }
    }
    return JSON.parse(data || "[]");
  } catch { return []; }
}

export function getCampaign(id: string, userId?: string): Campaign | null {
  return getCampaigns(userId).find((c) => c.id === id) ?? null;
}

export function saveCampaign(campaign: Campaign, userId?: string): void {
  const key = storageKey(userId);
  const campaigns = getCampaigns(userId).filter((c) => c.id !== campaign.id);
  localStorage.setItem(key, JSON.stringify([...campaigns, campaign]));
}

export function deleteCampaign(id: string, userId?: string): void {
  const key = storageKey(userId);
  localStorage.setItem(key, JSON.stringify(getCampaigns(userId).filter((c) => c.id !== id)));
}

export function createSession(campaignId: string, title: string, userId?: string): Session {
  const session: Session = { id: crypto.randomUUID(), campaignId, title, createdAt: new Date().toISOString(), messages: [] };
  const campaign = getCampaign(campaignId, userId);
  if (campaign) { campaign.sessions = [...(campaign.sessions || []), session]; saveCampaign(campaign, userId); }
  return session;
}

export function addMessage(campaignId: string, sessionId: string, message: Message, userId?: string): void {
  const campaign = getCampaign(campaignId, userId);
  if (!campaign) return;
  const session = campaign.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  session.messages = [...session.messages, message];
  saveCampaign(campaign, userId);
}

export function saveSessionRecap(campaignId: string, sessionId: string, recap: string, userId?: string): void {
  const campaign = getCampaign(campaignId, userId);
  if (!campaign) return;
  const session = campaign.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  session.recap = recap;
  saveCampaign(campaign, userId);
}

export function saveParty(campaignId: string, party: PartyMember[], userId?: string): void {
  const c = getCampaign(campaignId, userId); if (!c) return; c.party = party; saveCampaign(c, userId);
}

export function saveNotes(campaignId: string, notes: string, userId?: string): void {
  const c = getCampaign(campaignId, userId); if (!c) return; c.notes = notes; saveCampaign(c, userId);
}

export function saveHomebrew(campaignId: string, homebrewRules: string, userId?: string): void {
  const c = getCampaign(campaignId, userId); if (!c) return; c.homebrewRules = homebrewRules; saveCampaign(c, userId);
}

export function saveQuests(campaignId: string, quests: Quest[], userId?: string): void {
  const c = getCampaign(campaignId, userId); if (!c) return; c.quests = quests; saveCampaign(c, userId);
}

export function saveNPCs(campaignId: string, npcs: TrackedNPC[], userId?: string): void {
  const c = getCampaign(campaignId, userId); if (!c) return; c.npcs = npcs; saveCampaign(c, userId);
}

export function saveTimeline(campaignId: string, timeline: TimelineEvent[], userId?: string): void {
  const c = getCampaign(campaignId, userId); if (!c) return; c.timeline = timeline; saveCampaign(c, userId);
}

export function saveFactions(campaignId: string, factions: Faction[], userId?: string): void {
  const c = getCampaign(campaignId, userId); if (!c) return; c.factions = factions; saveCampaign(c, userId);
}

export function getCampaignStats(userId?: string) {
  const campaigns = getCampaigns(userId);
  const totalSessions = campaigns.reduce((a, c) => a + (c.sessions?.length || 0), 0);
  const totalMessages = campaigns.reduce((a, c) => a + c.sessions.reduce((b, s) => b + s.messages.length, 0), 0);
  const totalQuests = campaigns.reduce((a, c) => a + (c.quests?.length || 0), 0);
  const mostActive = campaigns.sort((a, b) => (b.sessions?.length || 0) - (a.sessions?.length || 0))[0];
  return { totalCampaigns: campaigns.length, totalSessions, totalMessages, totalQuests, mostActiveName: mostActive?.name };
}
