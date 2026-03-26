import type { Campaign, Session, Message, PartyMember } from "./types";

function storageKey(userId?: string) {
  return userId ? `dungeon_forge_campaigns_${userId}` : "dungeon_forge_campaigns";
}

export function getCampaigns(userId?: string): Campaign[] {
  if (typeof window === "undefined") return [];
  try {
    // Support migrating from old global key
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
  } catch {
    return [];
  }
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
  const campaigns = getCampaigns(userId).filter((c) => c.id !== id);
  localStorage.setItem(key, JSON.stringify(campaigns));
}

export function createSession(campaignId: string, title: string, userId?: string): Session {
  const session: Session = {
    id: crypto.randomUUID(),
    campaignId,
    title,
    createdAt: new Date().toISOString(),
    messages: [],
  };
  const campaign = getCampaign(campaignId, userId);
  if (campaign) {
    campaign.sessions = [...(campaign.sessions || []), session];
    saveCampaign(campaign, userId);
  }
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
  const campaign = getCampaign(campaignId, userId);
  if (!campaign) return;
  campaign.party = party;
  saveCampaign(campaign, userId);
}

export function saveNotes(campaignId: string, notes: string, userId?: string): void {
  const campaign = getCampaign(campaignId, userId);
  if (!campaign) return;
  campaign.notes = notes;
  saveCampaign(campaign, userId);
}

export function saveHomebrew(campaignId: string, homebrewRules: string, userId?: string): void {
  const campaign = getCampaign(campaignId, userId);
  if (!campaign) return;
  campaign.homebrewRules = homebrewRules;
  saveCampaign(campaign, userId);
}
