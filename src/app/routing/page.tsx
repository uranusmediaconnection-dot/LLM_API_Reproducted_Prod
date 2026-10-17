"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Zap,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowDown,
  ArrowUp,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Save,
  Play,
  Sliders,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { resolveModelRoute } from "@/lib/resolver";

export default function RoutingPage() {
  const { toast } = useToast();
  const [strategy, setStrategy] = useState("priority");
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [maxRetries, setMaxRetries] = useState(3);
  const [stickySessions, setStickySessions] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);
  const [chain, setChain] = useState<string[]>([
    "groq",
    "cerebras",
    "gemini",
    "mistral",
    "openrouter",
    "cohere",
    "cloudflare",
    "huggingface",
    "nvidia",
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Test Route Simulator State
  const [testModelInput, setTestModelInput] = useState("auto:best");
  const [simulationResult, setSimulationResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/routing")
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setStrategy(data.config.strategy || "priority");
          setCooldownSeconds(data.config.cooldownSeconds || 60);
          setMaxRetries(data.config.maxRetries || 3);
          setStickySessions(data.config.stickySessions ?? true);
          setSessionTimeoutMinutes(data.config.sessionTimeoutMinutes || 30);
          if (Array.isArray(data.config.fallbackChain) && data.config.fallbackChain.length > 0) {
            setChain(data.config.fallbackChain);
          }
        }
      })
      .catch(() => {});
  }, []);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newChain = [...chain];
    const temp = newChain[index];
    newChain[index] = newChain[index - 1];
    newChain[index - 1] = temp;
    setChain(newChain);
  };

  const moveDown = (index: number) => {
    if (index === chain.length - 1) return;
    const newChain = [...chain];
    const temp = newChain[index];
    newChain[index] = newChain[index + 1];
    newChain[index + 1] = temp;
    setChain(newChain);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy,
          fallbackChain: chain,
          cooldownSeconds,
          maxRetries,
          stickySessions,
          sessionTimeoutMinutes,
        }),
      });

      if (res.ok) {
        toast("Routing chain & configuration saved successfully!", "success");
      } else {
        toast("Failed to update routing configuration", "error");
      }
    } catch {
      toast("Error communicating with server", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateRoute = () => {
    const resolved = resolveModelRoute(testModelInput);
    setSimulationResult(resolved);
    toast(`Resolved ${testModelInput} -> ${resolved.targetModel.name}`, "info");
  };

  const strategies = [
    {
      id: "priority",
      title: "Strict Priority Chain",
      desc: "Dispatches to your #1 provider. If rate-limited (429) or down (5xx), instantly rolls down the chain.",
      badge: "Recommended",
    },
    {
      id: "latency",
      title: "Lowest Latency (Speed First)",
      desc: "Measures rolling 5-minute TTFT and token generation speed. Routes to fastest operational engine.",
      badge: "Ultra-Fast",
    },
    {
      id: "reliability",
      title: "Highest Reliability",
      desc: "Prioritizes providers with largest remaining daily token headroom and zero recent errors.",
      badge: "99.99% Uptime",
    },
    {
      id: "round_robin",
      title: "Round-Robin Load Balance",
      desc: "Distributes queries evenly across all configured keys to maximize aggregate monthly tokens.",
      badge: "Quota Saver",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gold-950/80 border border-gold-800/40 text-gold-300 text-xs font-mono mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Smart Routing & Fallover Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Fallback Chain Manager</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Configure how The SUN orchestrates requests across free tiers. Set priorities, automatic failover cooldowns, and sticky conversation sessions.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-zinc-950 font-medium text-xs transition-all shadow-md shadow-gold-950 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Routing Configuration</span>
        </button>
      </div>

      {/* Strategies Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-gold-400" />
          <span>Select Routing Strategy</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {strategies.map((s) => (
            <div
              key={s.id}
              onClick={() => setStrategy(s.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                strategy === s.id
                  ? "bg-secondary border-gold-500 shadow-lg shadow-gold-950/40 ring-1 ring-gold-500"
                  : "bg-card border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{s.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gold-950 text-gold-300 border border-gold-800/40">
                    {s.badge}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{s.desc}</p>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-zinc-500">Status</span>
                <span className={strategy === s.id ? "text-gold-400 font-semibold" : "text-zinc-400"}>
                  {strategy === s.id ? "Active Strategy" : "Click to Select"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Two Columns: Fallback Chain Reordering & Failover Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Chain Order */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-gold-400" />
              <span>Provider Fallback Hierarchy</span>
            </h2>
            <span className="text-xs text-zinc-400 font-mono">Top = Primary, Bottom = Fallback</span>
          </div>

          <div className="space-y-2">
            {chain.map((provider, index) => (
              <div
                key={provider}
                className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-800 bg-card hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center font-mono text-xs font-bold text-gold-400">
                    {index + 1}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-foreground capitalize">{provider}</span>
                    <span className="text-xs text-zinc-400 ml-2">
                      {index === 0
                        ? "(Primary Dispatch Target)"
                        : `(Tier ${index + 1} Automatic Backup)`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 transition-colors cursor-pointer"
                    title="Move up priority"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === chain.length - 1}
                    className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-zinc-300 transition-colors cursor-pointer"
                    title="Move down priority"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Failover & Sticky Session Settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-xl border border-zinc-800 bg-card space-y-5 shadow-xl">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gold-400" />
              <span>Failover & Session Controls</span>
            </h3>

            {/* Cooldown duration */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">429 Rate Limit Cooldown</span>
                <span className="font-mono text-gold-400">{cooldownSeconds}s</span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                step="5"
                value={cooldownSeconds}
                onChange={(e) => setCooldownSeconds(parseInt(e.target.value, 10))}
                className="w-full accent-gold-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500">
                Seconds to freeze a rate-limited key before resuming request routing.
              </p>
            </div>

            {/* Max retries */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-medium">Max Retries per Request</span>
                <span className="font-mono text-gold-400">{maxRetries}</span>
              </div>
              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={maxRetries}
                onChange={(e) => setMaxRetries(parseInt(e.target.value, 10))}
                className="w-full accent-gold-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[11px] text-zinc-500">
                Number of backup models to attempt before returning an upstream failure.
              </p>
            </div>

            {/* Sticky Sessions Toggle */}
            <div className="pt-3 border-t border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">
                    Sticky Conversation Sessions
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Locks ongoing chat threads to the same model for coherence.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={stickySessions}
                  onChange={(e) => setStickySessions(e.target.checked)}
                  className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
                />
              </div>

              {stickySessions && (
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Session Expiration</span>
                    <span className="font-mono text-gold-300">{sessionTimeoutMinutes} mins</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={sessionTimeoutMinutes}
                    onChange={(e) => setSessionTimeoutMinutes(parseInt(e.target.value, 10))}
                    className="w-full accent-gold-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Test Router Simulator */}
          <div className="p-5 rounded-xl border border-zinc-800 bg-card space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              <span>Route Resolution Simulator</span>
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testModelInput}
                onChange={(e) => setTestModelInput(e.target.value)}
                placeholder="e.g. auto:best, gpt-4o, auto:coding"
                className="flex-1 bg-background border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-gold-500"
              />
              <button
                onClick={handleSimulateRoute}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-foreground transition-colors cursor-pointer"
              >
                Resolve
              </button>
            </div>

            {simulationResult && (
              <div className="p-3 rounded-lg bg-background border border-zinc-800 text-xs space-y-2 font-mono">
                <div className="text-zinc-400">
                  Target: <strong className="text-gold-300">{simulationResult.targetModel.name}</strong>
                </div>
                <div className="text-zinc-400">
                  Provider: <span className="text-emerald-400 uppercase">{simulationResult.provider}</span>
                </div>
                <div className="text-zinc-400">
                  Fallback Chain ({simulationResult.fallbackChain.length} tiers):
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {simulationResult.fallbackChain.map((m: any) => m.name).join(" → ")}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
