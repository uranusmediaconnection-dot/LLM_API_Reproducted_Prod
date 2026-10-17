import { db } from "@/db";
import { requestLogs } from "@/db/schema";
export * from "./resolver";

export async function logRequestUsage(data: {
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
  clientIp?: string;
}) {
  try {
    await db.insert(requestLogs).values({
      modelRequested: data.modelRequested,
      providerUsed: data.providerUsed,
      modelUsed: data.modelUsed,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      totalTokens: data.totalTokens,
      latencyMs: data.latencyMs,
      ttftMs: data.ttftMs,
      statusCode: data.statusCode,
      isFallback: data.isFallback,
      fallbackAttempts: data.fallbackAttempts,
      clientIp: data.clientIp || "127.0.0.1",
    });
  } catch (err) {
    console.error("Failed to insert request log:", err);
  }
}
