"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { PLANS } from "@/lib/subscription";

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const currentPlan = (user?.publicMetadata?.planId as string) ?? "free";

  async function handleSubscribe(planId: string, stripePriceId?: string) {
    if (!isLoaded) return;
    if (!user) { router.push("/sign-up"); return; }
    if (planId === "free") return;
    if (!stripePriceId) return;

    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: stripePriceId, planId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handleManageBilling() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 100%)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
        <Link href="/" className="flex items-center gap-3">
          <span className="text-2xl">⚔️</span>
          <span className="text-xl font-bold text-gold" style={{ letterSpacing: "0.1em" }}>THE DUNGEON FORGE</span>
        </Link>
        <div className="flex gap-3">
          {user ? (
            <>
              <Link href="/campaigns"><button className="btn-secondary text-sm">My Campaigns</button></Link>
              <button className="btn-secondary text-sm" onClick={handleManageBilling}>Manage Billing</button>
            </>
          ) : (
            <>
              <Link href="/sign-in"><button className="btn-secondary text-sm">Sign In</button></Link>
              <Link href="/sign-up"><button className="btn-primary text-sm">Sign Up</button></Link>
            </>
          )}
        </div>
      </nav>

      {/* Header */}
      <section className="text-center px-6 pt-16 pb-12">
        <div className="text-5xl mb-4">💎</div>
        <h1 className="text-4xl md:text-5xl font-bold text-gold mb-4" style={{ letterSpacing: "0.05em" }}>
          Choose Your Tier
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(245,230,200,0.5)" }}>
          Every great adventure starts somewhere. Upgrade whenever you&apos;re ready to forge more.
        </p>
      </section>

      {/* Plans */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLANS.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const isPopular = plan.badge === "Popular";
            const isBestValue = plan.badge === "Best Value";
            const isLoading = loadingPlan === plan.id;

            return (
              <div
                key={plan.id}
                className="card-parchment p-6 flex flex-col fade-in relative"
                style={{
                  border: isPopular
                    ? "2px solid var(--gold)"
                    : isBestValue
                    ? "2px solid var(--blood)"
                    : "1px solid rgba(201,168,76,0.2)",
                  transform: isPopular ? "scale(1.03)" : "none",
                }}
              >
                {/* Badge */}
                {plan.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full"
                    style={{
                      background: isPopular ? "var(--gold)" : "var(--blood)",
                      color: isPopular ? "var(--ink)" : "var(--gold-light)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-gold mb-1">{plan.name}</h2>
                  <div className="text-3xl font-bold mb-1" style={{ color: "rgba(245,230,200,0.95)" }}>
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                    {plan.price > 0 && <span className="text-base font-normal" style={{ color: "rgba(245,230,200,0.4)" }}>/mo</span>}
                  </div>
                  <p className="text-sm" style={{ color: "rgba(245,230,200,0.45)" }}>{plan.description}</p>
                </div>

                <hr className="divider" />

                {/* Features */}
                <ul className="flex-1 space-y-2 mb-6 mt-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm" style={{ color: "rgba(245,230,200,0.7)" }}>
                      <span className="text-gold mt-0.5">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Limits callout */}
                <div className="rounded p-3 mb-5 text-xs space-y-1" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ color: "rgba(245,230,200,0.4)" }}>
                    Campaigns: <span style={{ color: "var(--gold)" }}>{plan.limits.campaigns === -1 ? "Unlimited" : plan.limits.campaigns}</span>
                  </div>
                  <div style={{ color: "rgba(245,230,200,0.4)" }}>
                    AI messages/day: <span style={{ color: "var(--gold)" }}>{plan.limits.aiMessagesPerDay === -1 ? "Unlimited" : plan.limits.aiMessagesPerDay}</span>
                  </div>
                  <div style={{ color: "rgba(245,230,200,0.4)" }}>
                    Tool uses/day: <span style={{ color: "var(--gold)" }}>{plan.limits.toolGenerationsPerDay === -1 ? "Unlimited" : plan.limits.toolGenerationsPerDay}</span>
                  </div>
                </div>

                {/* CTA */}
                {isCurrentPlan ? (
                  <button className="btn-secondary w-full" disabled style={{ opacity: 0.6, cursor: "default" }}>
                    ✓ Current Plan
                  </button>
                ) : plan.id === "free" ? (
                  <Link href={user ? "/campaigns" : "/sign-up"}>
                    <button className="btn-secondary w-full">Get Started Free</button>
                  </Link>
                ) : (
                  <button
                    className="btn-primary w-full"
                    onClick={() => handleSubscribe(plan.id, plan.stripePriceId)}
                    disabled={isLoading}
                    style={{ opacity: isLoading ? 0.6 : 1 }}
                  >
                    {isLoading ? "Redirecting..." : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gold text-center mb-8" style={{ letterSpacing: "0.05em" }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel from your account page at any time. You keep access until the end of your billing period.",
              },
              {
                q: "What counts as an AI message?",
                a: "Each time the Dungeon Master AI responds during a session counts as one message. Tool generations (NPCs, encounters, dungeons) have their own separate limit.",
              },
              {
                q: "Is my campaign data safe?",
                a: "Campaigns are stored locally in your browser. We don't store your story content on our servers — just your account and subscription status.",
              },
              {
                q: "Can I upgrade or downgrade later?",
                a: "Absolutely. Upgrade or downgrade at any time from your account page. Billing is prorated automatically by Stripe.",
              },
            ].map((item) => (
              <div key={item.q} className="card-parchment p-5">
                <h3 className="font-bold text-gold mb-2 text-sm">{item.q}</h3>
                <p className="text-sm" style={{ color: "rgba(245,230,200,0.55)", lineHeight: "1.6" }}>{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
