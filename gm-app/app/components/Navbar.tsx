"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getTheme, setTheme } from "@/lib/storage";

export default function Navbar() {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  }

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="flex items-center justify-between px-4 py-2.5 shrink-0"
      style={{ borderBottom: "1px solid rgba(201,168,76,0.2)", background: theme === "light" ? "rgba(240,230,208,0.95)" : "rgba(13,10,10,0.95)", backdropFilter: "blur(8px)" }}>
      <div className="flex items-center gap-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg">⚔️</span>
          <span className="font-bold text-gold hidden sm:block" style={{ letterSpacing: "0.08em", fontSize: "0.9rem" }}>DUNGEON FORGE</span>
        </Link>
        {isLoaded && user && (
          <div className="hidden md:flex items-center gap-0.5">
            {[
              { href: "/campaigns", label: "Campaigns" },
              { href: "/tools", label: "Tools" },
              { href: "/pricing", label: "Pricing" },
            ].map(({ href, label }) => (
              <Link key={href} href={href}>
                <span className="px-3 py-1.5 rounded text-sm transition-all"
                  style={{ color: isActive(href) ? "var(--gold)" : "rgba(245,230,200,0.5)", background: isActive(href) ? "rgba(201,168,76,0.08)" : "transparent" }}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button onClick={toggleTheme} title="Toggle theme"
          className="w-7 h-7 rounded flex items-center justify-center text-sm transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {isLoaded && user ? (
          <>
            <Link href="/campaigns" className="md:hidden">
              <button className="btn-secondary text-xs py-1 px-2">Campaigns</button>
            </Link>
            <Link href="/account">
              <button className="btn-secondary text-xs py-1 px-2">Account</button>
            </Link>
            <UserButton />
          </>
        ) : (
          <>
            <Link href="/pricing">
              <span className="text-sm cursor-pointer hidden sm:block" style={{ color: "rgba(245,230,200,0.4)" }}>Pricing</span>
            </Link>
            <Link href="/sign-in"><button className="btn-secondary text-sm">Sign In</button></Link>
            <Link href="/sign-up"><button className="btn-primary text-sm">Get Started</button></Link>
          </>
        )}
      </div>
    </nav>
  );
}
