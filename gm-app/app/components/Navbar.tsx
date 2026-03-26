"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <nav
      className="flex items-center justify-between px-6 py-3 shrink-0"
      style={{ borderBottom: "1px solid rgba(201,168,76,0.2)", background: "rgba(13,10,10,0.95)", backdropFilter: "blur(8px)" }}
    >
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">⚔️</span>
          <span className="font-bold text-gold hidden sm:block" style={{ letterSpacing: "0.08em", fontSize: "0.95rem" }}>
            DUNGEON FORGE
          </span>
        </Link>
        {isLoaded && user && (
          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "/campaigns", label: "Campaigns" },
              { href: "/tools", label: "Tools" },
              { href: "/pricing", label: "Pricing" },
            ].map(({ href, label }) => (
              <Link key={href} href={href}>
                <span
                  className="px-3 py-1.5 rounded text-sm transition-all"
                  style={{
                    color: isActive(href) ? "var(--gold)" : "rgba(245,230,200,0.5)",
                    background: isActive(href) ? "rgba(201,168,76,0.08)" : "transparent",
                  }}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isLoaded && user ? (
          <>
            <Link href="/campaigns" className="md:hidden">
              <button className="btn-secondary text-xs py-1 px-3">Campaigns</button>
            </Link>
            <Link href="/account">
              <button className="btn-secondary text-xs py-1 px-3">Account</button>
            </Link>
            <UserButton />
          </>
        ) : (
          <>
            <Link href="/pricing">
              <span className="text-sm cursor-pointer" style={{ color: "rgba(245,230,200,0.4)" }}>Pricing</span>
            </Link>
            <Link href="/sign-in">
              <button className="btn-secondary text-sm">Sign In</button>
            </Link>
            <Link href="/sign-up">
              <button className="btn-primary text-sm">Get Started</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
