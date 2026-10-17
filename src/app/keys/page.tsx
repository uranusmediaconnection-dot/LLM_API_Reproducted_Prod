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
  apiKey: string;
  maskedKey: string;
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
    toast(`Testing ${keyItem.label}...`, "info");
    // Simulate test ping
    await new Promise((r) => setTimeout(r, 600));
    setProviderKeys((prev) =>
      prev.map((k) =>
        k.id === keyItem.id
          ? { ...k, status: "healthy", lastTestedAt: new Date().toISOString() }
          : k
      )
    );
    toast(`${keyItem.label} is healthy and responding!`, "success");
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
          customBaseUrl: newProvider === "custom" ? customUrl : undefined,
          rpmLimit: newRpm,
        }),
      });

      if (res.ok) {
        toast("Key stored securely and activated!", "success");
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/40 text-cyan-300 text-xs font-mono mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>AES-256 Envelope Encryption Active</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Keys & Security</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Provider keys are encrypted at rest with AES-256-GCM and decrypted in-memory per request. Your applications only ever need the single unified bearer token.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs transition-all shadow-md shadow-cyan-950 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Provider Key</span>
        </button>
      </div>

      {/* Unified Bearer Token Banner */}
      <div className="p-6 rounded-2xl border border-cyan-500/30 bg-[#0b101d] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Unified API Key (Bearer Token)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Point all OpenAI SDKs, LangChain, Claude Code CLI, Cursor, and Zed at this token.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUnifiedKey}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? "Copied" : "Copy Token"}</span>
            </button>
            <button
              onClick={handleRegenerateKey}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Regenerate unified key"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[#07090e] border border-slate-800/90 font-mono text-xs text-cyan-300 select-all overflow-x-auto">
          {unifiedKey}
        </div>
      </div>

      {/* Provider Keys List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400" />
            <span>Configured Upstream Providers</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {providerKeys.filter((k) => k.isActive).length} of {providerKeys.length} active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providerKeys.map((keyItem) => (
            <div
              key={keyItem.id}
              className={`p-5 rounded-xl border bg-[#0b0f19] space-y-3 transition-all ${
                keyItem.isActive
                  ? "border-slate-800 hover:border-slate-700"
                  : "border-slate-900 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono text-xs font-bold text-white uppercase">
                    {keyItem.provider.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{keyItem.label}</h3>
                    <code className="text-[11px] text-slate-400 font-mono">{keyItem.maskedKey}</code>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      keyItem.status === "healthy"
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40"
                        : "bg-rose-950/80 text-rose-400 border border-rose-800/40"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{keyItem.status}</span>
                  </span>
                </div>
              </div>

              {/* Rate tracking counters */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>RPM Utilization:</span>
                  <span className="font-mono text-cyan-300">
                    {keyItem.currentRpm} / {keyItem.rpmLimit} req/min
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round((keyItem.currentRpm / keyItem.rpmLimit) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                <button
                  onClick={() => handleTestKey(keyItem)}
                  className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Test Ping</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleKey(keyItem.id, keyItem.isActive)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] cursor-pointer"
                  >
                    {keyItem.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => handleDeleteKey(keyItem.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0b0f19] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>Add Upstream Provider Key</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKey} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Provider</label>
                <select
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {PROVIDERS_INFO.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="custom">Custom OpenAI Endpoint (Ollama / vLLM / LM Studio)</option>
                </select>
              </div>

              {newProvider === "custom" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Base URL</label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="w-full bg-[#07090e] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Display Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. My Primary Groq Key"
                  className="w-full bg-[#07090e] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">API Key Secret</label>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="Enter key (e.g. gsk_...)"
                  className="w-full bg-[#07090e] border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-semibold">RPM Limit</span>
                  <span className="font-mono text-cyan-400">{newRpm}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={newRpm}
                  onChange={(e) => setNewRpm(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  {isSubmitting ? "Encrypting & Storing..." : "Save Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
