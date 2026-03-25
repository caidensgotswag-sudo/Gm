import { auth, currentUser } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const user = await currentUser();
  if (!user) return new Response("User not found", { status: 404 });

  const { priceId, planId } = await request.json();
  if (!priceId) return new Response("Missing priceId", { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Check if customer already exists
  const existingCustomerId = user.privateMetadata?.stripeCustomerId as string | undefined;

  let customerId = existingCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.emailAddresses[0]?.emailAddress,
      name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || undefined,
      metadata: { clerkUserId: userId },
    });
    customerId = customer.id;

    // Store in Clerk private metadata
    const { clerkClient } = await import("@clerk/nextjs/server");
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      privateMetadata: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/account?success=true`,
    cancel_url: `${appUrl}/pricing`,
    metadata: { clerkUserId: userId, planId },
    subscription_data: {
      metadata: { clerkUserId: userId, planId },
    },
  });

  return Response.json({ url: session.url });
}
