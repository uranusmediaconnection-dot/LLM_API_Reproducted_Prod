"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Terminal, Shield, Cpu, ExternalLink, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#06080d] py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Project Info */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white text-base">FreeLLMAPI</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              MIT
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            7.4 billion tokens per month. 34 free LLM providers. 635 free model endpoints. All behind one unified <code className="text-cyan-400">/v1</code> endpoint.
          </p>
          <div className="pt-2 text-[11px] text-slate-500">
            Original project by{" "}
            <a
              href="https://github.com/tashfeenahmed"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-cyan-400 underline underline-offset-2"
            >
              Tashfeen Ahmed
            </a>
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Platform</h4>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li>
              <Link href="/playground" className="hover:text-cyan-400 transition-colors">
                AI Interactive Playground
              </Link>
            </li>
            <li>
              <Link href="/models" className="hover:text-cyan-400 transition-colors">
                Model Catalog (635 Endpoints)
              </Link>
            </li>
            <li>
              <Link href="/routing" className="hover:text-cyan-400 transition-colors">
                Fallback Chain & Strategies
              </Link>
            </li>
            <li>
              <Link href="/keys" className="hover:text-cyan-400 transition-colors">
                Keys & Encryption Manager
              </Link>
            </li>
            <li>
              <Link href="/analytics" className="hover:text-cyan-400 transition-colors">
                Live Quotas & Telemetry
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: API & Documentation */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Developers & API</h4>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li>
              <Link href="/docs" className="hover:text-cyan-400 transition-colors">
                API Reference & Schema
              </Link>
            </li>
            <li>
              <code className="text-[11px] text-slate-300">POST /v1/chat/completions</code>
            </li>
            <li>
              <code className="text-[11px] text-slate-300">GET /v1/models</code>
            </li>
            <li>
              <code className="text-[11px] text-slate-300">POST /v1/messages (Claude)</code>
            </li>
            <li>
              <code className="text-[11px] text-slate-300">GET /v1/health</code>
            </li>
          </ul>
        </div>

        {/* Col 4: Compatible Ecosystem */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Tested With</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Claude Code CLI, Cursor, Continue.dev, Zed, LangChain, LlamaIndex, OpenAI Python & TypeScript SDKs, Ollama, vLLM, and LM Studio.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>OpenAI API Wire Compatible</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>
          © {new Date().getFullYear()} FreeLLMAPI. Open-source under MIT License. For developer & experimentation workflows.
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/tashfeenahmed/freellmapi"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            GitHub Repository
          </a>
          <span>•</span>
          <Link href="/docs" className="hover:text-slate-300 transition-colors">
            Documentation
          </Link>
          <span>•</span>
          <Link href="/playground" className="hover:text-slate-300 transition-colors">
            Playground
          </Link>
        </div>
      </div>
    </footer>
  );
}
