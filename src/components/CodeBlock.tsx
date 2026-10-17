"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";
import { useToast } from "./Toast";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showTabs?: boolean;
  tabs?: { label: string; code: string; language: string }[];
}

export function CodeBlock({
  code: initialCode,
  language: initialLanguage = "bash",
  filename,
  tabs,
}: CodeBlockProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const currentCode = tabs ? tabs[activeTab].code : initialCode;
  const currentLang = tabs ? tabs[activeTab].language : initialLanguage;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      toast("Code copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Failed to copy code", "error");
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0b0f19] overflow-hidden shadow-2xl font-mono text-sm">
      {/* Top Header / Tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#080c14] border-b border-slate-800/80">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs ? (
            <div className="flex items-center gap-1">
              {tabs.map((tab, idx) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    activeTab === idx
                      ? "bg-cyan-500/15 text-cyan-400 font-semibold border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>{filename || currentLang}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 rounded-md border border-slate-700/50 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto text-xs leading-relaxed text-slate-300 select-text">
        <pre className="whitespace-pre">{currentCode}</pre>
      </div>
    </div>
  );
}
