export interface PartyMember {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  notes: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: "active" | "completed" | "failed";
  reward?: string;
  createdAt: string;
}

export interface TrackedNPC {
  id: string;
  name: string;
  race: string;
  role: string;
  location: string;
  relationship: "friendly" | "neutral" | "hostile" | "unknown";
  description: string;
  notes: string;
  firstMet: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  sessionId?: string;
  sessionTitle?: string;
  ingameDate?: string;
  createdAt: string;
}

export interface Faction {
  id: string;
  name: string;
  description: string;
  reputation: number; // -100 to 100
  goal: string;
  notes: string;
}

export interface Campaign {
  id: string;
  name: string;
  setting: string;
  tone: string;
  partySize: number;
  partyLevel: number;
  lore: string;
  homebrewRules: string;
  notes: string;
  party: PartyMember[];
  quests: Quest[];
  npcs: TrackedNPC[];
  timeline: TimelineEvent[];
  factions: Faction[];
  createdAt: string;
  sessions: Session[];
}

export interface Session {
  id: string;
  campaignId: string;
  title: string;
  createdAt: string;
  messages: Message[];
  recap?: string;
}

export interface Message {
  role: "dm" | "player";
  content: string;
  timestamp: string;
}

export interface InitiativeCombatant {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  isPlayer: boolean;
  conditions: string[];
}

export interface SharedCampaignData {
  name: string;
  setting: string;
  tone: string;
  partyLevel: number;
  party: Pick<PartyMember, "name" | "race" | "class" | "level">[];
  quests: Pick<Quest, "title" | "description" | "status">[];
  recaps: { sessionTitle: string; recap: string }[];
  updatedAt: string;
}
