"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { PLANS } from "@/lib/subscription";
import Navbar from "@/app/components/Navbar";

const FEATURE_ROWS = [
  { label: "Campaigns", values: ["1", "5", "Unlimited", "Unlimited"] },
  { label: "AI messages / day", values: ["10", "Unlimited", "Unlimited", "Unlimited"] },
  { label: "Tool generations / day", values: ["5", "Unlimited", "Unlimited", "Unlimited"] },
  { label: "Live session runner", values: [true, true, true, true] },
  { label: "Dice roller", values: [true, true, true, true] },
  { label: "NPC / encounter / dungeon tools", values: [true, true, true, true] },
  { label: "Party tracker", values: [false, true, true, true] },
  { label: "Campaign notes", values: [false, true, true, true] },
  { label: "Initiative tracker", values: [false, true, true, true] },
  { label: "AI session recaps", values: [false, false, true, true] },
  { label: "Session export", values: [false, false, true, true] },
  { label: "World lore generator", values: [false, false, false, true] },
  { label: "Arc planner", values: [false, false, false, true] },
  { label: "Homebrew rules AI", values: [false, false, false, true] },
  { label: "Priority AI responses", values: [false, false, true, true] },
];

export default function PricingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const currentPlan = (user?.publicMetadata?.planId as string) ?? "free";

  async function handleSubscribe(planId: string, stripePriceId?: string) {
    if (!isLoaded) return;
    if (!user) { router.push("/sign-up"); return; }
    if (planId === "free" || !stripePriceId) return;

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

  const planColors = ["rgba(255,255,255,0.05)", "rgba(42,92,138,0.2)", "rgba(139,0,0,0.2)", "rgba(120,80,200,0.2)"];
  const planBorderColors = ["rgba(255,255,255,0.1)", "rgba(42,92,138,0.5)", "var(--gold)", "rgba(160,100,255,0.7)"];

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 100%)" }}>
      <Navbar />

      {/* Header */}
      <section className="text-center px-6 pt-14 pb-10">
        <div className="text-5xl mb-4">💎</div>
        <h1 className="text-4xl md:text-5xl font-bold text-gold mb-3" style={{ letterSpacing: "0.05em" }}>Choose Your Tier</h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(245,230,200,0.45)" }}>
          Every great adventure starts somewhere. Upgrade whenever you&apos;re ready to forge more.
        </p>
      </section>

      {/* Plan cards */}
      <section className="px-4 pb-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan, idx) => {
            const isCurrentPlan = currentPlan === plan.id;
            const isLoading = loadingPlan === plan.id;

            return (
              <div key={plan.id} className="flex flex-col p-5 rounded-lg relative fade-in"
                style={{ background: planColors[idx], border: `1.5px solid ${planBorderColors[idx]}` }}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap"
                    style={{
                      background: plan.id === "legend" ? "rgba(160,100,255,0.9)" : plan.id === "master" ? "var(--gold)" : "#2a5c8a",
                      color: plan.id === "master" ? "var(--ink)" : "white",
                      letterSpacing: "0.06em",
                    }}>
                    {plan.badge}
                  </div>
                )}

                <h2 className="text-lg font-bold text-gold mb-1">{plan.name}</h2>
                <div className="text-3xl font-bold mb-1" style={{ color: "rgba(245,230,200,0.95)" }}>
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                  {plan.price > 0 && <span className="text-sm font-normal" style={{ color: "rgba(245,230,200,0.35)" }}>/mo</span>}
                </div>
                <p className="text-xs mb-4" style={{ color: "rgba(245,230,200,0.4)", lineHeight: "1.5" }}>{plan.description}</p>

                <ul className="flex-1 space-y-1.5 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "rgba(245,230,200,0.65)" }}>
                      <span className="text-gold mt-0.5 shrink-0">✓</span>{f}
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <div className="space-y-2">
                    <button className="btn-secondary w-full text-sm" disabled style={{ opacity: 0.5, cursor: "default" }}>✓ Current Plan</button>
                    {plan.id !== "free" && (
                      <button className="w-full text-xs py-1" style={{ color: "rgba(245,230,200,0.3)" }} onClick={handleManageBilling}>
                        Manage billing →
                      </button>
                    )}
                  </div>
                ) : plan.id === "free" ? (
                  <button className="btn-secondary w-full text-sm" onClick={() => router.push(user ? "/campaigns" : "/sign-up")}>
                    Get Started Free
                  </button>
                ) : (
                  <button className="btn-primary w-full text-sm" onClick={() => handleSubscribe(plan.id, plan.stripePriceId)}
                    disabled={isLoading} style={{ opacity: isLoading ? 0.6 : 1 }}>
                    {isLoading ? "Redirecting..." : `Upgrade →`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="px-4 pb-16 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-gold text-center mb-6" style={{ letterSpacing: "0.06em" }}>FULL COMPARISON</h2>
        <div className="card-parchment overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
                <th className="text-left py-3 px-4 font-normal" style={{ color: "rgba(245,230,200,0.4)", width: "40%" }}>Feature</th>
                {PLANS.map((p) => (
                  <th key={p.id} className="text-center py-3 px-3 font-bold text-gold" style={{ width: "15%" }}>
                    {p.name}
                    {currentPlan === p.id && <div className="text-xs font-normal" style={{ color: "rgba(201,168,76,0.5)" }}>← you</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((row, i) => (
                <tr key={row.label} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                  <td className="py-2.5 px-4" style={{ color: "rgba(245,230,200,0.6)" }}>{row.label}</td>
                  {row.values.map((val, j) => (
                    <td key={j} className="py-2.5 px-3 text-center">
                      {typeof val === "boolean" ? (
                        val
                          ? <span style={{ color: "var(--gold)" }}>✓</span>
                          : <span style={{ color: "rgba(255,255,255,0.15)" }}>—</span>
                      ) : (
                        <span style={{ color: "rgba(245,230,200,0.7)" }}>{val}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gold text-center mb-6" style={{ letterSpacing: "0.06em" }}>FAQ</h2>
        <div className="space-y-3">
          {[
            { q: "Can I cancel anytime?", a: "Yes. Cancel from your account page at any time. You keep access until the end of your billing period." },
            { q: "What counts as an AI message?", a: "Each DM response in a live session counts as one message. Tool uses (NPC gen, dungeon builder, etc.) have their own separate counter." },
            { q: "Is my campaign data safe?", a: "Campaigns are stored in your browser's localStorage. We don't store your story content on our servers — only your account and subscription status." },
            { q: "Can I upgrade or downgrade?", a: "Yes, anytime from your account page. Stripe handles proration automatically so you're never double-charged." },
            { q: "What's the difference between Dungeon Master and Legend?", a: "Legend unlocks the advanced AI worldbuilding suite: world lore generator, arc planner, homebrew rules AI, and faction tracking. Perfect for long-running campaigns." },
          ].map((item) => (
            <div key={item.q} className="card-parchment p-4">
              <h3 className="font-bold text-gold text-sm mb-1">{item.q}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(245,230,200,0.5)" }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
