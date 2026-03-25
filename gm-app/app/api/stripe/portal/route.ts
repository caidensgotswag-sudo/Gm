import { auth, currentUser } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const user = await currentUser();
  const customerId = user?.privateMetadata?.stripeCustomerId as string | undefined;

  if (!customerId) {
    return Response.json({ url: "/pricing" });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/account`,
  });

  return Response.json({ url: session.url });
}
