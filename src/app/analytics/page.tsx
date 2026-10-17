"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Activity,
  Zap,
  RefreshCw,
  Cpu,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface AnalyticsData {
  summary: {
    totalRequests: number;
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    avgLatencyMs: number;
    avgTtftMs: number;
    fallbackCount: number;
    uptimePercentage: number;
  };
  providerQuotas: {
    provider: string;
    label: string;
    currentRpm: number;
    rpmLimit: number;
    rpmPercent: number;
    currentRpd: number;
    rpdLimit: number;
    rpdPercent: number;
    status: string;
  }[];
  recentLogs: {
    id: number;
    modelRequested: string;
    providerUsed: string;
    modelUsed: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs: number;
    ttftMs: number;
    statusCode: number;
    isFallback: boolean;
    fallbackAttempts: number;
    createdAt: string;
  }[];
}

async function getAnalyticsData(): Promise<AnalyticsData> {
  const response = await fetch("/api/analytics");
  if (!response.ok) {
    throw new Error("Failed to load analytics");
  }
  return response.json();
}

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setData(await getAnalyticsData());
    } catch {
      toast("Failed to load analytics", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    const loadAnalytics = async () => {
      try {
        const analytics = await getAnalyticsData();
        if (active) setData(analytics);
      } catch {
        if (active) toast("Failed to load analytics", "error");
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void loadAnalytics();
    const interval = setInterval(() => void loadAnalytics(), 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [toast]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
    toast("Metrics refreshed", "info");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gold-950/80 border border-gold-800/40 text-gold-300 text-xs font-mono mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Real-time Telemetry & Rate Caps</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Live Analytics</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Monitor real-time request volume, token generation throughput, TTFT latency benchmarks, and provider rate limit utilization.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-card space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total Requests</span>
            <Activity className="w-4 h-4 text-gold-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
            {data?.summary.totalRequests.toLocaleString() ?? (loading ? "…" : "0")}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>{data ? `${data.summary.uptimePercentage}% Success Rate` : loading ? "—" : "0% Success Rate"}</span>
          </div>
        </div>

        {/* Total Tokens */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-card space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Tokens Processed</span>
            <Zap className="w-4 h-4 text-gold-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gold-300 font-mono">
            {data?.summary.totalTokens.toLocaleString() ?? (loading ? "…" : "0")}
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            In: {data?.summary.promptTokens.toLocaleString() ?? (loading ? "…" : "0")} | Out:{" "}
            {data?.summary.completionTokens.toLocaleString() ?? (loading ? "…" : "0")}
          </div>
        </div>

        {/* Avg Latency */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-card space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Avg Response Latency</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {data ? data.summary.avgLatencyMs : loading ? "…" : 0}ms
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            Avg TTFT: {data ? data.summary.avgTtftMs : loading ? "…" : 0}ms
          </div>
        </div>

        {/* Auto Failovers */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-card space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Recorded Fallbacks</span>
            <Layers className="w-4 h-4 text-gold-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gold-300 font-mono">
            {data?.summary.fallbackCount ?? (loading ? "…" : "0")}
          </div>
          <div className="text-[11px] text-zinc-400">
            Counted from stored request telemetry
          </div>
        </div>
      </div>

      {/* Provider Quota Utilization Gauges */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Cpu className="w-4 h-4 text-gold-400" />
          <span>Provider Free Tier Headroom (RPM & RPD)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.providerQuotas?.map((item, index) => (
            <div
              key={`${item.provider}-${index}`}
              className="p-4 rounded-xl border border-zinc-800 bg-card space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-foreground">{item.label}</h3>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    {item.provider}
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                  {item.status}
                </span>
              </div>

              {/* RPM Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>RPM Rate Limit:</span>
                  <span className="font-mono text-gold-300">
                    {item.currentRpm} / {item.rpmLimit}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold-400 rounded-full transition-all"
                    style={{ width: `${item.rpmPercent}%` }}
                  />
                </div>
              </div>

              {/* RPD Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-zinc-400">
                  <span>RPD (Daily Cap):</span>
                  <span className="font-mono text-gold-300">
                    {item.currentRpd} / {item.rpdLimit.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold-400 rounded-full transition-all"
                    style={{ width: `${item.rpdPercent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Request Logs Table */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Recent Routed Request Telemetry</span>
        </h2>

        <div className="rounded-xl border border-zinc-800 bg-card overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="p-3">Model Requested</th>
                  <th className="p-3">Fulfilled By</th>
                  <th className="p-3">Tokens (Prompt / Compl)</th>
                  <th className="p-3">Latency (TTFT)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Routing Mode</th>
                  <th className="p-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                {!loading && data?.recentLogs.length === 0 && (
                  <tr><td className="p-6 text-center text-sm text-muted-foreground" colSpan={7}>No routed requests recorded yet.</td></tr>
                )}
                {data?.recentLogs?.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-800/20 font-mono">
                    <td className="p-3 text-gold-300 font-semibold">{log.modelRequested}</td>
                    <td className="p-3 text-foreground">
                      <span className="uppercase text-emerald-400 font-bold mr-1">
                        [{log.providerUsed}]
                      </span>
                      <span className="text-zinc-400 text-[11px]">{log.modelUsed}</span>
                    </td>
                    <td className="p-3 text-zinc-300">
                      {log.promptTokens} / {log.completionTokens}{" "}
                      <span className="text-zinc-500">({log.totalTokens} tot)</span>
                    </td>
                    <td className="p-3 text-zinc-200">
                      <span className="text-emerald-400">{log.latencyMs}ms</span>
                      <span className="text-zinc-500 text-[11px] ml-1">({log.ttftMs}ms TTFT)</span>
                    </td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                        {log.statusCode} OK
                      </span>
                    </td>
                    <td className="p-3">
                      {log.isFallback ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-gold-950/80 text-gold-300 border border-gold-800/40">
                          Rescued Fallback
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-gold-950/80 text-gold-300 border border-gold-800/40">
                          Direct Route
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right text-zinc-500 text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
