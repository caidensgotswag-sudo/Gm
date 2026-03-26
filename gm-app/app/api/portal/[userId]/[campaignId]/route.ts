import type { SharedCampaignData } from "@/lib/types";

export async function GET(_req: Request, ctx: RouteContext<"/api/portal/[userId]/[campaignId]">) {
  const { userId, campaignId } = await ctx.params;

  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const shared = (user.publicMetadata?.sharedCampaigns as Record<string, SharedCampaignData>) ?? {};
    const data = shared[campaignId];
    if (!data) return new Response("Not found", { status: 404 });
    return Response.json(data);
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
