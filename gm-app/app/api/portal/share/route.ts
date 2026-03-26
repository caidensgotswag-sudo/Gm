import { auth } from "@clerk/nextjs/server";
import type { SharedCampaignData } from "@/lib/types";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { campaignId, data }: { campaignId: string; data: SharedCampaignData } = await request.json();

  const { clerkClient } = await import("@clerk/nextjs/server");
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const existing = (user.publicMetadata?.sharedCampaigns as Record<string, SharedCampaignData>) ?? {};

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      sharedCampaigns: { ...existing, [campaignId]: { ...data, updatedAt: new Date().toISOString() } },
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return Response.json({ url: `${appUrl}/portal/${userId}/${campaignId}` });
}
