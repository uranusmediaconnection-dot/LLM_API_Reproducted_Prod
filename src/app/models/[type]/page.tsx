"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Cpu,
  Search,
  Terminal,
  Copy,
  GripVertical,
  Layers,
  Gauge,
  ChevronDown,
  ChevronRight,
  Eye,
  Wrench,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { ModelDefinition } from "@/lib/models-data";
import {
  MODEL_TYPES,
  ModelType,
  isValidModelType,
  modelsForType,
  staticScores,
  compositeScore,
  formatContext,
  formatQuota,
} from "@/lib/model-scores";
import { useToast } from "@/components/Toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ModelConfigRow {
  modelId: string;
  enabled: boolean;
  sortOrder: number;
  displayName?: string | null;
}

interface UsageRow {
  modelUsed: string;
  requests: number;
  tokens: number;
  errors: number;
}

interface RoutingPayload {
  config: { strategy: string; fallbackChain: string[] };
}

const EMPTY_MODEL_CONFIGS: ModelConfigRow[] = [];
const EMPTY_USAGE_ROWS: UsageRow[] = [];

// Original strategy buttons -> stored routing strategies
const STRATEGY_BUTTONS = [
  { id: "manual", label: "Manual", stored: "priority", hint: "Manual mode: requests follow the order below, top-to-bottom. Drag to reorder." },
  { id: "balanced", label: "Balanced", stored: "round_robin", hint: "Balanced mode: requests spread evenly across enabled models to spare each free quota." },
  { id: "smartest", label: "Smartest", stored: "capability", hint: "Smartest mode: requests route to the highest intelligence score currently under quota." },
  { id: "fastest", label: "Fastest", stored: "latency", hint: "Fastest mode: requests route to the highest throughput model currently under quota." },
  { id: "reliable", label: "Most reliable", stored: "reliability", hint: "Reliability mode: requests route by live success rate and remaining daily headroom." },
] as const;

const storedToButton: Record<string, string> = {
  priority: "manual",
  round_robin: "balanced",
  capability: "smartest",
  latency: "fastest",
  reliability: "reliable",
};

const SEGMENT_COLORS = [
  "bg-gold-400",
  "bg-gold-500",
  "bg-gold-600",
  "bg-gold-700",
];

export default function ModelsTypePage() {
  const params = useParams<{ type: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const type = params.type as string;

  const [search, setSearch] = useState("");
  const [visionOnly, setVisionOnly] = useState(false);
  const [toolsOnly, setToolsOnly] = useState(false);
  const [minContext, setMinContext] = useState(0);
  const [showAllBudget, setShowAllBudget] = useState(false);
  const [moreOptions, setMoreOptions] = useState(false);
  const [order, setOrder] = useState<string[] | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const { data: configData, mutate: mutateConfig } = useSWR<{ configs: ModelConfigRow[]; usage: UsageRow[] }>(
    "/api/models/config",
    fetcher
  );
  const { data: routingData, mutate: mutateRouting } = useSWR<RoutingPayload>("/api/routing", fetcher);

  const modelType: ModelType = isValidModelType(type) ? type : "chat";
  const catalog = useMemo(() => modelsForType(modelType), [modelType]);
  const configs = configData?.configs ?? EMPTY_MODEL_CONFIGS;
  const usage = configData?.usage ?? EMPTY_USAGE_ROWS;
  const usageByModel = useMemo(() => {
    const map = new Map<string, UsageRow>();
    for (const u of usage) map.set(u.modelUsed, u);
    return map;
  }, [usage]);

  const configByModel = useMemo(() => {
    const map = new Map<string, ModelConfigRow>();
    for (const c of configs) map.set(c.modelId, c);
    return map;
  }, [configs]);

  // Effective order: persisted manual order, else catalog order
  const effectiveOrder = useMemo(() => {
    if (order) return order;
    const sorted = [...catalog].sort((a, b) => {
      const sa = configByModel.get(a.id)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const sb = configByModel.get(b.id)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
      return sa - sb;
    });
    return sorted.map((m) => m.id);
  }, [order, catalog, configByModel]);

  const activeStrategy = storedToButton[routingData?.config?.strategy ?? "priority"] ?? "manual";
  const isManual = activeStrategy === "manual";

  const filtered = useMemo(() => {
    const byId = new Map(catalog.map((m) => [m.id, m]));
    const ordered = effectiveOrder.map((id) => byId.get(id)).filter((m): m is ModelDefinition => !!m);
    return ordered.filter((model) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        model.name.toLowerCase().includes(q) ||
        model.id.toLowerCase().includes(q) ||
        model.providerName.toLowerCase().includes(q);
      const hasVision = model.features.some((f) => /vision|multimodal|image/i.test(f));
      const hasTools = model.features.some((f) => /tool|function/i.test(f));
      const matchesVision = !visionOnly || hasVision;
      const matchesTools = !toolsOnly || hasTools;
      const matchesContext = model.contextWindow >= minContext;
      return matchesSearch && matchesVision && matchesTools && matchesContext;
    });
  }, [catalog, effectiveOrder, search, visionOnly, toolsOnly, minContext]);

  // Monthly request budget: capacity = RPD x 30, used = logged requests
  const budget = useMemo(() => {
    const items = catalog
      .map((m) => {
        const capacity = m.freeTier.rpd * 30;
        const used = usageByModel.get(m.id)?.requests ?? 0;
        return { model: m, capacity, used };
      })
      .sort((a, b) => b.capacity - a.capacity);
    const totalCapacity = items.reduce((s, i) => s + i.capacity, 0);
    const totalUsed = items.reduce((s, i) => s + i.used, 0);
    return { items, totalCapacity, totalUsed };
  }, [catalog, usageByModel]);

  if (!isValidModelType(type)) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center space-y-3">
        <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
        <p className="text-sm text-zinc-400">This model type does not exist.</p>
        <Link href="/models/chat" className="text-gold-400 hover:text-gold-300 text-sm font-medium">
          Back to models
        </Link>
      </div>
    );
  }

  const budgetShown = showAllBudget ? budget.items : budget.items.slice(0, 12);

  async function persistStrategy(buttonId: string) {
    const btn = STRATEGY_BUTTONS.find((b) => b.id === buttonId);
    if (!btn) return;
    await fetch("/api/routing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategy: btn.stored }),
    });
    mutateRouting();
    toast(`Routing strategy: ${btn.label}`);
  }

  async function toggleModel(modelId: string, enabled: boolean) {
    setOrder(null);
    await fetch("/api/models/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, enabled }),
    });
    mutateConfig();
  }

  async function bulkEnabled(enabled: boolean) {
    await fetch("/api/models/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulkEnabled", enabled }),
    });
    mutateConfig();
    toast(enabled ? "All models enabled" : "All models disabled");
  }

  async function persistReorder(newOrder: string[]) {
    setOrder(newOrder);
    await fetch("/api/models/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder", order: newOrder }),
    });
    mutateConfig();
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...effectiveOrder];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);
    persistReorder(next);
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id);
    toast("Model id copied");
  }

  const strategyHint = STRATEGY_BUTTONS.find((b) => b.id === activeStrategy)?.hint ?? "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Header + modality tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Models</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-md leading-relaxed">
            Pick a routing strategy. In Manual mode you drag to set the order; the other
            strategies route by live score across reliability, speed and intelligence.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl border border-zinc-800 bg-card overflow-x-auto">
          {MODEL_TYPES.map((t) => (
            <Link
              key={t.id}
              href={`/models/${t.id}`}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                t.id === modelType
                  ? "bg-gold-500/20 text-gold-300 border border-gold-500/40"
                  : "text-zinc-400 hover:text-foreground border border-transparent"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Monthly token budget */}
      <div className="rounded-xl border border-zinc-800 bg-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-sm font-semibold text-foreground">Monthly request budget</h2>
          <div className="text-xs font-mono text-zinc-400">
            <span className="text-emerald-400 font-semibold">{formatQuota(Math.max(0, budget.totalCapacity - budget.totalUsed))}</span>
            {" remaining · "}
            {budget.totalCapacity > 0 ? Math.round((budget.totalUsed / budget.totalCapacity) * 100) : 0}
            % of {formatQuota(budget.totalCapacity)} ·{" "}
            <span className="text-foreground font-semibold underline">{formatQuota(budget.totalUsed)} used</span>
          </div>
        </div>
        {/* Stacked capacity bar */}
        <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-zinc-800 gap-px">
          {budget.items.map((item, i) => {
            const share = budget.totalCapacity > 0 ? item.capacity / budget.totalCapacity : 0;
            const usedShare = item.capacity > 0 ? Math.min(1, item.used / item.capacity) : 0;
            return (
              <div
                key={item.model.id}
                className={`relative h-full ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}`}
                style={{ width: `${share * 100}%` }}
                title={`${item.model.name}: ${item.used} / ${item.capacity}`}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-zinc-950/60"
                  style={{ width: `${(1 - usedShare) * 100}%` }}
                />
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
          {budgetShown.map((item, i) => (
            <div key={item.model.id} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}`} />
                <span className="text-zinc-300 truncate">{item.model.name} ({item.model.providerName})</span>
              </div>
              <span className="font-mono text-zinc-400 shrink-0">
                {formatQuota(item.used)} / {formatQuota(item.capacity)}
              </span>
            </div>
          ))}
        </div>
        {budget.items.length > 12 && (
          <button
            onClick={() => setShowAllBudget((v) => !v)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-foreground transition-colors mx-auto"
          >
            {showAllBudget ? "Show top models" : `Show all ${budget.items.length} models`}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllBudget ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {/* Routing strategy */}
      <div className="rounded-xl border border-zinc-800 bg-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-sm font-semibold text-foreground">Routing strategy</h2>
          <button
            onClick={() => setMoreOptions((v) => !v)}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-foreground transition-colors"
          >
            More options
            {moreOptions ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg border border-zinc-800 bg-secondary w-fit flex-wrap">
          {STRATEGY_BUTTONS.map((b) => (
            <button
              key={b.id}
              onClick={() => persistStrategy(b.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeStrategy === b.id
                  ? "bg-gold-500/25 text-gold-200 border border-gold-500/50"
                  : "text-zinc-400 hover:text-foreground border border-transparent"
              }`}
            >
              {b.label}
            </button>
          ))}
          <Link
            href="/routing"
            className="px-3.5 py-1.5 text-xs font-medium rounded-md text-zinc-400 hover:text-foreground transition-colors"
          >
            Custom
          </Link>
        </div>
        <p className="text-xs text-zinc-500">{strategyHint}</p>

        {moreOptions && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="rounded-lg border border-zinc-800 bg-secondary p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gold-400" />
                  <h3 className="text-xs font-semibold text-foreground">Fallback chains</h3>
                </div>
                <Link href="/routing" className="text-[11px] text-gold-400 hover:text-gold-300 flex items-center gap-1">
                  Edit <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-[11px] text-zinc-500">
                {(routingData?.config?.fallbackChain?.length ?? 0)} providers in the active chain, callable as auto-names in /v1/models.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(routingData?.config?.fallbackChain ?? []).slice(0, 8).map((p) => (
                  <span key={p} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-secondary p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-foreground">Router pressure</h3>
              </div>
              <p className="text-[11px] text-zinc-500">
                Live quota pressure across enabled models. {catalog.filter((m) => configByModel.get(m.id)?.enabled !== false).length} of {catalog.length} models on.
              </p>
              <div className="space-y-1.5">
                {budget.items.slice(0, 3).map((item) => {
                  const pct = item.capacity > 0 ? Math.min(100, (item.used / item.capacity) * 100) : 0;
                  return (
                    <div key={item.model.id} className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-zinc-400 truncate w-32">{item.model.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full ${pct > 80 ? "bg-rose-500" : pct > 50 ? "bg-gold-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.max(2, pct)}%` }}
                        />
                      </div>
                      <span className="text-zinc-500 w-8 text-right">{Math.round(pct)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search + filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models or providers…"
            className="w-full bg-card border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setVisionOnly((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${
              visionOnly ? "bg-gold-500/20 text-gold-300 border-gold-500/40" : "bg-card text-zinc-400 hover:text-foreground border-zinc-800"
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Vision
          </button>
          <button
            onClick={() => setToolsOnly((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${
              toolsOnly ? "bg-gold-500/20 text-gold-300 border-gold-500/40" : "bg-card text-zinc-400 hover:text-foreground border-zinc-800"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> Tools
          </button>
          {[
            { label: "32K+", value: 32768 },
            { label: "128K+", value: 131072 },
            { label: "1M+", value: 1000000 },
          ].map((c) => (
            <button
              key={c.label}
              onClick={() => setMinContext((v) => (v === c.value ? 0 : c.value))}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${
                minContext === c.value ? "bg-gold-500/20 text-gold-300 border-gold-500/40" : "bg-card text-zinc-400 hover:text-foreground border-zinc-800"
              }`}
            >
              {c.label}
            </button>
          ))}
          <div className="flex items-center gap-1.5 ml-1">
            <button
              onClick={() => bulkEnabled(true)}
              className="px-3 py-2 text-xs rounded-lg bg-card text-zinc-300 hover:text-foreground border border-zinc-800 transition-colors cursor-pointer"
            >
              Enable all
            </button>
            <button
              onClick={() => bulkEnabled(false)}
              className="px-3 py-2 text-xs rounded-lg bg-card text-zinc-300 hover:text-foreground border border-zinc-800 transition-colors cursor-pointer"
            >
              Disable all
            </button>
          </div>
        </div>
      </div>

      {/* Scored model table */}
      <div className="rounded-xl border border-zinc-800 bg-card overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-mono text-[10px]">
              <tr>
                <th className="p-3 w-10">#</th>
                <th className="p-3.5">Model</th>
                <th className="p-3.5">Reliability</th>
                <th className="p-3.5">Speed</th>
                <th className="p-3.5">Intelligence</th>
                <th className="p-3.5">Guardrails</th>
                <th className="p-3.5">Score</th>
                <th className="p-3.5 text-center">On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
              {filtered.map((model, index) => {
                const cfg = configByModel.get(model.id);
                const enabled = cfg?.enabled !== false;
                const scores = staticScores(model);
                const u = usageByModel.get(model.id);
                const liveReliability =
                  u && u.requests >= 3
                    ? Math.round(((u.requests - u.errors) / u.requests) * 100)
                    : null;
                const score = compositeScore(model, liveReliability);
                const hasVision = model.features.some((f) => /vision|multimodal|image/i.test(f));
                const hasTools = model.features.some((f) => /tool|function/i.test(f));
                return (
                  <tr
                    key={model.id}
                    draggable={isManual}
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(index)}
                    className={`transition-colors ${enabled ? "hover:bg-zinc-800/30" : "opacity-45"} ${isManual ? "cursor-grab active:cursor-grabbing" : ""}`}
                  >
                    <td className="p-3 text-zinc-500 font-mono">
                      <div className="flex items-center gap-1">
                        {isManual && <GripVertical className="w-3.5 h-3.5 text-zinc-600" />}
                        {index + 1}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${model.isAutoProfile ? "bg-gold-500/20 text-gold-400" : "bg-gold-500/20 text-gold-400"}`}>
                          <Cpu className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/models/${modelType}/${encodeURIComponent(model.id.replace("/", "--"))}`}
                              className="font-semibold text-foreground hover:text-gold-300 transition-colors truncate"
                            >
                              {cfg?.displayName || model.name}
                            </Link>
                            <span className="text-[10px] text-zinc-500">{model.providerName}</span>
                            {hasVision && <span className="text-[9px] px-1 py-0.5 rounded bg-gold-500/15 text-gold-300 border border-gold-500/30">Vision</span>}
                            {hasTools && <span className="text-[9px] px-1 py-0.5 rounded bg-gold-500/15 text-gold-300 border border-gold-500/30">Tools</span>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <code className="text-[11px] font-mono text-gold-400">{model.id}</code>
                            <button onClick={() => copyId(model.id)} className="text-zinc-600 hover:text-zinc-300 transition-colors" aria-label="Copy model id">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            {formatQuota(model.freeTier.rpd * 30)} req/mo · {formatContext(model.contextWindow)} ctx
                          </div>
                        </div>
                      </div>
                    </td>
                    <ScoreCell value={liveReliability} fallbackLabel="no data" color="bg-emerald-500" />
                    <ScoreCell value={scores.speed} color="bg-gold-500" />
                    <ScoreCell value={scores.intelligence} color="bg-gold-500" />
                    <td className="p-3.5 font-mono text-zinc-400">
                      {scores.guardrails ?? "—"}
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-foreground">
                      {score.toFixed(3)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => toggleModel(model.id, !enabled)}
                        className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${enabled ? "bg-gold-500" : "bg-zinc-700"}`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${enabled ? "translate-x-4" : ""}`}
                        />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-zinc-400 space-y-2">
            <Cpu className="w-8 h-8 mx-auto text-zinc-600" />
            <p className="text-sm font-medium">No models found matching your filters.</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500 pb-4">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Toggles, order and strategy persist and immediately affect /v1 routing.
        </span>
        <Link href="/playground" className="flex items-center gap-1.5 text-gold-400 hover:text-gold-300 font-medium">
          <Terminal className="w-3.5 h-3.5" /> Test in Playground
        </Link>
      </div>
    </div>
  );
}

function ScoreCell({ value, color, fallbackLabel }: { value: number | null; color: string; fallbackLabel?: string }) {
  return (
    <td className="p-3.5">
      {value === null ? (
        <span className="text-zinc-600 text-[11px]">{fallbackLabel ?? "—"}</span>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-14 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
          </div>
          <span className="font-mono text-zinc-300">{value}</span>
        </div>
      )}
    </td>
  );
}
