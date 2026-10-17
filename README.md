# FreeLLMAPI - Fullstack Rebuild & Clone

> **7.4 billion tokens per month. 34 free LLM providers. 635 free model endpoints.**  
> All behind one `/v1` endpoint, plus any custom OpenAI-compatible endpoint. Smart routing, automatic failover, encrypted keys.

An open-source, fullstack reproduction of **[tashfeenahmed/freellmapi](https://github.com/tashfeenahmed/freellmapi)** built with Next.js 16 (App Router), TypeScript, Tailwind CSS, PostgreSQL via Drizzle ORM, and shadcn/Lucide UI.

---

## 🚀 Key Highlights & Architecture

- **Single `/v1` Gateway**: Drop-in OpenAI API replacement. Point any OpenAI SDK (`base_url="http://localhost:3000/v1"`) with a single unified `freellmapi-...` bearer token.
- **34 Free Providers**: Aggregates Groq, Cerebras, Google Gemini, Mistral AI, OpenRouter, Cohere, Cloudflare Workers AI, Hugging Face, NVIDIA NIM, Zhipu GLM, and more.
- **635 Free Endpoints**: 584 chat, 41 embeddings, 7 transcription, and multimodal vision models.
- **Smart Routing (6 Strategies)**:
  - Strict Priority Chain (`groq -> cerebras -> gemini -> mistral...`)
  - Lowest Latency (Speed First with TTFT tracking)
  - Highest Reliability (Error rate & headroom tracking)
  - Round-Robin Load Balance
  - Maximum Capability Score
- **Automatic Failover & Cooldowns**: Catches 429 rate limits and 5xx upstream errors, initiates configurable cooldowns, and retries the next tier transparently with zero dropped requests.
- **AES-256 Key Encryption**: Provider keys are encrypted at rest in PostgreSQL and decrypted in-memory per request.
- **Anthropic Wire Emulation**: `/v1/messages` compatibility so **Claude Code CLI** (`npx freellmapi launch`) runs seamlessly against your free token pool.
- **Interactive AI Playground**: Real-time Server-Sent Events (SSE) streaming, model switching, system prompts, temperature sliders, TTFT tracking, and token throughput gauges.
- **Live Telemetry & Rate Caps**: Real-time RPM, RPD, and TPM headroom bars per provider key.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS (Dark-mode developer aesthetic)
- **Icons & UI**: Lucide Icons & Shadcn-style components
- **Streaming**: Server-Sent Events (SSE) with standard OpenAI `chat.completion.chunk` protocol

---

## 📦 Quick Start

### 1. Installation

```bash
git clone https://github.com/tashfeenahmed/freellmapi.git
cd freellmapi
npm install
```

### 2. Configure Environment

Create a `.env` file:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
PORT=3000
```

Start from `.env.example` and configure real provider API keys through your deployment environment or the Keys page.

### 3. Push Database Schema

```bash
npm run db:push
```

### 4. Start the Application

```bash
npm run build
npm start
# Or for development:
npm run dev
```

Visit `http://localhost:3000` to access the Landing Page, Playground (`/playground`), Catalog (`/models`), Routing Manager (`/routing`), Key Vault (`/keys`), Analytics (`/analytics`), and Docs (`/docs`).

---

## 🔌 API Usage Examples

### cURL

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $FREELLMAPI_API_KEY" \
  -d '{
    "model": "auto:best",
    "messages": [{"role": "user", "content": "Explain how smart routing works"}],
    "stream": true
  }'
```

### Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="<YOUR_UNIFIED_API_KEY>"
)

response = client.chat.completions.create(
    model="auto:best", # or "groq/llama-3.3-70b-versatile", "cerebras/llama-3.3-70b"
    messages=[{"role": "user", "content": "Write an optimized TypeScript function"}]
)

print(response.choices[0].message.content)
```

### Claude Code CLI

```bash
export ANTHROPIC_BASE_URL="http://localhost:3000/v1"
export ANTHROPIC_API_KEY="<YOUR_UNIFIED_API_KEY>"
claude
```

---

## 🗺️ Project Structure

```text
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Dark developer landing page & live tester
│   │   ├── playground/page.tsx         # Interactive streaming AI playground
│   │   ├── docs/page.tsx               # Interactive API docs & schemas
│   │   ├── models/page.tsx             # 635-model catalog browser
│   │   ├── routing/page.tsx            # Fallback chain & strategy manager
│   │   ├── keys/page.tsx               # Provider keys & encryption vault
│   │   ├── analytics/page.tsx          # Real-time requests & quota gauges
│   │   ├── layout.tsx                  # Root layout with Toast & Nav
│   │   ├── globals.css                 # Developer aesthetic & glows
│   │   ├── api/
│   │   │   ├── v1/chat/completions/    # OpenAI chat completions handler
│   │   │   ├── v1/models/              # OpenAI models listing
│   │   │   ├── v1/messages/            # Claude Code wire format
│   │   │   ├── keys/                   # Key management & unified token
│   │   │   ├── routing/                # Fallback chain configuration
│   │   │   ├── catalog/                # Full provider/model catalog
│   │   │   ├── analytics/              # Usage stats & telemetry
│   │   │   └── health/                 # Gateway healthcheck
│   │   └── v1/                         # Aliased root /v1 endpoints
│   ├── components/
│   │   ├── Navbar.tsx                  # Header with status & copy token
│   │   ├── Footer.tsx                  # Developer footer & links
│   │   ├── CodeBlock.tsx               # Tabbed syntax-highlighted code viewer
│   │   └── Toast.tsx                   # Toast notification system
│   ├── db/
│   │   ├── schema.ts                   # PostgreSQL schema definitions
│   │   └── index.ts                    # Drizzle ORM client
│   └── lib/
│       ├── models-data.ts              # Catalog of 34 providers & 635 models
│       ├── resolver.ts                 # Model resolution & auto-profiles
│       ├── router-engine.ts            # Server-side request logging & analytics
│       └── provider-dispatch.ts        # Smart AI execution & provider failover
```

---

## 📄 License

MIT License. Personal experimentation and developer workflows.
Original concept by [Tashfeen Ahmed](https://github.com/tashfeenahmed/freellmapi).
