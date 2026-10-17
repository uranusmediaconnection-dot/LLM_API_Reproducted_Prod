"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
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
import { PROVIDERS_INFO } from "@/lib/models-data";

export default function LandingPage() {
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState(false);
  const [testPrompt, setTestPrompt] = useState("Explain how smart routing with automatic failover works in 3 bullet points");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testProvider, setTestProvider] = useState<string | null>(null);
  const [testLatency, setTestLatency] = useState<number | null>(null);

  const sampleUnifiedKey = "freellmapi-live-sec_9a8f2e1b4c7d03a5";

  const handleCopyKey = async () => {
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
      const provider = res.headers.get("x-freellmapi-provider") || "groq";
      setTestProvider(provider);

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
  -H "Authorization: Bearer freellmapi-live-..." \\
  -d '{
    "model": "auto:best",
    "messages": [{"role": "user", "content": "Hello FreeLLMAPI!"}]
  }'`,
    },
    {
      label: "Python (OpenAI)",
      language: "python",
      code: `from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="freellmapi-live-..."
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
  apiKey: "freellmapi-live-...",
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
      code: `# Use FreeLLMAPI with Claude Code CLI
ANTHROPIC_BASE_URL="http://localhost:3000/v1" \\
ANTHROPIC_API_KEY="freellmapi-live-..." \\
claude`,
    },
    {
      label: "Cursor / IDE",
      language: "json",
      code: `// Cursor Settings -> Models -> OpenAI API Key
{
  "openai_api_base": "http://localhost:3000/v1",
  "openai_api_key": "freellmapi-live-...",
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
      {/* Background Glows & Grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-gradient-to-b from-cyan-600/15 via-blue-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 right-10 w-[500px] h-[350px] bg-purple-600/10 blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-mono shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-semibold text-white">7.4 Billion Tokens / Month</span>
            <span className="text-slate-400">•</span>
            <span>34 Free Providers</span>
            <span className="text-slate-400">•</span>
            <span>635 Endpoints</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.1]">
            One Endpoint for Every{" "}
            <span className="text-gradient">Free LLM Provider</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed">
            Aggregate free tiers from 34 providers behind a single OpenAI-compatible{" "}
            <code className="text-cyan-400 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60">
              /v1
            </code>{" "}
            endpoint. Smart routing, instant failover on 429s, encrypted keys, and zero rate-limit anxiety.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/playground"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>Launch Playground</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/docs"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-medium text-sm transition-all hover:border-slate-600 cursor-pointer"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>API Documentation</span>
            </Link>

            <Link
              href="/keys"
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-300 font-medium text-sm transition-all"
            >
              <Lock className="w-4 h-4 text-purple-400" />
              <span>Manage Keys</span>
            </Link>
          </div>

          {/* Unified Key Copy Box */}
          <div className="w-full max-w-xl mt-4 p-3 rounded-xl bg-[#0b101d]/90 border border-cyan-500/30 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5 overflow-hidden w-full">
              <div className="p-1.5 rounded-md bg-cyan-500/20 text-cyan-400">
                <Lock className="w-4 h-4 shrink-0" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Your Local Unified Bearer Token
                </span>
                <code className="text-xs font-mono text-cyan-300 truncate">
                  {sampleUnifiedKey}
                </code>
              </div>
            </div>
            <button
              onClick={handleCopyKey}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-medium transition-colors shrink-0 cursor-pointer"
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
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Drop-in Replacement (1 Line Change)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">base_url = &quot;http://localhost:3000/v1&quot;</span>
            </div>
            <CodeBlock tabs={codeSnippets} code="" />
          </div>

          {/* Right: Live Interactive Quick Tester */}
          <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0b0f19] p-5 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-200">Live Endpoint Tester</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                auto:best
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1.5">
                Test Prompt (routed across 34 providers)
              </label>
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                rows={3}
                className="w-full text-xs font-mono bg-[#07090e] border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500/70 resize-none transition-colors"
                placeholder="Ask anything..."
              />
            </div>

            <button
              onClick={handleRunQuickTest}
              disabled={isTesting}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-950"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Routing through providers...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Test Request</span>
                </>
              )}
            </button>

            {/* Test Output */}
            {testResult && (
              <div className="mt-2 space-y-2 border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Fulfilled by:</span>
                    <strong className="text-cyan-300 font-mono uppercase">{testProvider}</strong>
                  </span>
                  {testLatency && (
                    <span className="font-mono text-emerald-400">{testLatency}ms</span>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-[#07090e] border border-slate-800/90 text-xs font-mono text-slate-300 max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {testResult}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="border-y border-slate-800/80 bg-[#080c14]/80 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400 font-mono">7.4B+</div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Free Tokens / Month
            </div>
            <div className="text-[11px] text-slate-500">Stacked across all enrolled free tiers</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">34</div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Free AI Providers
            </div>
            <div className="text-[11px] text-slate-500">Groq, Cerebras, Gemini, Mistral, etc.</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-purple-400 font-mono">635</div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Model Endpoints
            </div>
            <div className="text-[11px] text-slate-500">584 chat, 41 embeddings, 7 transcription</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">2,100</div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Tokens / Sec Peak
            </div>
            <div className="text-[11px] text-slate-500">Via Cerebras CS-3 Wafer-Scale Engine</div>
          </div>
        </div>
      </section>

      {/* Core Architectural Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-semibold">
            Engineered for Developers
          </h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            Why FreeLLMAPI Collapses Thirty-Four APIs Into One
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Stacking free tiers manually requires 34 SDKs, 34 rate limit counters, and 34 places for your app to fail.
            FreeLLMAPI replaces that nightmare with an intelligent, self-healing gateway.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0b0f19] hover:border-cyan-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Workflow className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Smart Routing (6 Strategies)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Route requests based on live speed benchmarks, capability scores, round-robin distribution, or custom priority chains. Switch strategies on the fly or per request.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0b0f19] hover:border-emerald-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Automatic Failover & Cooldowns</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              When an upstream provider hits a 429 rate limit or 5xx outage, the router cools that provider down and retries the next model in your chain seamlessly with zero dropped calls.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0b0f19] hover:border-purple-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Encrypted Keys, One Token Out</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provider API keys are encrypted at rest with AES-256-GCM. Your code and client apps only ever target a single unified <code className="text-cyan-300">freellmapi-...</code> token.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0b0f19] hover:border-blue-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Per-Key Rate Limit Tracking</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tracks real-time RPM, RPD, TPM, and TPD quotas per provider key. The router proactively routes away from keys nearing their ceiling so you never hit a rate limit block.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0b0f19] hover:border-amber-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Anthropic & Ollama Wire Format</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Native support for Anthropic Messages (<code className="text-amber-300">/v1/messages</code>) so Claude Code CLI runs directly against your free pool. Emulates Ollama for local agents.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0b0f19] hover:border-pink-500/40 transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20 group-hover:scale-110 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Tool-Call Rescue & Formats</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rescues unstructured plain-text tool emissions into valid OpenAI-standard JSON <code className="text-pink-300">tool_calls</code> objects automatically across disparate providers.
            </p>
          </div>
        </div>
      </section>

      {/* Supported Providers Showcase */}
      <section className="border-t border-slate-800/80 bg-[#080c14]/50 py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-semibold">
                Provider Ecosystem
              </h2>
              <h3 className="text-3xl font-extrabold text-white mt-1">
                34 Supported Free Tier Providers
              </h3>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Get free API keys in 60 seconds from each lab and plug them into FreeLLMAPI.
              </p>
            </div>
            <Link
              href="/models"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium group"
            >
              <span>Explore all 635 models</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PROVIDERS_INFO.slice(0, 10).map((provider) => (
              <div
                key={provider.id}
                className="p-4 rounded-xl border border-slate-800 bg-[#0b0f19] flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{provider.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                      Free Tier
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {provider.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Monthly Capacity:</span>
                  <span className="font-mono text-cyan-400 font-medium">
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
        <div className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-[#0b1220] to-[#07090e] p-8 sm:p-12 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white max-w-2xl mx-auto">
            Ready to Unlock 7.4 Billion Free Tokens?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mt-4">
            Test models live in the AI playground, browse the 635-model catalog, or point your OpenAI SDK directly at your local port.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link
              href="/playground"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
            >
              <Terminal className="w-4 h-4" />
              <span>Open AI Playground</span>
            </Link>
            <Link
              href="/docs"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-medium text-sm transition-all"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Read API Documentation</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
