"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Terminal,
  Cpu,
  Sliders,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Download,
  AlertCircle,
  Zap,
  Info,
  ChevronDown,
  Layers,
  StopCircle,
  ArrowRight,
  Code2,
} from "lucide-react";
import { ALL_MODELS, AUTO_PROFILES, ModelDefinition } from "@/lib/models-data";
import { useToast } from "@/components/Toast";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
  tokensCount?: number;
  tokensPerSec?: number;
  ttftMs?: number;
  isStreaming?: boolean;
}

export default function PlaygroundPage() {
  const { toast } = useToast();

  // Model & Router State
  const [selectedModel, setSelectedModel] = useState<string>("auto:best");
  const [strategy, setStrategy] = useState<string>("priority");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [topP, setTopP] = useState<number>(1.0);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [systemPrompt, setSystemPrompt] = useState<string>(
    "You are a helpful, expert AI assistant running via FreeLLMAPI smart router. Be concise, accurate, and format code clearly with syntax tags."
  );
  const [showSettingsMobile, setShowSettingsMobile] = useState<boolean>(false);

  // Chat State
  const [inputMessage, setInputMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Welcome to the **FreeLLMAPI Interactive Playground**! 🚀\n\nI am currently routed through your unified `/v1` gateway. You can test any model across 34 free providers, toggle between streaming or non-streaming, test system prompts, or inspect fallback chains in real time.\n\nTry asking me a coding question, a math problem, or click one of the quick prompts below!",
      provider: "freellmapi",
      model: "auto:best",
      latencyMs: 120,
      tokensCount: 78,
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const activeModelDef = ALL_MODELS.find((m) => m.id === selectedModel) || ALL_MODELS[0];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage("");

    // Create user message
    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
    };

    // Prepare assistant placeholder message
    const assistantMsgId = `asst-${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      provider: activeModelDef.provider,
      model: selectedModel,
      isStreaming: isStreaming,
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const startTime = Date.now();
    let ttft: number | null = null;

    try {
      // Build conversation payload with system prompt
      const conversationPayload = [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        ...messages
          .filter((m) => m.id !== "welcome-1")
          .map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: text },
      ];

      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer freellmapi-playground-session",
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: conversationPayload,
          stream: isStreaming,
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
        }),
        signal: controller.signal,
      });

      const providerHeader = res.headers.get("x-freellmapi-provider") || activeModelDef.provider;
      const modelHeader = res.headers.get("x-freellmapi-model") || selectedModel;

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Server responded with ${res.status}`);
      }

      // Handle Streaming
      if (isStreaming && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const dataStr = trimmed.replace(/^data:\s*/, "");
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              const deltaContent = parsed.choices?.[0]?.delta?.content || "";
              if (deltaContent) {
                if (ttft === null) {
                  ttft = Date.now() - startTime;
                }
                accumulatedContent += deltaContent;

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: accumulatedContent,
                          provider: providerHeader,
                          model: modelHeader,
                          ttftMs: ttft ?? undefined,
                        }
                      : m
                  )
                );
              }
            } catch {
              // Ignore non-json lines
            }
          }
        }

        const totalElapsed = Date.now() - startTime;
        const estimatedTokens = Math.max(1, Math.ceil(accumulatedContent.length / 4));
        const tokPerSec = Math.round((estimatedTokens / (totalElapsed / 1000)) * 10) / 10;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  latencyMs: totalElapsed,
                  tokensCount: estimatedTokens,
                  tokensPerSec: tokPerSec,
                }
              : m
          )
        );
      } else {
        // Non-streaming response
        const data = await res.json();
        const totalElapsed = Date.now() - startTime;
        const content = data.choices?.[0]?.message?.content || "";
        const tokensCount = data.usage?.completion_tokens || Math.ceil(content.length / 4);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content,
                  isStreaming: false,
                  provider: providerHeader,
                  model: modelHeader,
                  latencyMs: totalElapsed,
                  tokensCount,
                  ttftMs: totalElapsed,
                  tokensPerSec: Math.round((tokensCount / (totalElapsed / 1000)) * 10) / 10,
                }
              : m
          )
        );
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: m.content + "\n\n*(Generation stopped by user)*", isStreaming: false }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `⚠️ **Error encountered**: ${err.message}`,
                  isStreaming: false,
                }
              : m
          )
        );
        toast(`Error: ${err.message}`, "error");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      toast("Generation stopped", "info");
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "cleared-1",
        role: "assistant",
        content: "Chat history cleared. Select a model or auto profile to begin testing!",
        provider: "freellmapi",
        model: selectedModel,
      },
    ]);
    toast("Chat history cleared", "info");
  };

  const handleExportChat = (format: "markdown" | "json") => {
    if (format === "markdown") {
      const mdContent = messages
        .map((m) => `### ${m.role.toUpperCase()} (${m.model || "Unknown"})\n\n${m.content}\n\n---`)
        .join("\n\n");
      const blob = new Blob([mdContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `freellmapi-chat-${Date.now()}.md`;
      a.click();
    } else {
      const jsonContent = JSON.stringify(messages, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `freellmapi-chat-${Date.now()}.json`;
      a.click();
    }
    toast(`Exported chat as ${format.toUpperCase()}`, "success");
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast("Message copied to clipboard", "success");
    } catch {
      toast("Failed to copy", "error");
    }
  };

  const quickPrompts = [
    {
      title: "Fast Fib Function",
      prompt: "Write an ultra-optimized TypeScript Fibonacci function using memoization and matrix exponentiation.",
    },
    {
      title: "Quantum Entanglement",
      prompt: "Explain quantum entanglement in 3 simple paragraphs with an intuitive analogy.",
    },
    {
      title: "API Gateway Design",
      prompt: "Design a high-throughput LLM proxy with fallback chains, key rotation, and cooldowns in Node.js.",
    },
    {
      title: "JSON Data Extractor",
      prompt: "Generate a valid JSON object describing a server cluster with 3 nodes, CPU stats, and health status.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-4.5rem)] flex flex-col">
      {/* Top Header / Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <span>AI Interactive Playground</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                Live Gateway
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Direct live inference testbed with real-time token streaming and provider telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportChat("markdown")}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition-colors cursor-pointer"
            title="Export chat as Markdown"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export</span>
          </button>
          <button
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-rose-300 transition-colors cursor-pointer"
            title="Clear Chat"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Clear</span>
          </button>
          <button
            onClick={() => setShowSettingsMobile(!showSettingsMobile)}
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-cyan-950/60 border border-cyan-800/40 text-xs text-cyan-400"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Parameters</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 overflow-hidden">
        {/* Left Column: Chat Area */}
        <div className="lg:col-span-8 flex flex-col h-full bg-[#0b0f19] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          {/* Quick Model Header on Mobile/Top */}
          <div className="px-4 py-2.5 bg-[#080c14] border-b border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Active Model:</span>
              <span className="font-mono text-cyan-300 font-semibold">{selectedModel}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 capitalize">{activeModelDef.provider}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{isStreaming ? "Streaming Mode" : "Standard Mode"}</span>
              </div>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-xl p-4 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950"
                      : "bg-[#0f1422] border border-slate-800/90 text-slate-200 shadow-lg"
                  }`}
                >
                  {/* Assistant Header info */}
                  {msg.role === "assistant" && (
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5 text-[11px] text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold uppercase text-cyan-400 px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800/50">
                          {msg.provider || "FreeLLMAPI"}
                        </span>
                        <span className="font-mono text-slate-300 truncate max-w-[150px]">
                          {msg.model || selectedModel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        {msg.latencyMs && (
                          <span className="text-emerald-400">{msg.latencyMs}ms</span>
                        )}
                        {msg.tokensPerSec && (
                          <span className="text-purple-300 hidden sm:inline">
                            ~{msg.tokensPerSec} tok/s
                          </span>
                        )}
                        <button
                          onClick={() => handleCopyMessage(msg.content)}
                          className="hover:text-white p-1 rounded hover:bg-slate-800/60 transition-colors"
                          title="Copy message"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Body with clean pre formatting */}
                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm select-text">
                    {msg.content}
                    {msg.isStreaming && (
                      <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompts Suggestion Pills */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 border-t border-slate-800/60 bg-[#080c14]/40 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[11px] text-slate-500 shrink-0 font-medium">Suggestions:</span>
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] whitespace-nowrap transition-colors cursor-pointer"
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-3 bg-[#080c14] border-t border-slate-800">
            <div className="flex items-end gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
                placeholder="Ask or prompt the routed model... (Press Enter to send, Shift+Enter for newline)"
                className="flex-1 bg-[#0f1422] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/70 resize-none transition-colors"
              />

              {isLoading ? (
                <button
                  onClick={handleStop}
                  className="flex items-center justify-center p-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 transition-colors cursor-pointer"
                  title="Stop generation"
                >
                  <StopCircle className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim()}
                  className="flex items-center justify-center p-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-cyan-950"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Model Selection & Parameter Controls */}
        <div
          className={`lg:col-span-4 flex flex-col h-full bg-[#0b0f19] rounded-xl border border-slate-800 p-4 space-y-5 overflow-y-auto ${
            showSettingsMobile ? "fixed inset-4 z-50 bg-[#0b0f19] shadow-2xl" : "hidden lg:flex"
          }`}
        >
          {showSettingsMobile && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 lg:hidden">
              <h3 className="font-bold text-sm text-white">Parameters & Model</h3>
              <button
                onClick={() => setShowSettingsMobile(false)}
                className="text-xs text-cyan-400 font-semibold"
              >
                Done
              </button>
            </div>
          )}

          {/* Model Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Target Model / Profile</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {ALL_MODELS.length} available
              </span>
            </label>

            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                toast(`Switched model to ${e.target.value}`, "info");
              }}
              className="w-full text-xs font-mono bg-[#07090e] border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <optgroup label="⚡ Auto Routing Profiles">
                {AUTO_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="🏢 Groq LPUs">
                <option value="groq/llama-3.3-70b-versatile">Groq: Llama 3.3 70B Versatile</option>
                <option value="groq/llama-3.1-8b-instant">Groq: Llama 3.1 8B Instant</option>
                <option value="groq/deepseek-r1-distill-llama-70b">Groq: DeepSeek R1 Distill 70B</option>
                <option value="groq/mixtral-8x7b-32768">Groq: Mixtral 8x7B</option>
              </optgroup>
              <optgroup label="⚡ Cerebras (2,100+ tok/s)">
                <option value="cerebras/llama-3.3-70b">Cerebras: Llama 3.3 70B</option>
                <option value="cerebras/llama-3.1-8b">Cerebras: Llama 3.1 8B Instant</option>
              </optgroup>
              <optgroup label="🧠 Google AI Studio">
                <option value="gemini/gemini-2.5-flash">Gemini: 2.5 Flash (1M Context)</option>
                <option value="gemini/gemini-1.5-pro">Gemini: 1.5 Pro (2M Context)</option>
              </optgroup>
              <optgroup label="🇫🇷 Mistral AI">
                <option value="mistral/mistral-small-latest">Mistral: Small Latest</option>
                <option value="mistral/codestral-latest">Mistral: Codestral 22B</option>
                <option value="mistral/pixtral-12b">Mistral: Pixtral 12B Vision</option>
              </optgroup>
              <optgroup label="🌐 OpenRouter Free">
                <option value="openrouter/deepseek/deepseek-r1:free">OpenRouter: DeepSeek R1 (Free)</option>
                <option value="openrouter/qwen/qwen-2.5-coder-32b-instruct:free">OpenRouter: Qwen 2.5 Coder 32B</option>
                <option value="openrouter/meta-llama/llama-3.3-70b-instruct:free">OpenRouter: Llama 3.3 70B</option>
              </optgroup>
              <optgroup label="🏛️ Cohere & NVIDIA">
                <option value="cohere/command-r-plus">Cohere: Command R+</option>
                <option value="nvidia/meta/llama-3.1-70b-instruct">NVIDIA NIM: Llama 3.1 70B</option>
              </optgroup>
            </select>

            {/* Active Model Meta Badge */}
            <div className="p-2.5 rounded-lg bg-[#07090e] border border-slate-800 text-[11px] space-y-1">
              <div className="text-slate-300 font-medium">{activeModelDef.name}</div>
              <div className="text-slate-400 leading-tight text-[10px]">
                {activeModelDef.description}
              </div>
              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Speed: ~{activeModelDef.tokensPerSecond} tps</span>
                <span>Context: {Math.round(activeModelDef.contextWindow / 1000)}k</span>
                <span className="text-emerald-400">100% Free Tier</span>
              </div>
            </div>
          </div>

          {/* Routing Strategy */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Smart Routing Strategy</span>
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full text-xs bg-[#07090e] border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
            >
              <option value="priority">Priority Chain (Groq → Cerebras → Gemini)</option>
              <option value="latency">Lowest Latency (Fastest TTFT)</option>
              <option value="reliability">Highest Reliability (Lowest 24h Error)</option>
              <option value="round_robin">Round-Robin (Balance Free Quotas)</option>
            </select>
          </div>

          {/* System Prompt Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>System Prompt</span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={3}
              className="w-full text-xs font-mono bg-[#07090e] border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-cyan-500/60 resize-none transition-colors"
              placeholder="Custom instructions for the model..."
            />
          </div>

          {/* Sampling Parameters */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            {/* Temperature */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Temperature</span>
                <span className="font-mono text-cyan-400">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.0 (Deterministic)</span>
                <span>1.5 (Creative)</span>
              </div>
            </div>

            {/* Max Output Tokens */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Max Tokens</span>
                <span className="font-mono text-cyan-400">{maxTokens}</span>
              </div>
              <input
                type="range"
                min="128"
                max="8192"
                step="128"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Stream Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#07090e] border border-slate-800">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-300">Server-Sent Events (SSE)</span>
                <span className="text-[10px] text-slate-500">Real-time word by word stream</span>
              </div>
              <input
                type="checkbox"
                checked={isStreaming}
                onChange={(e) => setIsStreaming(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
