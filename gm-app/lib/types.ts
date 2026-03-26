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
}
