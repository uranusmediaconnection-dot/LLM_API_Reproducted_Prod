import { db } from "@/db";
import { requestLogs, providerKeys } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { adminUnauthorizedResponse, isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminUnauthorizedResponse();

  try {
    // 1. Fetch recent 25 logs
    const recentLogs = await db
      .select()
      .from(requestLogs)
      .where(eq(requestLogs.isFallback, false))
      .orderBy(desc(requestLogs.createdAt))
      .limit(25);

    // 2. Fetch aggregate stats
    const totalRequestsResult = await db
      .select({
        count: sql<number>`count(*)`,
        totalTokens: sql<number>`coalesce(sum(${requestLogs.totalTokens}), 0)`,
        promptTokens: sql<number>`coalesce(sum(${requestLogs.promptTokens}), 0)`,
        completionTokens: sql<number>`coalesce(sum(${requestLogs.completionTokens}), 0)`,
        avgLatency: sql<number>`coalesce(avg(${requestLogs.latencyMs}), 0)`,
        avgTtft: sql<number>`coalesce(avg(${requestLogs.ttftMs}), 0)`,
        fallbackCount: sql<number>`coalesce(sum(case when ${requestLogs.isFallback} = true then 1 else 0 end), 0)`,
        successfulRequests: sql<number>`coalesce(sum(case when ${requestLogs.statusCode} < 400 then 1 else 0 end), 0)`,
      })
      .from(requestLogs)
      .where(eq(requestLogs.isFallback, false));

    const agg = totalRequestsResult[0] || {
      count: 0,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      avgLatency: 0,
      avgTtft: 0,
      fallbackCount: 0,
      successfulRequests: 0,
    };

    // 3. Provider keys quota breakdown
    const keys = (await db.select().from(providerKeys)).filter(
      (key) => !/(auto_configured|placeholder|example|changeme)/i.test(key.apiKey)
    );

    const totalRequests = Number(agg.count);
    const totalTokens = Number(agg.totalTokens);
    const avgLatency = Math.round(Number(agg.avgLatency));
    const avgTtft = Math.round(Number(agg.avgTtft));
    const uptimePercentage = totalRequests > 0
      ? Math.round((Number(agg.successfulRequests) / totalRequests) * 10000) / 100
      : 0;

    return Response.json({
      summary: {
        totalRequests,
        totalTokens,
        promptTokens: Number(agg.promptTokens),
        completionTokens: Number(agg.completionTokens),
        avgLatencyMs: avgLatency,
        avgTtftMs: avgTtft,
        fallbackCount: Number(agg.fallbackCount),
        uptimePercentage,
      },
      providerQuotas: keys.map((k) => ({
        provider: k.provider,
        label: k.label,
        currentRpm: k.currentRpm,
        rpmLimit: k.rpmLimit,
        rpmPercent: k.rpmLimit > 0 ? Math.min(100, Math.round((k.currentRpm / k.rpmLimit) * 100)) : 0,
        currentRpd: k.currentRpd,
        rpdLimit: k.rpdLimit,
        rpdPercent: k.rpdLimit > 0 ? Math.min(100, Math.round((k.currentRpd / k.rpdLimit) * 100)) : 0,
        status: k.status,
      })),
      recentLogs,
    });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
