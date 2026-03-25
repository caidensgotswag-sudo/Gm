export interface Campaign {
  id: string;
  name: string;
  setting: string;
  tone: string;
  partySize: number;
  partyLevel: number;
  lore: string;
  createdAt: string;
  sessions: Session[];
}

export interface Session {
  id: string;
  campaignId: string;
  title: string;
  createdAt: string;
  messages: Message[];
}

export interface Message {
  role: "dm" | "player";
  content: string;
  timestamp: string;
}
