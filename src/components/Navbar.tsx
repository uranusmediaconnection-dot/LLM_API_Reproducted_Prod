"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Swords,
  Terminal,
  Cpu,
  Key,
  Layers,
  BarChart3,
  BookOpen,
  Copy,
  Check,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useToast } from "./Toast";
import { PROVIDERS_INFO } from "@/lib/models-data";

type KeysPayload = { unifiedKey?: { key?: string } };

async function fetchKeys(url: string): Promise<KeysPayload> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load the unified API key");
  return response.json();
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data } = useSWR<KeysPayload>("/api/keys", fetchKeys);
  const unifiedKey = data?.unifiedKey?.key ?? "";

  const handleSignOut = async () => {
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } catch {
      // The page reload below still forces a fresh session check.
    }
    router.replace("/");
    router.refresh();
  };

  const handleCopyKey = async () => {
    if (!unifiedKey) {
      toast("Unified API key is not available yet", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(unifiedKey);
      setCopiedKey(true);
      toast("Unified API key copied! Use as Bearer token.", "success");
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast("Failed to copy key", "error");
    }
  };

  const navLinks = [
    { href: "/playground", label: "Playground", icon: Terminal },
    { href: "/models", label: "Models", icon: Cpu },
    { href: "/routing", label: "Routing", icon: Layers },
    { href: "/keys", label: "Keys", icon: Key },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/docs", label: "Docs", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-gold-200 via-gold-500 to-gold-700 text-zinc-950 glow-solar group-hover:scale-105 transition-transform">
              <Swords className="w-4 h-4" strokeWidth={2.25} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-foreground whitespace-nowrap group-hover:text-gold-300 transition-colors">
                  The SUN
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gold-950/80 text-gold-400 border border-gold-800/50">
                  v0.15.2
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 -mt-1 hidden 2xl:block whitespace-nowrap">
                AI gateway · {PROVIDERS_INFO.length} providers
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Main navigation" className="hidden md:flex min-w-0 items-center gap-0.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href === "/models" && pathname.startsWith("/models/"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-1.5 px-2 lg:px-2.5 py-2 text-[11px] font-medium rounded-lg whitespace-nowrap border transition-colors ${
                    isActive
                      ? "bg-gold-500/10 text-gold-300 border-gold-500/20"
                      : "text-zinc-400 border-transparent hover:text-gold-200 hover:bg-zinc-900/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Provider status badge */}
          <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[11px] text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{PROVIDERS_INFO.length} Providers Catalogued</span>
          </div>

          {/* Quick Copy Key Button */}
          <button
            onClick={handleCopyKey}
            title="Copy unified API key"
            aria-label={copiedKey ? "Unified API key copied" : "Copy unified API key"}
            disabled={!unifiedKey}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary border border-border text-xs text-zinc-200 transition-colors cursor-pointer group disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copiedKey ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-gold-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="font-mono text-[11px] max-w-[90px] sm:max-w-[130px] truncate text-zinc-300">
              {copiedKey ? "Copied Key" : unifiedKey || "Loading key…"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void handleSignOut()}
            title="Sign out of the admin dashboard"
            aria-label="Sign out"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/uranusmediaconnection-dot/LLM_API_Reproducted_Prod"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open The SUN on GitHub"
            title="Open The SUN on GitHub"
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary border border-border text-xs text-zinc-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="hidden 2xl:inline font-medium">Star</span>
            <span className="hidden 2xl:inline text-[10px] px-1 py-0.5 rounded bg-zinc-900/80 text-gold-300 font-mono">
              35.2k ★
            </span>
          </a>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-gold-200 hover:bg-secondary transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="md:hidden border-b border-border bg-card px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href === "/models" && pathname.startsWith("/models/"));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? "bg-gold-500/10 text-gold-200 font-medium"
                    : "text-zinc-300 hover:text-gold-100 hover:bg-zinc-900/80"
                }`}
              >
                <Icon className="w-4 h-4 text-gold-400" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
