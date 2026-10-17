"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Terminal,
  Cpu,
  Key,
  Layers,
  BarChart3,
  BookOpen,
  Copy,
  Check,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { useToast } from "./Toast";

export function Navbar() {
  const pathname = usePathname();
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unifiedKey, setUnifiedKey] = useState("freellmapi-live-7f89b2c34a1");

  useEffect(() => {
    // Fetch real unified key if available
    fetch("/api/keys")
      .then((res) => res.json())
      .then((data) => {
        if (data?.unifiedKey?.key) {
          setUnifiedKey(data.unifiedKey.key);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyKey = async () => {
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
    { href: "/models", label: "Models (635)", icon: Cpu },
    { href: "/routing", label: "Routing & Fallback", icon: Layers },
    { href: "/keys", label: "Keys", icon: Key },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/docs", label: "Docs", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#07090e]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  FreeLLMAPI
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                  v0.15.2
                </span>
              </div>
              <span className="text-[10px] text-slate-400 -mt-1 hidden sm:block">
                7.4B tokens / 34 free providers
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-slate-800 text-cyan-400 font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 opacity-80" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Provider status badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[11px] text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>34 Providers Live</span>
          </div>

          {/* Quick Copy Key Button */}
          <button
            onClick={handleCopyKey}
            title={`Copy unified key: ${unifiedKey}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-200 transition-all cursor-pointer group"
          >
            {copiedKey ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            )}
            <span className="font-mono text-[11px] max-w-[90px] sm:max-w-[130px] truncate text-slate-300">
              {copiedKey ? "Copied Key" : unifiedKey}
            </span>
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/tashfeenahmed/freellmapi"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-xs text-slate-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="hidden sm:inline font-medium">Star</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-slate-900/80 text-amber-300 font-mono">
              35.2k ★
            </span>
          </a>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#07090e] px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive
                    ? "bg-slate-800 text-cyan-400 font-medium"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-4 h-4 text-cyan-400" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
