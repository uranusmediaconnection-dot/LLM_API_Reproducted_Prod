"use client";

import React from "react";
import Link from "next/link";
import { Swords } from "lucide-react";
import { PROVIDERS_INFO, PROVIDER_MODELS } from "@/lib/models-data";

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-background py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Project Info */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 text-zinc-950 shadow-md glow-solar">
              <Swords className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-foreground text-base">The SUN</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gold-950 text-gold-400 border border-gold-800/50">
              MIT
            </span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The SUN — an OpenAI-compatible gateway for {PROVIDERS_INFO.length} provider APIs and {PROVIDER_MODELS.length} catalogued models, behind one unified <code className="text-gold-400">/v1</code> endpoint.
          </p>
          <div className="pt-2 text-[11px] text-zinc-500">
            Original project by{" "}
            <a
              href="https://github.com/tashfeenahmed"
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-gold-400 underline underline-offset-2"
            >
              Tashfeen Ahmed
            </a>
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Platform</h4>
          <ul className="space-y-1.5 text-xs text-zinc-400">
            <li>
              <Link href="/playground" className="hover:text-gold-400 transition-colors">
                AI Interactive Playground
              </Link>
            </li>
            <li>
              <Link href="/models" className="hover:text-gold-400 transition-colors">
                Model Catalog ({PROVIDER_MODELS.length} Models)
              </Link>
            </li>
            <li>
              <Link href="/routing" className="hover:text-gold-400 transition-colors">
                Fallback Chain & Strategies
              </Link>
            </li>
            <li>
              <Link href="/keys" className="hover:text-gold-400 transition-colors">
                Keys & Security Manager
              </Link>
            </li>
            <li>
              <Link href="/analytics" className="hover:text-gold-400 transition-colors">
                Live Quotas & Telemetry
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: API & Documentation */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Developers & API</h4>
          <ul className="space-y-1.5 text-xs text-zinc-400">
            <li>
              <Link href="/docs" className="hover:text-gold-400 transition-colors">
                API Reference & Schema
              </Link>
            </li>
            <li>
              <code className="text-[11px] text-zinc-300">POST /v1/chat/completions</code>
            </li>
            <li>
              <code className="text-[11px] text-zinc-300">GET /v1/models</code>
            </li>
            <li>
              <code className="text-[11px] text-zinc-300">POST /v1/messages (Claude)</code>
            </li>
            <li>
              <code className="text-[11px] text-zinc-300">GET /v1/health</code>
            </li>
          </ul>
        </div>

        {/* Col 4: Compatible Ecosystem */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Tested With</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Claude Code CLI, Cursor, Continue.dev, Zed, LangChain, LlamaIndex, OpenAI Python & TypeScript SDKs, Ollama, vLLM, and LM Studio.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>OpenAI API Wire Compatible</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
        <div>
          © {new Date().getFullYear()} The SUN. Open-source under MIT License. For developer & experimentation workflows.
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/uranusmediaconnection-dot/LLM_API_Reproducted_Prod"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-300 transition-colors"
          >
            GitHub Repository
          </a>
          <span>•</span>
          <Link href="/docs" className="hover:text-zinc-300 transition-colors">
            Documentation
          </Link>
          <span>•</span>
          <Link href="/playground" className="hover:text-zinc-300 transition-colors">
            Playground
          </Link>
        </div>
      </div>
    </footer>
  );
}
