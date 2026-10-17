"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Terminal,
  Code2,
  Copy,
  Check,
  Cpu,
  Layers,
  Shield,
  Zap,
  ExternalLink,
  ChevronRight,
  Server,
  Key,
} from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { useToast } from "@/components/Toast";
import { PROVIDERS_INFO } from "@/lib/models-data";

export default function DocsPage() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState("chat-completions");

  const curlChatExample = `curl -X POST http://localhost:3000/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer thesun-live-..." \\
  -d '{
    "model": "auto:best",
    "messages": [
      {"role": "system", "content": "You are a concise engineering assistant."},
      {"role": "user", "content": "Write a TypeScript function to debounce an API call."}
    ],
    "temperature": 0.7,
    "max_tokens": 1024,
    "stream": false
  }'`;

  const pythonChatExample = `from openai import OpenAI

# Initialize standard OpenAI client pointing to The SUN
client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="thesun-live-..."
)

# Call any enrolled free model or auto profile
response = client.chat.completions.create(
    model="auto:best",  # or "groq/llama-3.3-70b-versatile", "cerebras/llama-3.3-70b"
    messages=[
        {"role": "system", "content": "You are a senior systems architect."},
        {"role": "user", "content": "Compare raft consensus with paxos in 3 sentences."}
    ],
    temperature=0.7,
    max_tokens=500
)

print(response.choices[0].message.content)
print(f"Total tokens: {response.usage.total_tokens}")`;

  const nodeChatExample = `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "http://localhost:3000/v1",
  apiKey: "thesun-live-...",
});

async function run() {
  const stream = await openai.chat.completions.create({
    model: "auto:fastest",
    messages: [{ role: "user", content: "Tell me 3 interesting facts about neutron stars." }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

run();`;

  const claudeCodeExample = `# Configure Claude Code CLI to route through your free pool
export ANTHROPIC_BASE_URL="http://localhost:3000/v1"
export ANTHROPIC_API_KEY="thesun-live-..."

# Run claude directly
claude`;

  const langchainExample = `from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="http://localhost:3000/v1",
    api_key="thesun-live-...",
    model="auto:best",
    temperature=0.7
)

response = llm.invoke("What are the key benefits of multi-model fallback chains?")
print(response.content)`;

  const requestSchema = [
    {
      param: "model",
      type: "string",
      required: "Optional",
      default: '"auto:best"',
      description: 'Model identifier or auto profile (e.g. "auto:best", "auto:fastest", "auto:coding", "groq/llama-3.3-70b-versatile", "cerebras/llama-3.3-70b", "gemini/gemini-2.5-flash").',
    },
    {
      param: "messages",
      type: "array",
      required: "Required",
      default: "None",
      description: "Array of message objects with role ('system' | 'user' | 'assistant' | 'tool') and content.",
    },
    {
      param: "stream",
      type: "boolean",
      required: "Optional",
      default: "false",
      description: "If set to true, returns real-time Server-Sent Events (SSE) stream terminated by data: [DONE].",
    },
    {
      param: "temperature",
      type: "number",
      required: "Optional",
      default: "0.7",
      description: "Sampling temperature between 0.0 and 2.0. Higher values yield more varied outputs.",
    },
    {
      param: "max_tokens",
      type: "integer",
      required: "Optional",
      default: "2048",
      description: "The maximum number of tokens to generate in the chat completion.",
    },
    {
      param: "top_p",
      type: "number",
      required: "Optional",
      default: "1.0",
      description: "Nucleus sampling probability mass threshold.",
    },
    {
      param: "tools",
      type: "array",
      required: "Optional",
      default: "undefined",
      description: "OpenAI-standard list of function definitions that the model may choose to call.",
    },
  ];

  const responseSchema = [
    {
      field: "id",
      type: "string",
      description: 'Unique completion identifier, e.g. "chatcmpl-a1b2c3d4e5".',
    },
    {
      field: "object",
      type: "string",
      description: 'Always "chat.completion" or "chat.completion.chunk" in streaming mode.',
    },
    {
      field: "created",
      type: "integer",
      description: "Unix epoch timestamp in seconds.",
    },
    {
      field: "model",
      type: "string",
      description: "The actual model endpoint that fulfilled the completion.",
    },
    {
      field: "choices",
      type: "array",
      description: "Array of completion choices containing message content and finish_reason.",
    },
    {
      field: "usage",
      type: "object",
      description: "Token counts containing prompt_tokens, completion_tokens, and total_tokens.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xs uppercase tracking-wider font-mono text-gold-400 font-semibold">
              Documentation
            </h3>
            <p className="text-xs text-zinc-400">OpenAI Compatible Gateway</p>
          </div>

          <nav className="space-y-1">
            {[
              { id: "overview", label: "Overview & Base URL" },
              { id: "authentication", label: "Authentication" },
              { id: "chat-completions", label: "POST /v1/chat/completions" },
              { id: "models-endpoint", label: "GET /v1/models" },
              { id: "claude-messages", label: "POST /v1/messages (Claude)" },
              { id: "smart-routing", label: "Smart Routing & Fallbacks" },
              { id: "agent-integrations", label: "Agent Integrations (Cursor, Zed)" },
              { id: "provider-keys", label: "Getting Free API Keys" },
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSection(sec.id);
                  const el = document.getElementById(sec.id);
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className={`w-full text-left px-3 py-2 text-xs rounded-md font-medium transition-colors cursor-pointer flex items-center justify-between ${
                  activeSection === sec.id
                    ? "bg-gold-500/10 text-gold-400 border border-gold-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                }`}
              >
                <span>{sec.label}</span>
                {activeSection === sec.id && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ))}
          </nav>

          <div className="p-3 rounded-lg bg-card border border-zinc-800 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Gateway Status: Normal</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Target base URL: <br />
              <code className="text-gold-300 font-mono">http://localhost:3000/v1</code>
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-16">
          {/* Section: Overview */}
          <section id="overview" className="space-y-4">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold text-foreground">Overview & Quickstart</h2>
              <p className="text-sm text-zinc-400 mt-1">
                The SUN is a single, zero-friction gateway that collapses 34 free LLM provider tiers (7.4 billion free tokens/month) behind an OpenAI-standard wire format.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-zinc-800 bg-card">
                <div className="text-xs text-zinc-400">Base URL</div>
                <div className="font-mono text-gold-300 text-xs mt-1 font-semibold">
                  http://localhost:3000/v1
                </div>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800 bg-card">
                <div className="text-xs text-zinc-400">Format Standard</div>
                <div className="font-mono text-emerald-300 text-xs mt-1 font-semibold">
                  OpenAI Wire Specification
                </div>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800 bg-card">
                <div className="text-xs text-zinc-400">Available Endpoints</div>
                <div className="font-mono text-gold-300 text-xs mt-1 font-semibold">
                  635 Free Endpoints
                </div>
              </div>
            </div>
          </section>

          {/* Section: Authentication */}
          <section id="authentication" className="space-y-4">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Key className="w-5 h-5 text-gold-400" />
                <span>Authentication</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Pass your unified The SUN token in the standard HTTP <code className="text-gold-300">Authorization</code> header.
              </p>
            </div>

            <CodeBlock
              language="bash"
              filename="Authorization Header"
              code={`Authorization: Bearer thesun-live-...`}
            />

            <p className="text-xs text-zinc-400">
              Provider keys are managed through the authenticated admin dashboard and are never returned in plaintext by its APIs. The database provider controls encryption at rest; this application does not add a separate encryption layer.
            </p>
          </section>

          {/* Section: Chat Completions */}
          <section id="chat-completions" className="space-y-6">
            <div className="border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-xs font-bold">
                  POST
                </span>
                <code className="text-lg font-bold text-foreground font-mono">/v1/chat/completions</code>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Creates a model response for the given chat conversation. Supports real-time streaming, function tools, and fallback chains.
              </p>
            </div>

            {/* Code Tabs */}
            <CodeBlock
              tabs={[
                { label: "cURL", language: "bash", code: curlChatExample },
                { label: "Python (OpenAI)", language: "python", code: pythonChatExample },
                { label: "Node.js (OpenAI)", language: "typescript", code: nodeChatExample },
                { label: "LangChain", language: "python", code: langchainExample },
              ]}
              code=""
            />

            {/* Request Schema Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Request Body Parameters</h3>
              <div className="rounded-xl border border-zinc-800 overflow-x-auto bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Parameter</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Default</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                    {requestSchema.map((item) => (
                      <tr key={item.param} className="hover:bg-zinc-800/20">
                        <td className="p-3 font-mono text-gold-300 font-semibold">{item.param}</td>
                        <td className="p-3 font-mono text-gold-300">{item.type}</td>
                        <td className="p-3 font-medium">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              item.required === "Required"
                                ? "bg-rose-950/80 text-rose-300 border border-rose-800/50"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {item.required}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-zinc-400">{item.default}</td>
                        <td className="p-3 text-zinc-400">{item.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Response Schema Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Response JSON Schema</h3>
              <div className="rounded-xl border border-zinc-800 overflow-x-auto bg-card">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary border-b border-zinc-800 text-zinc-400 uppercase tracking-wider font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Field</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 text-zinc-300">
                    {responseSchema.map((item) => (
                      <tr key={item.field} className="hover:bg-zinc-800/20">
                        <td className="p-3 font-mono text-gold-300 font-semibold">{item.field}</td>
                        <td className="p-3 font-mono text-gold-300">{item.type}</td>
                        <td className="p-3 text-zinc-400">{item.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Section: GET /v1/models */}
          <section id="models-endpoint" className="space-y-4">
            <div className="border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-gold-950 text-gold-400 border border-gold-800 font-mono text-xs font-bold">
                  GET
                </span>
                <code className="text-lg font-bold text-foreground font-mono">/v1/models</code>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Lists all 635 free endpoints, auto profiles, token speed ratings, and free quota metadata.
              </p>
            </div>

            <CodeBlock
              language="bash"
              filename="cURL"
              code={`curl http://localhost:3000/v1/models \\
  -H "Authorization: Bearer thesun-live-..."`}
            />
          </section>

          {/* Section: Claude Messages */}
          <section id="claude-messages" className="space-y-4">
            <div className="border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-gold-950 text-gold-400 border border-gold-800 font-mono text-xs font-bold">
                  POST
                </span>
                <code className="text-lg font-bold text-foreground font-mono">/v1/messages</code>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Anthropic wire format compatibility for running <strong>Claude Code CLI</strong> directly against your free pool.
              </p>
            </div>

            <CodeBlock language="bash" filename="Claude Code CLI Terminal Setup" code={claudeCodeExample} />
          </section>

          {/* Section: Agent Integrations */}
          <section id="agent-integrations" className="space-y-4">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold text-foreground">Agent & IDE Configuration</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Configure your favorite AI editors to use The SUN as a backend.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cursor */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-card space-y-2">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Cursor IDE</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  Go to <em>Cursor Settings &gt; Models</em>. Override OpenAI Base URL:
                </p>
                <div className="p-2.5 rounded bg-background border border-zinc-800/80 font-mono text-xs text-gold-300">
                  http://localhost:3000/v1
                </div>
              </div>

              {/* Continue.dev */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-card space-y-2">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Continue.dev</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  In <code className="text-zinc-300">config.json</code>, set provider to <code className="text-zinc-300">openai</code> with custom apiBase:
                </p>
                <div className="p-2.5 rounded bg-background border border-zinc-800/80 font-mono text-xs text-gold-300">
                  &quot;apiBase&quot;: &quot;http://localhost:3000/v1&quot;
                </div>
              </div>
            </div>
          </section>

          {/* Section: Provider Keys Guide */}
          <section id="provider-keys" className="space-y-4">
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-xl font-bold text-foreground">Getting Free API Keys (60 Seconds Each)</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Every listed AI provider provides a generous permanent free tier with no credit card required.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PROVIDERS_INFO.map((prov) => (
                <div
                  key={prov.id}
                  className="p-4 rounded-xl border border-zinc-800 bg-card flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{prov.name}</span>
                      <a
                        href={prov.signupUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] text-gold-400 hover:text-gold-300 font-medium"
                      >
                        <span>Get Free Key</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{prov.description}</p>
                  </div>
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">Key Prefix: {prov.keyPrefix}</span>
                    <span className="text-emerald-400">{prov.freeMonthlyTokens} tok/mo</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
