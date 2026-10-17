"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Sparkles,
  Swords,
  Zap,
  Shield,
  Layers,
  ArrowRight,
  Terminal,
  Cpu,
  RefreshCw,
  Sliders,
  Copy,
  Check,
  Play,
  Lock,
  Workflow,
  Activity,
  CheckCircle2,
  ChevronRight,
  Code2,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { useToast } from "@/components/Toast";
import { PROVIDERS_INFO, PROVIDER_MODELS } from "@/lib/models-data";

export default function LandingPage() {
  const { toast } = useToast();
  const providerCount = PROVIDERS_INFO.length;
  const modelCount = PROVIDER_MODELS.length;
  const peakListedSpeed = Math.max(...PROVIDER_MODELS.map((model) => model.tokensPerSecond));
  const [copiedKey, setCopiedKey] = useState(false);
  const [testPrompt, setTestPrompt] = useState("Explain how smart routing with automatic failover works in 3 bullet points");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testProvider, setTestProvider] = useState<string | null>(null);
  const [testLatency, setTestLatency] = useState<number | null>(null);

  const { data: keysData } = useSWR<{ unifiedKey?: { key?: string } }>(
    "/api/keys",
    async (url: string) => {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load the unified key");
      return response.json();
    }
  );
  const sampleUnifiedKey = keysData?.unifiedKey?.key ?? "";

  const handleCopyKey = async () => {
    if (!sampleUnifiedKey) {
      toast("Unified API key is not available yet", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(sampleUnifiedKey);
      setCopiedKey(true);
      toast("Unified API Key copied to clipboard!", "success");
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast("Failed to copy", "error");
    }
  };

  const handleRunQuickTest = async () => {
    if (!testPrompt.trim() || isTesting) return;
    if (!sampleUnifiedKey) {
      toast("Unified API key is not available yet", "error");
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    setTestProvider(null);
    const start = Date.now();

    try {
      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sampleUnifiedKey}`,
        },
        body: JSON.stringify({
          model: "auto:best",
          messages: [{ role: "user", content: testPrompt }],
          stream: false,
        }),
      });

      const data = await res.json();
      const elapsed = Date.now() - start;
      setTestLatency(elapsed);
      const provider = res.headers.get("x-thesun-provider") || "";
      setTestProvider(provider || "Unavailable");

      if (!res.ok) {
        const message = data?.error?.message ?? `Request failed with HTTP ${res.status}.`;
        setTestResult(message);
        toast(message, "error");
        return;
      }

      if (data.choices && data.choices[0]?.message?.content) {
        setTestResult(data.choices[0].message.content);
        toast(`Completed via ${provider.toUpperCase()} in ${elapsed}ms!`, "success");
      } else {
        setTestResult("Received response: " + JSON.stringify(data));
      }
    } catch (err: any) {
      toast("Test request failed: " + err.message, "error");
    } finally {
      setIsTesting(false);
    }
  };

  const codeSnippets = [
    {
      label: "cURL",
      language: "bash",
      code: `curl http://localhost:3000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer thesun-live-..." \\
  -d '{
    "model": "auto:best",
    "messages": [{"role": "user", "content": "Hello The SUN!"}]
  }'`,
    },
    {
      label: "Python (OpenAI)",
      language: "python",
      code: `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="thesun-live-..."
)

response = client.chat.completions.create(
    model="auto:best",  # or "groq/llama-3.3-70b-versatile"
    messages=[{"role": "user", "content": "Write a fast Fibonacci function"}]
)

print(response.choices[0].message.content)`,
    },
    {
      label: "Node.js (OpenAI SDK)",
      language: "typescript",
      code: `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "http://localhost:3000/v1",
  apiKey: "thesun-live-...",
});

const stream = await openai.chat.completions.create({
  model: "auto:fastest",
  messages: [{ role: "user", content: "Explain WebSockets" }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`,
    },
    {
      label: "Claude Code CLI",
      language: "bash",
      code: `# Use The SUN with Claude Code CLI
ANTHROPIC_BASE_URL="http://localhost:3000/v1" \\
ANTHROPIC_API_KEY="thesun-live-..." \\
claude`,
    },
    {
      label: "Cursor / IDE",
      language: "json",
      code: `// Cursor Settings -> Models -> OpenAI API Key
{
  "openai_api_base": "http://localhost:3000/v1",
  "openai_api_key": "thesun-live-...",
  "models": [
    "auto:best",
    "auto:coding",
    "groq/llama-3.3-70b-versatile",
    "cerebras/llama-3.3-70b"
  ]
}`,
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* The quiet grid reinforces the technical product without competing with the content. */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold-500/30 bg-gold-950/40 text-gold-300 text-xs font-mono shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-gold-400 animate-ping" />
            <span className="font-semibold text-foreground">Estimated 7.4B Tokens / Month</span>
            <span className="text-zinc-400">•</span>
            <span>{providerCount} Supported Providers</span>
            <span className="text-zinc-400">•</span>
            <span>{modelCount} Catalogued Models</span>
          </div>

          {/* Brand Wordmark */}
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 text-zinc-950 glow-solar">
              <Swords className="w-5 h-5" strokeWidth={2.25} />
            </span>
            <span className="text-sm font-mono font-semibold uppercase tracking-[0.3em] text-gradient-solar">
              The SUN — Token Emulator
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground max-w-5xl leading-[1.1]">
            One Endpoint for Every{" "}
            <span className="text-gradient">Supported LLM Providers</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-zinc-300 max-w-3xl leading-relaxed">
            Route supported upstream models through a single OpenAI-compatible{" "}
            <code className="text-gold-400 font-mono bg-gold-950/60 px-1.5 py-0.5 rounded border border-gold-800/60">
              /v1
            </code>{" "}
            endpoint. Manage provider keys from the authenticated dashboard and receive honest upstream errors.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/playground"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gold-500 hover:bg-gold-400 text-zinc-950 font-medium text-sm shadow-lg shadow-gold-500/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>Launch Playground</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/docs"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 font-medium text-sm transition-all hover:border-zinc-600 cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-gold-400" />
              <span>API Documentation</span>
            </Link>

            <Link
              href="/keys"
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 text-zinc-300 font-medium text-sm transition-all"
            >
              <Lock className="w-4 h-4 text-gold-400" />
              <span>Manage Keys</span>
            </Link>
          </div>

          {/* Unified Key Copy Box */}
          <div className="w-full max-w-xl mt-4 p-3 rounded-xl bg-secondary/90 border border-gold-500/30 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5 overflow-hidden w-full">
              <div className="p-1.5 rounded-md bg-gold-500/20 text-gold-400">
                <Lock className="w-4 h-4 shrink-0" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                  Your Unified Bearer Token
                </span>
                <code className="text-xs font-mono text-gold-300 truncate">
                  {sampleUnifiedKey || "Generate a unified key on the Keys page"}
                </code>
              </div>
            </div>
            <button
              onClick={handleCopyKey}
              disabled={!sampleUnifiedKey}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-gold-500/20 hover:bg-gold-500/30 border border-gold-500/40 text-gold-300 text-xs font-medium transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? "Copied" : "Copy Token"}</span>
            </button>
          </div>
        </div>

        {/* Live Code Integration & Interactive Tester */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Code integration snippets */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gold-400" />
                <span>Drop-in Replacement (1 Line Change)</span>
              </h3>
              <span className="text-xs text-zinc-400 font-mono">base_url = &quot;http://localhost:3000/v1&quot;</span>
            </div>
            <CodeBlock tabs={codeSnippets} code="" />
          </div>

          {/* Right: Live Interactive Quick Tester */}
          <div className="lg:col-span-5 rounded-xl border border-zinc-800 bg-card p-5 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-200">Live Endpoint Tester</h3>
              </div>
              <span className="text-xs font-mono text-gold-400 bg-gold-950/80 px-2 py-0.5 rounded border border-gold-800/40">
                auto:best
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                Test Prompt (routed through configured providers)
              </label>
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                rows={3}
                className="w-full text-xs font-mono bg-background border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-gold-500/70 resize-none transition-colors"
                placeholder="Ask anything..."
              />
            </div>

            <button
              onClick={handleRunQuickTest}
              disabled={isTesting || !sampleUnifiedKey}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-zinc-950 font-medium text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-gold-950"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Routing through providers...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{sampleUnifiedKey ? "Execute Live Test Request" : "Loading API key…"}</span>
                </>
              )}
            </button>

            {/* Test Output */}
            {testResult && (
              <div className="mt-2 space-y-2 border-t border-zinc-800/80 pt-3">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Fulfilled by:</span>
                    <strong className="text-gold-300 font-mono uppercase">{testProvider}</strong>
                  </span>
                  {testLatency && (
                    <span className="font-mono text-emerald-400">{testLatency}ms</span>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-background border border-zinc-800/90 text-xs font-mono text-zinc-300 max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {testResult}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="border-y border-zinc-800/80 bg-secondary/80 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-gold-400 font-mono">~7.4B</div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
              Free Tokens / Month
            </div>
            <div className="text-[11px] text-zinc-500">Estimated sum of listed monthly free tiers</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-foreground font-mono">{providerCount}</div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
              Catalogued Providers
            </div>
            <div className="text-[11px] text-zinc-500">Groq, Cerebras, Gemini, Mistral, etc.</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-gold-400 font-mono">{modelCount}</div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
              Provider Models
            </div>
            <div className="text-[11px] text-zinc-500">Model routes listed in the provider catalog</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">{peakListedSpeed.toLocaleString()}</div>
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
              Listed Peak Speed (tok/s)
            </div>
            <div className="text-[11px] text-zinc-500">Catalog metadata; actual speed varies by provider</div>
          </div>
        </div>
      </section>

      {/* Core Architectural Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <h2 className="text-xs uppercase tracking-widest text-gold-400 font-mono font-semibold">
            Engineered for Developers
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground">
            Why Route Supported Providers Through One API
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Each provider has a different API surface and quota. The SUN offers one compatible request format, server-side key management, and explicit upstream errors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-card hover:border-gold-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center border border-gold-500/20 group-hover:scale-110 transition-transform">
              <Workflow className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-foreground">Smart Routing (5 Strategies)</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Route requests based on live speed benchmarks, capability scores, round-robin distribution, or custom priority chains. Switch strategies on the fly or per request.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-card hover:border-gold-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center border border-gold-500/20 group-hover:scale-110 transition-transform">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-foreground">Automatic Failover & Cooldowns</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              For automatic routes, rate limits, provider authentication failures, network errors, and server errors try the next configured model. If every provider fails, the gateway returns the real error.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-card hover:border-gold-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center border border-gold-500/20 group-hover:scale-110 transition-transform">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-foreground">Server-Side Keys, One Token Out</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Provider keys remain server-side and admin APIs return only masked values. Client apps authenticate with one unified bearer token.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-card hover:border-gold-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center border border-gold-500/20 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-foreground">Request Usage Telemetry</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Records provider, token, latency, status, and fallback details for routed requests. Provider quota enforcement is not implemented yet.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-card hover:border-gold-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center border border-gold-500/20 group-hover:scale-110 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-foreground">OpenAI & Anthropic API Compatibility</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              OpenAI-compatible chat completions and Anthropic Messages (<code className="text-gold-300">/v1/messages</code>) share the same authenticated provider routing.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-xl border border-zinc-800 bg-card hover:border-gold-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-lg bg-gold-500/10 text-gold-400 flex items-center justify-center border border-gold-500/20 group-hover:scale-110 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-foreground">Tool-Calling Pass-Through</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Passes OpenAI-standard <code className="text-pink-300">tool_calls</code> to upstream providers that support tool calling.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Providers Showcase */}
      <section className="border-t border-zinc-800/80 bg-secondary/50 py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-xs uppercase tracking-widest text-gold-400 font-mono font-semibold">
                Provider Ecosystem
              </h2>
              <h3 className="text-3xl font-extrabold text-foreground mt-1">
                {providerCount} Supported Provider APIs
              </h3>
              <p className="text-sm text-zinc-400 mt-1 max-w-xl">
                Get free API keys in 60 seconds from each lab and plug them into The SUN.
              </p>
            </div>
            <Link
              href="/models"
              className="inline-flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 font-medium group"
            >
              <span>Explore all {modelCount} provider models</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PROVIDERS_INFO.slice(0, 10).map((provider) => (
              <div
                key={provider.id}
                className="p-4 rounded-xl border border-zinc-800 bg-card flex flex-col justify-between space-y-3 hover:border-zinc-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-sm">{provider.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                      Free Tier
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                    {provider.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Monthly Capacity:</span>
                  <span className="font-mono text-gold-400 font-medium">
                    {provider.freeMonthlyTokens}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="rounded-2xl border border-gold-500/30 bg-card/80 p-8 sm:p-12 text-center shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground max-w-2xl mx-auto">
            Ready to connect your provider keys?
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 max-w-xl mx-auto mt-4">
            Add a supported provider key, run a live connection test, then use the authenticated OpenAI-compatible API.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link
              href="/playground"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gold-500 hover:bg-gold-400 text-zinc-950 font-bold text-sm shadow-lg shadow-gold-500/20 transition-all hover:scale-105"
            >
              <Terminal className="w-4 h-4" />
              <span>Open AI Playground</span>
            </Link>
            <Link
              href="/docs"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-foreground font-medium text-sm transition-all"
            >
              <Code2 className="w-4 h-4 text-gold-400" />
              <span>Read API Documentation</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
