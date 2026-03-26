export type PlanId = "free" | "adventurer" | "master" | "legend";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  features: string[];
  limits: {
    campaigns: number;      // -1 = unlimited
    aiMessagesPerDay: number;
    toolGenerationsPerDay: number;
  };
  badge?: string;
  stripePriceId?: string;
  // Feature flags
  canPartyTrack: boolean;
  canNotes: boolean;
  canDiceRoller: boolean;
  canInitiative: boolean;
  canRecap: boolean;
  canExport: boolean;
  canWorldLore: boolean;
  canArcPlanner: boolean;
  canHomebrew: boolean;
  canQuestTrack: boolean;
  canNPCTrack: boolean;
  canTimeline: boolean;
  canFactionTrack: boolean;
  canPlayerPortal: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Apprentice",
    price: 0,
    priceLabel: "Free forever",
    description: "Get a taste of the forge. Perfect for solo GMs trying things out.",
    features: [
      "1 campaign",
      "10 AI messages per day",
      "5 tool generations per day",
      "Live session runner",
      "NPC, encounter & dungeon tools",
    ],
    limits: { campaigns: 1, aiMessagesPerDay: 10, toolGenerationsPerDay: 5 },
    canPartyTrack: false,
    canNotes: false,
    canDiceRoller: true,
    canInitiative: false,
    canRecap: false,
    canExport: false,
    canWorldLore: false,
    canArcPlanner: false,
    canHomebrew: false,
    canQuestTrack: false,
    canNPCTrack: false,
    canTimeline: false,
    canFactionTrack: false,
    canPlayerPortal: false,
  },
  {
    id: "adventurer",
    name: "Adventurer",
    price: 5,
    priceLabel: "$5 / month",
    description: "For active GMs running regular campaigns and sessions.",
    badge: "Popular",
    features: [
      "5 campaigns",
      "Unlimited AI messages",
      "Unlimited tool generations",
      "Party tracker",
      "Campaign notes",
      "Initiative tracker",
      "All core GM tools",
    ],
    limits: { campaigns: 5, aiMessagesPerDay: -1, toolGenerationsPerDay: -1 },
    canPartyTrack: true,
    canNotes: true,
    canDiceRoller: true,
    canInitiative: true,
    canRecap: false,
    canExport: false,
    canWorldLore: false,
    canArcPlanner: false,
    canHomebrew: false,
    canQuestTrack: true,
    canNPCTrack: false,
    canTimeline: false,
    canFactionTrack: false,
    canPlayerPortal: false,
    stripePriceId: process.env.STRIPE_ADVENTURER_PRICE_ID,
  },
  {
    id: "master",
    name: "Dungeon Master",
    price: 12,
    priceLabel: "$12 / month",
    description: "The full forge. Unlimited campaigns and powerful session tools.",
    badge: "Best Value",
    features: [
      "Unlimited campaigns",
      "Unlimited AI messages",
      "Party tracker & notes",
      "Initiative tracker",
      "AI session recaps",
      "Session export",
      "All GM tools",
      "Priority AI responses",
    ],
    limits: { campaigns: -1, aiMessagesPerDay: -1, toolGenerationsPerDay: -1 },
    canPartyTrack: true,
    canNotes: true,
    canDiceRoller: true,
    canInitiative: true,
    canRecap: true,
    canExport: true,
    canWorldLore: false,
    canArcPlanner: false,
    canHomebrew: false,
    canQuestTrack: true,
    canNPCTrack: true,
    canTimeline: true,
    canFactionTrack: false,
    canPlayerPortal: true,
    stripePriceId: process.env.STRIPE_MASTER_PRICE_ID,
  },
  {
    id: "legend",
    name: "Legend",
    price: 25,
    priceLabel: "$25 / month",
    description: "The ultimate storyteller's toolkit. Every feature, no limits.",
    badge: "Ultimate",
    features: [
      "Everything in Dungeon Master",
      "World lore generator",
      "Multi-session arc planner",
      "Homebrew rules AI",
      "Custom DM voice & style",
      "Faction & NPC relationship tracker",
      "Early access to all new features",
      "Priority support",
    ],
    limits: { campaigns: -1, aiMessagesPerDay: -1, toolGenerationsPerDay: -1 },
    canPartyTrack: true,
    canNotes: true,
    canDiceRoller: true,
    canInitiative: true,
    canRecap: true,
    canExport: true,
    canWorldLore: true,
    canArcPlanner: true,
    canHomebrew: true,
    canQuestTrack: true,
    canNPCTrack: true,
    canTimeline: true,
    canFactionTrack: true,
    canPlayerPortal: true,
    stripePriceId: process.env.STRIPE_LEGEND_PRICE_ID,
  },
];

export function getPlan(planId: PlanId): Plan {
  return PLANS.find((p) => p.id === planId) ?? PLANS[0];
}

export function getPlanFromMetadata(metadata: Record<string, unknown>): Plan {
  const planId = (metadata?.planId as PlanId) ?? "free";
  return getPlan(planId);
}

export function canCreateCampaign(plan: Plan, currentCount: number): boolean {
  return plan.limits.campaigns === -1 || currentCount < plan.limits.campaigns;
}

export function canSendMessage(plan: Plan, todayCount: number): boolean {
  return plan.limits.aiMessagesPerDay === -1 || todayCount < plan.limits.aiMessagesPerDay;
}
