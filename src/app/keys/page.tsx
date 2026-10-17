"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  Lock,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Server,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { PROVIDERS_INFO } from "@/lib/models-data";

interface ProviderKeyItem {
  id: number;
  provider: string;
  label: string;
  maskedKey: string;
  isConfigured: boolean;
  isActive: boolean;
  status: string;
  rpmLimit: number;
  currentRpm: number;
  rpdLimit: number;
  currentRpd: number;
  lastTestedAt?: string;
  customBaseUrl?: string;
}

async function getKeysData() {
  const response = await fetch("/api/keys");
  if (!response.ok) {
    throw new Error("Failed to load keys");
  }
  return response.json();
}

export default function KeysPage() {
  const { toast } = useToast();
  const [unifiedKey, setUnifiedKey] = useState<string>("");
  const [providerKeys, setProviderKeys] = useState<ProviderKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Key Form State
  const [newProvider, setNewProvider] = useState("groq");
  const [newLabel, setNewLabel] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [newRpm, setNewRpm] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testingKeyId, setTestingKeyId] = useState<number | null>(null);

  const fetchKeys = async () => {
    try {
      const data = await getKeysData();
      if (data.unifiedKey?.key) {
        setUnifiedKey(data.unifiedKey.key);
      }
      if (data.providerKeys) {
        setProviderKeys(data.providerKeys);
      }
    } catch {
      toast("Failed to load keys", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const loadKeys = async () => {
      try {
        const data = await getKeysData();
        if (!active) return;
        if (data.unifiedKey?.key) {
          setUnifiedKey(data.unifiedKey.key);
        }
        if (data.providerKeys) {
          setProviderKeys(data.providerKeys);
        }
      } catch {
        if (active) toast("Failed to load keys", "error");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadKeys();
    return () => {
      active = false;
    };
  }, [toast]);

  const handleCopyUnifiedKey = async () => {
    try {
      await navigator.clipboard.writeText(unifiedKey);
      setCopiedKey(true);
      toast("Unified API key copied!", "success");
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast("Failed to copy", "error");
    }
  };

  const handleRegenerateKey = async () => {
    if (!confirm("Are you sure you want to regenerate your unified API key? Any existing client using the old key will need to be updated.")) return;
    try {
      const res = await fetch("/api/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate_unified_key" }),
      });
      const data = await res.json();
      if (data.unifiedKey?.key) {
        setUnifiedKey(data.unifiedKey.key);
        toast("Unified API Key regenerated!", "success");
      }
    } catch {
      toast("Failed to regenerate key", "error");
    }
  };

  const handleToggleKey = async (id: number, currentActive: boolean) => {
    try {
      const res = await fetch("/api/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      if (res.ok) {
        setProviderKeys((prev) =>
          prev.map((k) => (k.id === id ? { ...k, isActive: !currentActive } : k))
        );
        toast(`Key ${!currentActive ? "enabled" : "disabled"}`, "info");
      }
    } catch {
      toast("Failed to toggle key", "error");
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!confirm("Delete this provider key?")) return;
    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setProviderKeys((prev) => prev.filter((k) => k.id !== id));
        toast("Provider key removed", "success");
      }
    } catch {
      toast("Failed to delete key", "error");
    }
  };

  const handleTestKey = async (keyItem: ProviderKeyItem) => {
    if (!keyItem.isConfigured || testingKeyId !== null) return;

    setTestingKeyId(keyItem.id);
    toast(`Sending a real test request to ${keyItem.label}...`, "info");

    try {
      const response = await fetch("/api/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: keyItem.id }),
      });
      const result = await response.json();
      setProviderKeys((previous) =>
        previous.map((key) =>
          key.id === keyItem.id
            ? {
                ...key,
                status: result.status ?? (response.ok ? "healthy" : "error"),
                lastTestedAt: new Date().toISOString(),
              }
            : key
        )
      );
      toast(result.message ?? result.error ?? "Provider test failed", response.ok ? "success" : "error");
    } catch {
      toast("Could not reach the provider test endpoint", "error");
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiKey.trim()) {
      toast("Please enter an API key", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: newProvider,
          label: newLabel || `${newProvider.toUpperCase()} Key`,
          apiKey: newApiKey,
          customBaseUrl: newProvider === "cloudflare" ? customUrl.trim() : undefined,
          rpmLimit: newRpm,
        }),
      });

      if (res.ok) {
        toast("Provider key saved. Test the connection to verify it.", "success");
        setShowAddModal(false);
        setNewApiKey("");
        setNewLabel("");
        setCustomUrl("");
        fetchKeys();
      } else {
        toast("Failed to store key", "error");
      }
    } catch {
      toast("Error storing key", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gold-950/80 border border-gold-800/40 text-gold-300 text-xs font-mono mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Admin-only key management</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Keys & Security</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Provider secrets stay on the server and dashboard responses include only masked values. The database provider controls encryption at rest; this app does not add a separate encryption layer.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-zinc-950 font-medium text-xs transition-all shadow-md shadow-gold-950 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Provider Key</span>
        </button>
      </div>

      {/* Unified Bearer Token Banner */}
      <div className="p-6 rounded-2xl border border-gold-500/30 bg-secondary space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold-500/15 border border-gold-500/30 text-gold-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Unified API Key (Bearer Token)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  {unifiedKey ? "Ready" : "Unavailable"}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Point all OpenAI SDKs, LangChain, Claude Code CLI, Cursor, and Zed at this token.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUnifiedKey}
              disabled={!unifiedKey}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-zinc-950 font-bold text-xs transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? "Copied" : "Copy Token"}</span>
            </button>
            <button
              onClick={handleRegenerateKey}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-foreground transition-colors cursor-pointer"
              title="Regenerate unified key"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-background border border-zinc-800/90 font-mono text-xs text-gold-300 select-all overflow-x-auto">
          {unifiedKey || "No unified key available"}
        </div>
      </div>

      {/* Provider Keys List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Server className="w-4 h-4 text-gold-400" />
            <span>Configured Upstream Providers</span>
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            {providerKeys.filter((k) => k.isActive && k.isConfigured).length} of {providerKeys.length} configured
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providerKeys.length === 0 && !loading && (
            <p className="col-span-full rounded-lg border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
              No provider keys are configured. Add a real provider credential to run live model requests.
            </p>
          )}
          {providerKeys.map((keyItem) => (
            <div
              key={keyItem.id}
              className={`p-5 rounded-xl border bg-card space-y-3 transition-all ${
                keyItem.isActive
                  ? "border-zinc-800 hover:border-zinc-700"
                  : "border-zinc-900 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-mono text-xs font-bold text-foreground uppercase">
                    {keyItem.provider.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{keyItem.label}</h3>
                    <code className="text-[11px] text-zinc-400 font-mono">{keyItem.maskedKey}</code>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      keyItem.isConfigured && keyItem.status === "healthy"
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40"
                        : "bg-rose-950/80 text-rose-400 border border-rose-800/40"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${keyItem.isConfigured && keyItem.status === "healthy" ? "bg-emerald-400" : "bg-rose-400"}`} />
                    <span>{keyItem.isConfigured ? keyItem.status : "setup required"}</span>
                  </span>
                </div>
              </div>

              {/* Rate tracking counters */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80 text-xs">
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>RPM Utilization:</span>
                  <span className="font-mono text-gold-300">
                    {keyItem.currentRpm} / {keyItem.rpmLimit} req/min
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold-500 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((keyItem.currentRpm / keyItem.rpmLimit) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
                <button
                  onClick={() => void handleTestKey(keyItem)}
                  disabled={!keyItem.isConfigured || testingKeyId !== null}
                  className="text-gold-400 hover:text-gold-300 font-medium flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{testingKeyId === keyItem.id ? "Testing…" : "Test connection"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleKey(keyItem.id, keyItem.isActive)}
                    className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] cursor-pointer"
                  >
                    {keyItem.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => handleDeleteKey(keyItem.id)}
                    className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove key"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add Provider Key */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-card p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Key className="w-4 h-4 text-gold-400" />
                <span>Add Upstream Provider Key</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKey} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Provider</label>
                <select
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  className="w-full bg-background border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-gold-500"
                >
                  {PROVIDERS_INFO.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {newProvider === "cloudflare" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Cloudflare AI base URL</label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://api.cloudflare.com/client/v4/accounts/<account-id>/ai/v1"
                    className="w-full bg-background border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-gold-500 font-mono"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Display Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. My Primary Groq Key"
                  className="w-full bg-background border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">API Key Secret</label>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="Enter key (e.g. gsk_...)"
                  className="w-full bg-background border border-zinc-800 rounded-lg p-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300 font-semibold">RPM Limit</span>
                  <span className="font-mono text-gold-400">{newRpm}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={newRpm}
                  onChange={(e) => setNewRpm(parseInt(e.target.value, 10))}
                  className="w-full accent-gold-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-xs text-zinc-300 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-zinc-950 font-bold text-xs transition-colors"
                >
                  {isSubmitting ? "Saving key…" : "Save Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
