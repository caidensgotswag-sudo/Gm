export type PlanId = "free" | "adventurer" | "master";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  features: string[];
  limits: {
    campaigns: number; // -1 = unlimited
    aiMessagesPerDay: number; // -1 = unlimited
    toolGenerationsPerDay: number; // -1 = unlimited
  };
  badge?: string;
  stripePriceId?: string;
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
      "Session history",
      "NPC, encounter & dungeon tools",
    ],
    limits: { campaigns: 1, aiMessagesPerDay: 10, toolGenerationsPerDay: 5 },
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
      "Session history & export",
      "All GM tools",
      "Priority support",
    ],
    limits: { campaigns: 5, aiMessagesPerDay: -1, toolGenerationsPerDay: -1 },
    stripePriceId: process.env.STRIPE_ADVENTURER_PRICE_ID,
  },
  {
    id: "master",
    name: "Dungeon Master",
    price: 12,
    priceLabel: "$12 / month",
    description: "The full forge. Unlimited power for serious storytellers.",
    badge: "Best Value",
    features: [
      "Unlimited campaigns",
      "Unlimited AI messages",
      "Unlimited tool generations",
      "Session export (PDF coming soon)",
      "All GM tools",
      "Homebrew rules support",
      "Priority AI responses",
      "Early access to new features",
    ],
    limits: { campaigns: -1, aiMessagesPerDay: -1, toolGenerationsPerDay: -1 },
    stripePriceId: process.env.STRIPE_MASTER_PRICE_ID,
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
