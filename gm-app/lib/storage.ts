import type { Campaign, Session, Message } from "./types";

const CAMPAIGNS_KEY = "dungeon_forge_campaigns";

export function getCampaigns(): Campaign[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CAMPAIGNS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getCampaign(id: string): Campaign | null {
  return getCampaigns().find((c) => c.id === id) ?? null;
}

export function saveCampaign(campaign: Campaign): void {
  const campaigns = getCampaigns().filter((c) => c.id !== campaign.id);
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify([...campaigns, campaign]));
}

export function deleteCampaign(id: string): void {
  const campaigns = getCampaigns().filter((c) => c.id !== id);
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
}

export function createSession(campaignId: string, title: string): Session {
  const session: Session = {
    id: crypto.randomUUID(),
    campaignId,
    title,
    createdAt: new Date().toISOString(),
    messages: [],
  };
  const campaign = getCampaign(campaignId);
  if (campaign) {
    campaign.sessions = [...(campaign.sessions || []), session];
    saveCampaign(campaign);
  }
  return session;
}

export function addMessage(campaignId: string, sessionId: string, message: Message): void {
  const campaign = getCampaign(campaignId);
  if (!campaign) return;
  const session = campaign.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  session.messages = [...session.messages, message];
  saveCampaign(campaign);
}
