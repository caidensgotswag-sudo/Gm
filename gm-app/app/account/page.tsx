"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPlan } from "@/lib/subscription";
import type { PlanId } from "@/lib/subscription";
import { Suspense } from "react";

function AccountInner() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [portalLoading, setPortalLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  if (!isLoaded) return null;
  if (!user) return null;

  const planId = (user.publicMetadata?.planId as PlanId) ?? "free";
  const plan = getPlan(planId);

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10" style={{ background: "linear-gradient(180deg, #0d0a0a 0%, #1a1010 100%)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/campaigns" className="text-gold opacity-60 hover:opacity-100 transition-opacity">← Campaigns</Link>
          <h1 className="text-3xl font-bold text-gold">My Account</h1>
        </div>

        {showSuccess && (
          <div className="mb-6 p-4 rounded fade-in" style={{ background: "rgba(0,100,0,0.3)", border: "1px solid rgba(0,200,0,0.3)" }}>
            <p className="text-sm font-bold" style={{ color: "#4ade80" }}>
              ✓ Subscription activated! Welcome to {plan.name}.
            </p>
          </div>
        )}

        {/* Profile */}
        <div className="card-parchment p-6 mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 text-gold mb-4">Profile</h2>
          <div className="flex items-center gap-4">
            <UserButton />
            <div>
              <p className="font-semibold" style={{ color: "rgba(245,230,200,0.9)" }}>
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm" style={{ color: "rgba(245,230,200,0.4)" }}>
                {user.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="card-parchment p-6 mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 text-gold mb-4">Subscription</h2>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gold">{plan.name}</span>
                {planId !== "free" && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "var(--blood)", color: "var(--gold-light)" }}>
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm mt-1" style={{ color: "rgba(245,230,200,0.4)" }}>{plan.priceLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-sm" style={{ color: "rgba(245,230,200,0.4)" }}>
                {plan.limits.campaigns === -1 ? "Unlimited" : plan.limits.campaigns} campaigns
              </p>
              <p className="text-sm" style={{ color: "rgba(245,230,200,0.4)" }}>
                {plan.limits.aiMessagesPerDay === -1 ? "Unlimited" : plan.limits.aiMessagesPerDay} AI msgs/day
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {planId === "free" ? (
              <Link href="/pricing">
                <button className="btn-primary text-sm">⚡ Upgrade Plan</button>
              </Link>
            ) : (
              <button className="btn-secondary text-sm" onClick={handleManageBilling} disabled={portalLoading}>
                {portalLoading ? "Loading..." : "Manage Billing"}
              </button>
            )}
            <Link href="/pricing">
              <button className="btn-secondary text-sm">View All Plans</button>
            </Link>
          </div>
        </div>

        {/* Plan features */}
        <div className="card-parchment p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 text-gold mb-4">Your Plan Includes</h2>
          <ul className="space-y-2">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "rgba(245,230,200,0.65)" }}>
                <span className="text-gold">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountInner />
    </Suspense>
  );
}
