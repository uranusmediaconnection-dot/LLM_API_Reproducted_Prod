"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import {
  ChevronLeft,
  Copy,
  Eye,
  Wrench,
  Link2,
  Trash2,
  Terminal,
  Save,
  Check,
} from "lucide-react";
import { ALL_MODELS, ModelDefinition } from "@/lib/models-data";
import {
  MODEL_TYPES,
  ModelType,
  isValidModelType,
  staticScores,
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
  contextOverride?: number | null;
  capabilityTier?: string | null;
  rpmOverride?: number | null;
  rpdOverride?: number | null;
  tpmOverride?: number | null;
  tpdOverride?: number | null;
  toolsEnabled: boolean;
  visionEnabled: boolean;
  inChain: boolean;
  aliases: string[];
}

const TIERS = ["Small", "Medium", "Large", "Flagship"];

export default function ModelDetailPage() {
  const params = useParams<{ type: string; slug: string }>();
  const { toast } = useToast();
  const type = params.type as string;
  const modelId = decodeURIComponent(params.slug).replace(/--/g, "/");

  const { data: configData, mutate: mutateConfig } = useSWR<{ configs: ModelConfigRow[] }>(
    "/api/models/config",
    fetcher
  );
  const { data: keysData } = useSWR<{ unifiedKey: { key: string } | null }>("/api/keys", fetcher);

  const [aliasInput, setAliasInput] = useState("");
  const [draft, setDraft] = useState<Record<string, Partial<ModelConfigRow>>>({});

  const model = ALL_MODELS.find((m) => m.id === modelId);

  // Providers serving the same unified model id (id without provider prefix)
  const unifiedId = modelId.includes("/") ? modelId.split("/")[1] : modelId;
  const providers = useMemo(
    () => ALL_MODELS.filter((m) => (m.id.includes("/") ? m.id.split("/")[1] : m.id) === unifiedId),
    [unifiedId]
  );

  if (!isValidModelType(type) || !model) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center space-y-3">
        <h1 className="text-2xl font-bold text-foreground">Page not found</h1>
        <p className="text-sm text-zinc-400">This model does not exist in the catalog.</p>
        <Link href="/models/chat" className="text-gold-400 hover:text-gold-300 text-sm font-medium">
          Back to models
        </Link>
      </div>
    );
  }

  const modelType = type as ModelType;
  const cfg = configData?.configs?.find((c) => c.modelId === model.id);
  const scores = staticScores(model);
  const context = cfg?.contextOverride ?? model.contextWindow;
  const rpm = cfg?.rpmOverride ?? model.freeTier.rpm;
  const rpd = cfg?.rpdOverride ?? model.freeTier.rpd;
  const tpm = cfg?.tpmOverride ?? model.freeTier.tpm;
  const aliases: string[] = cfg?.aliases ?? [];
  const unifiedKey = keysData?.unifiedKey?.key ?? "YOUR_UNIFIED_API_KEY";

  function getDraft(id: string) {
    return draft[id] ?? {};
  }

  async function saveField(id: string, field: string, value: unknown) {
    // optimistic local draft, then persist
    setDraft((d) => ({ ...d, [id]: { ...d[id], [field]: value } }));
    await fetch("/api/models/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: id, [field]: value }),
    });
    mutateConfig();
    setDraft((d) => {
      const next = { ...d };
      const entry = { ...(next[id] ?? {}) };
      delete entry[field as keyof ModelConfigRow];
      next[id] = entry;
      return next;
    });
  }

  async function addAlias() {
    const alias = aliasInput.trim();
    if (!alias) return;
    const next = [...aliases, alias];
    setAliasInput("");
    await fetch("/api/models/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: model!.id, aliases: next }),
    });
    mutateConfig();
    toast("Alias added");
  }

  async function removeAlias(alias: string) {
    await fetch("/api/models/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: model!.id, aliases: aliases.filter((a) => a !== alias) }),
    });
    mutateConfig();
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id);
    toast("Copied");
  }

  const curl = `curl https://thesun-api.vercel.app/v1/chat/completions \\
  -H "Authorization: Bearer ${unifiedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${unifiedId}",
    "messages": [
      { "role": "user", "content": "Hello!" }
    ]
  }'`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Header + modality tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">{cfg?.displayName || model.name}</h1>
          <p className="text-sm text-zinc-400 mt-1">Providers serving this model</p>
          <Link
            href={`/models/${modelType}`}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-foreground mt-2 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to models
          </Link>
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

      {/* Identity chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-zinc-800 font-mono text-xs text-gold-300">
          {unifiedId}
          <button onClick={() => copyId(unifiedId)} className="text-zinc-500 hover:text-foreground transition-colors" aria-label="Copy model id">
            <Copy className="w-3 h-3" />
          </button>
        </span>
        <span className="px-2.5 py-1 rounded-md bg-zinc-800/60 border border-zinc-700/60 text-[11px] text-zinc-300">
          {providers.length} provider{providers.length === 1 ? "" : "s"}
        </span>
        <span className="px-2.5 py-1 rounded-md bg-zinc-800/60 border border-zinc-700/60 text-[11px] font-mono text-zinc-300">
          {formatQuota(rpd * 30)}/mo
        </span>
        {(cfg?.visionEnabled || model.features.some((f) => /vision|multimodal|image/i.test(f))) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gold-500/15 border border-gold-500/30 text-[11px] text-gold-300">
            <Eye className="w-3 h-3" /> Vision
          </span>
        )}
        {(cfg?.toolsEnabled ?? model.features.some((f) => /tool|function/i.test(f))) && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gold-500/15 border border-gold-500/30 text-[11px] text-gold-300">
            <Wrench className="w-3 h-3" /> Tools
          </span>
        )}
      </div>

      {/* Provider table */}
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
                <th className="p-3.5">Score</th>
                <th className="p-3.5 text-center">On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
              {providers.map((p, i) => {
                const pCfg = configData?.configs?.find((c) => c.modelId === p.id);
                const enabled = pCfg?.enabled !== false;
                const pScores = staticScores(p);
                return (
                  <tr key={p.id} className={enabled ? "" : "opacity-45"}>
                    <td className="p-3 text-zinc-500 font-mono">{i + 1}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{pCfg?.displayName || p.name}</span>
                        <span className="text-[10px] text-zinc-500">{p.providerName}</span>
                        {p.features.some((f) => /vision|multimodal|image/i.test(f)) && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-gold-500/15 text-gold-300 border border-gold-500/30">Vision</span>
                        )}
                        {p.features.some((f) => /tool|function/i.test(f)) && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-gold-500/15 text-gold-300 border border-gold-500/30">Tools</span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {formatQuota(p.freeTier.rpd * 30)} req/mo · {formatContext(p.contextWindow)} ctx
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-zinc-500 text-[11px]">no data</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div className="h-full bg-gold-500" style={{ width: `${pScores.speed}%` }} />
                        </div>
                        <span className="font-mono text-zinc-300">{pScores.speed}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div className="h-full bg-gold-500" style={{ width: `${pScores.intelligence}%` }} />
                        </div>
                        <span className="font-mono text-zinc-300">{pScores.intelligence}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-foreground">{pScores.score.toFixed(3)}</td>
                    <td className="p-3.5 text-center">
                      <button
                        role="switch"
                        aria-checked={enabled}
                        onClick={() => saveField(p.id, "enabled", !enabled)}
                        className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${enabled ? "bg-gold-500" : "bg-zinc-700"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${enabled ? "translate-x-4" : ""}`} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provider settings */}
      <div className="rounded-xl border border-zinc-800 bg-card p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Provider settings</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Local edits to catalog models are kept across catalog syncs. Overrides apply to routing quotas and display.
          </p>
        </div>
        {providers.map((p) => {
          const pCfg = configData?.configs?.find((c) => c.modelId === p.id);
          const d = getDraft(p.id);
          const displayName = d.displayName ?? pCfg?.displayName ?? p.name;
          const contextVal = d.contextOverride ?? pCfg?.contextOverride ?? p.contextWindow;
          const tier = d.capabilityTier ?? pCfg?.capabilityTier ?? "Medium";
          const rpmVal = d.rpmOverride ?? pCfg?.rpmOverride ?? p.freeTier.rpm;
          const rpdVal = d.rpdOverride ?? pCfg?.rpdOverride ?? p.freeTier.rpd;
          const tpmVal = d.tpmOverride ?? pCfg?.tpmOverride ?? p.freeTier.tpm;
          const tools = d.toolsEnabled ?? pCfg?.toolsEnabled ?? true;
          const vision = d.visionEnabled ?? pCfg?.visionEnabled ?? false;
          const inChain = d.inChain ?? pCfg?.inChain ?? true;
          return (
            <div key={p.id} className="rounded-lg border border-zinc-800 bg-secondary p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-foreground">{p.providerName}</span>
                <code className="text-[11px] font-mono text-gold-400">{p.id}</code>
                <button onClick={() => copyId(p.id)} className="text-zinc-600 hover:text-zinc-300" aria-label="Copy provider model id">
                  <Copy className="w-3 h-3" />
                </button>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">catalog</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">Display name</span>
                  <input
                    value={displayName}
                    onChange={(e) => setDraft((dr) => ({ ...dr, [p.id]: { ...dr[p.id], displayName: e.target.value } }))}
                    onBlur={() => displayName !== (pCfg?.displayName ?? p.name) && saveField(p.id, "displayName", displayName)}
                    className="w-full bg-card border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-gold-500"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">Context</span>
                  <input
                    type="number"
                    value={contextVal}
                    onChange={(e) => setDraft((dr) => ({ ...dr, [p.id]: { ...dr[p.id], contextOverride: Number(e.target.value) } }))}
                    onBlur={() => contextVal !== (pCfg?.contextOverride ?? p.contextWindow) && saveField(p.id, "contextOverride", contextVal)}
                    className="w-full bg-card border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-gold-500"
                  />
                </label>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <ToggleChip label="Tools" active={tools} onToggle={() => saveField(p.id, "toolsEnabled", !tools)} />
                <ToggleChip label="Vision" active={vision} onToggle={() => saveField(p.id, "visionEnabled", !vision)} />
                <ToggleChip label="In chain" active={inChain} onToggle={() => saveField(p.id, "inChain", !inChain)} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <label className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">Capability tier</span>
                  <select
                    value={tier}
                    onChange={(e) => saveField(p.id, "capabilityTier", e.target.value)}
                    className="w-full bg-card border border-zinc-800 rounded-lg px-2 py-2 text-xs text-zinc-200 focus:outline-none focus:border-gold-500"
                  >
                    {TIERS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <NumberField label="RPM" value={rpmVal} base={p.freeTier.rpm} current={pCfg?.rpmOverride} onSave={(v) => saveField(p.id, "rpmOverride", v)} onDraft={(v) => setDraft((dr) => ({ ...dr, [p.id]: { ...dr[p.id], rpmOverride: v } }))} />
                <NumberField label="RPD" value={rpdVal} base={p.freeTier.rpd} current={pCfg?.rpdOverride} onSave={(v) => saveField(p.id, "rpdOverride", v)} onDraft={(v) => setDraft((dr) => ({ ...dr, [p.id]: { ...dr[p.id], rpdOverride: v } }))} />
                <NumberField label="TPM" value={tpmVal} base={p.freeTier.tpm} current={pCfg?.tpmOverride} onSave={(v) => saveField(p.id, "tpmOverride", v)} onDraft={(v) => setDraft((dr) => ({ ...dr, [p.id]: { ...dr[p.id], tpmOverride: v } }))} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Provider model ids */}
      <div className="rounded-xl border border-zinc-800 bg-card p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Provider model ids</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Send the unified model id to fail over across every provider, or a provider-specific id to pin one provider.
          </p>
        </div>
        <div className="divide-y divide-zinc-800/70">
          {providers.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 gap-4">
              <span className="text-xs text-zinc-400 w-32 shrink-0">{p.providerName}</span>
              <code className="text-xs font-mono text-zinc-200 flex-1 truncate">{p.id}</code>
              <button onClick={() => copyId(p.id)} className="text-zinc-500 hover:text-foreground transition-colors shrink-0" aria-label="Copy id">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Merge model aliases */}
      <div className="rounded-xl border border-zinc-800 bg-card p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Merge model aliases</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Requests for the unified model id are also served through these custom-provider aliases (e.g. custom:my-alias).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={aliasInput}
            onChange={(e) => setAliasInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) addAlias();
            }}
            placeholder="custom:my-alias"
            className="flex-1 bg-secondary border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-gold-500"
          />
          <button
            onClick={addAlias}
            disabled={!aliasInput.trim()}
            className="px-4 py-2 rounded-lg bg-gold-600 hover:bg-gold-500 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 text-xs font-medium transition-colors cursor-pointer"
          >
            Add
          </button>
        </div>
        {aliases.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {aliases.map((a) => (
              <span key={a} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800/60 border border-zinc-700/60 text-[11px] font-mono text-zinc-300">
                <Link2 className="w-3 h-3 text-gold-400" />
                {a}
                <button onClick={() => removeAlias(a)} className="text-zinc-500 hover:text-rose-400 transition-colors" aria-label={`Remove alias ${a}`}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Use this model */}
      <div className="rounded-xl border border-zinc-800 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-foreground">Use this model</h2>
          </div>
          <button onClick={() => copyId(curl)} className="text-zinc-500 hover:text-foreground transition-colors" aria-label="Copy curl command">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
        <pre className="p-4 text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">{curl}</pre>
      </div>
    </div>
  );
}

function ToggleChip({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-2 cursor-pointer group">
      <span className={`relative w-9 h-5 rounded-full transition-colors ${active ? "bg-gold-500" : "bg-zinc-700"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${active ? "translate-x-4" : ""}`} />
      </span>
      <span className={`text-xs ${active ? "text-zinc-200" : "text-zinc-500"} group-hover:text-foreground transition-colors`}>{label}</span>
    </button>
  );
}

function NumberField({
  label,
  value,
  base,
  current,
  onSave,
  onDraft,
}: {
  label: string;
  value: number;
  base: number;
  current?: number | null;
  onSave: (v: number | null) => void;
  onDraft: (v: number) => void;
}) {
  const dirty = value !== (current ?? base);
  return (
    <label className="space-y-1">
      <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">{label}</span>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onDraft(Number(e.target.value))}
          onBlur={() => onSave(dirty ? value : null)}
          className="w-full bg-card border border-zinc-800 rounded-lg px-2.5 py-2 pr-7 text-xs font-mono text-zinc-200 focus:outline-none focus:border-gold-500"
        />
        {dirty && (
          <button
            onClick={() => onSave(value)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-emerald-400 hover:text-emerald-300"
            aria-label={`Save ${label}`}
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </label>
  );
}
