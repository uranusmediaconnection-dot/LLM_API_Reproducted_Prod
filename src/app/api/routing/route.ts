import { NextRequest } from "next/server";
import { db } from "@/db";
import { routingConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { adminUnauthorizedResponse, isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const DEFAULT_CHAIN = ["groq", "cerebras", "gemini", "mistral", "openrouter", "cohere", "cloudflare", "huggingface", "nvidia", "zhipu"];

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminUnauthorizedResponse();

  try {
    let configs = await db.select().from(routingConfig).limit(1);

    if (configs.length === 0) {
      const [inserted] = await db
        .insert(routingConfig)
        .values({
          strategy: "priority",
          fallbackChain: DEFAULT_CHAIN,
          cooldownSeconds: 60,
          maxRetries: 3,
          stickySessions: true,
          sessionTimeoutMinutes: 30,
          activeProfile: "auto:default",
        })
        .returning();
      configs = [inserted];
    }

    return Response.json({
      config: configs[0],
      availableStrategies: [
        {
          id: "priority",
          name: "Strict Priority Chain",
          description: "Tries providers in explicit order: Groq → Cerebras → Gemini → Mistral. Falls over on 429/5xx.",
          icon: "ListOrdered",
        },
        {
          id: "latency",
          name: "Lowest Latency (Speed First)",
          description: "Ranks providers by live rolling TTFT and token/sec benchmarks to pick the fastest available engine.",
          icon: "Zap",
        },
        {
          id: "reliability",
          name: "Highest Reliability (Uptime Score)",
          description: "Prioritizes providers with the lowest 24h error rate and largest remaining daily token headroom.",
          icon: "ShieldCheck",
        },
        {
          id: "round_robin",
          name: "Even Round-Robin Load Balance",
          description: "Evenly distributes requests across all operational free providers to minimize burning any single quota.",
          icon: "RefreshCw",
        },
        {
          id: "capability",
          name: "Maximum Capability (Benchmark Score)",
          description: "Selects the highest MMLU / coding benchmark model regardless of latency.",
          icon: "Sparkles",
        },
      ],
      profiles: [
        { id: "auto:default", name: "Default Balanced", description: "Balanced speed and intelligence for general tasks" },
        { id: "auto:fastest", name: "Ultra-Fast Streaming", description: "Cerebras CS-3 & Groq LPUs at 1,000+ tok/sec" },
        { id: "auto:coding", name: "Coding & Agents", description: "Codestral, Qwen 2.5 Coder, Llama 3.3 for SWE workflows" },
        { id: "auto:reasoning", name: "Deep Reasoning & Math", description: "DeepSeek R1 Distill, Gemini Flash Thinking" },
        { id: "auto:vision", name: "Multimodal & Vision", description: "Gemini 2.5 Flash & Pixtral 12B" },
      ],
    });
  } catch (error: any) {
    console.error("Error fetching routing config:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return adminUnauthorizedResponse();

  try {
    const body = await req.json();
    const { strategy, fallbackChain, cooldownSeconds, maxRetries, stickySessions, sessionTimeoutMinutes, activeProfile } = body;

    let configs = await db.select().from(routingConfig).limit(1);

    if (configs.length === 0) {
      const [inserted] = await db
        .insert(routingConfig)
        .values({
          strategy: strategy || "priority",
          fallbackChain: fallbackChain || DEFAULT_CHAIN,
          cooldownSeconds: cooldownSeconds ?? 60,
          maxRetries: maxRetries ?? 3,
          stickySessions: stickySessions ?? true,
          sessionTimeoutMinutes: sessionTimeoutMinutes ?? 30,
          activeProfile: activeProfile || "auto:default",
        })
        .returning();
      return Response.json({ success: true, config: inserted });
    }

    const [updated] = await db
      .update(routingConfig)
      .set({
        ...(strategy && { strategy }),
        ...(fallbackChain && { fallbackChain }),
        ...(typeof cooldownSeconds === "number" && { cooldownSeconds }),
        ...(typeof maxRetries === "number" && { maxRetries }),
        ...(typeof stickySessions === "boolean" && { stickySessions }),
        ...(typeof sessionTimeoutMinutes === "number" && { sessionTimeoutMinutes }),
        ...(activeProfile && { activeProfile }),
        updatedAt: new Date(),
      })
      .where(eq(routingConfig.id, configs[0].id))
      .returning();

    return Response.json({ success: true, config: updated });
  } catch (error: any) {
    console.error("Error updating routing config:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
