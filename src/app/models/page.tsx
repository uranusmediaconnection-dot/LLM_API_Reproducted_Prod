"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Cpu,
  Search,
  Zap,
  Filter,
  CheckCircle2,
  Terminal,
  ArrowUpDown,
  ExternalLink,
  Sliders,
  Sparkles,
} from "lucide-react";
import { ALL_MODELS, ModelDefinition } from "@/lib/models-data";
import { useToast } from "@/components/Toast";

export default function ModelsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"speed" | "context" | "name">("speed");

  const categories = [
    { id: "all", label: "All Modalities" },
    { id: "chat", label: "Chat & Dialogue" },
    { id: "coding", label: "Code Specialists" },
    { id: "reasoning", label: "Deep Reasoning & Math" },
    { id: "vision", label: "Multimodal & Vision" },
  ];

  const providers = [
    { id: "all", label: "All Providers (34)" },
    { id: "groq", label: "Groq" },
    { id: "cerebras", label: "Cerebras" },
    { id: "gemini", label: "Google AI Studio" },
    { id: "mistral", label: "Mistral AI" },
    { id: "openrouter", label: "OpenRouter" },
    { id: "cohere", label: "Cohere" },
    { id: "cloudflare", label: "Cloudflare Workers AI" },
    { id: "huggingface", label: "Hugging Face" },
    { id: "nvidia", label: "NVIDIA NIM" },
    { id: "zhipu", label: "Zhipu AI" },
  ];

  const filteredModels = useMemo(() => {
    return ALL_MODELS.filter((model) => {
      const matchesSearch =
        model.name.toLowerCase().includes(search.toLowerCase()) ||
        model.id.toLowerCase().includes(search.toLowerCase()) ||
        model.providerName.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || model.category === selectedCategory;

      const matchesProvider =
        selectedProvider === "all" ||
        model.provider.toLowerCase() === selectedProvider.toLowerCase() ||
        (model.isAutoProfile && selectedProvider === "all");

      return matchesSearch && matchesCategory && matchesProvider;
    }).sort((a, b) => {
      if (sortBy === "speed") return b.tokensPerSecond - a.tokensPerSecond;
      if (sortBy === "context") return b.contextWindow - a.contextWindow;
      return a.name.localeCompare(b.name);
    });
  }, [search, selectedCategory, selectedProvider, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/40 text-cyan-400 text-xs font-mono mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>635 Free Endpoints Tracked</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Free Models Catalog</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Live catalog of all enrolled free endpoints across 34 providers, complete with speed benchmarks (tokens/sec), context limits, and rate caps.
          </p>
        </div>

        <Link
          href="/playground"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs transition-all shadow-md shadow-cyan-950 shrink-0"
        >
          <Terminal className="w-4 h-4" />
          <span>Test in Playground</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by model name, provider, or ID..."
            className="w-full bg-[#0b0f19] border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="md:col-span-4 flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-2 text-xs rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === c.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium"
                  : "bg-[#0b0f19] text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Provider Dropdown & Sort */}
        <div className="md:col-span-4 flex items-center gap-2">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="flex-1 bg-[#0b0f19] border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#0b0f19] border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="speed">Sort: Speed</option>
            <option value="context">Sort: Context</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </div>

      {/* Models Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0b0f19] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#080c14] border-b border-slate-800 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="p-3.5">Model Identifier & Family</th>
                <th className="p-3.5">Provider</th>
                <th className="p-3.5">Throughput</th>
                <th className="p-3.5">Context Window</th>
                <th className="p-3.5">Free Tier Quotas</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredModels.map((model) => (
                <tr key={model.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Model ID & Name */}
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      {model.isAutoProfile ? (
                        <div className="p-1 rounded bg-purple-500/20 text-purple-400">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
                          <Cpu className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{model.name}</span>
                          {model.isAutoProfile && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
                              Auto Router
                            </span>
                          )}
                        </div>
                        <code className="text-[11px] font-mono text-cyan-400">{model.id}</code>
                      </div>
                    </div>
                  </td>

                  {/* Provider */}
                  <td className="p-3.5 font-medium text-slate-200">{model.providerName}</td>

                  {/* Speed */}
                  <td className="p-3.5 font-mono">
                    <span
                      className={`font-semibold ${
                        model.tokensPerSecond >= 1000
                          ? "text-emerald-400"
                          : model.tokensPerSecond >= 250
                          ? "text-cyan-400"
                          : "text-slate-300"
                      }`}
                    >
                      ~{model.tokensPerSecond} tok/s
                    </span>
                  </td>

                  {/* Context */}
                  <td className="p-3.5 font-mono text-slate-300">
                    {model.contextWindow >= 1000000
                      ? `${(model.contextWindow / 1000000).toFixed(1)}M`
                      : `${Math.round(model.contextWindow / 1024)}k`}{" "}
                    tokens
                  </td>

                  {/* Free Quotas */}
                  <td className="p-3.5 text-[11px] font-mono text-slate-400">
                    <div>
                      <span className="text-slate-300 font-semibold">{model.freeTier.rpm} RPM</span> /{" "}
                      <span>{model.freeTier.rpd.toLocaleString()} RPD</span>
                    </div>
                    <div className="text-[10px] text-emerald-400">{model.freeTier.cost}</div>
                  </td>

                  {/* Category */}
                  <td className="p-3.5">
                    <span className="capitalize text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                      {model.category}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="p-3.5 text-right">
                    <Link
                      href={`/playground?model=${encodeURIComponent(model.id)}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 text-[11px] font-medium transition-colors"
                    >
                      <span>Test</span>
                      <Terminal className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredModels.length === 0 && (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Cpu className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-medium">No models found matching your search criteria.</p>
            <p className="text-xs text-slate-500">Try clearing the search or category filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
