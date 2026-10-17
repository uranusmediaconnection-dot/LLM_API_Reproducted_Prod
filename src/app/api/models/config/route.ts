import { NextRequest } from "next/server";
import { db } from "@/db";
import { modelConfig, requestLogs } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { adminUnauthorizedResponse, isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** GET /api/models/config — all per-model routing state + live usage per model. */
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminUnauthorizedResponse();

  try {
    const rows = await db.select().from(modelConfig);
    const usage = await db
      .select({
        modelUsed: requestLogs.modelUsed,
        requests: sql<number>`count(*)::int`,
        tokens: sql<number>`coalesce(sum(${requestLogs.totalTokens}), 0)::int`,
        errors: sql<number>`coalesce(sum(case when ${requestLogs.statusCode} >= 400 then 1 else 0 end), 0)::int`,
      })
      .from(requestLogs)
      .groupBy(requestLogs.modelUsed);
    return Response.json({ configs: rows, usage });
  } catch (error: any) {
    console.error("Error fetching model config:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/models/config — upsert per-model state.
 * Body: { modelId, enabled?, sortOrder?, displayName?, contextOverride?,
 *         capabilityTier?, rpmOverride?, rpdOverride?, tpmOverride?, tpdOverride?,
 *         toolsEnabled?, visionEnabled?, inChain?, aliases? }
 */
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return adminUnauthorizedResponse();

  try {
    const body = await req.json();
    const { modelId, ...fields } = body;
    if (!modelId || typeof modelId !== "string") {
      return Response.json({ error: "modelId is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of [
      "enabled",
      "sortOrder",
      "displayName",
      "contextOverride",
      "capabilityTier",
      "rpmOverride",
      "rpdOverride",
      "tpmOverride",
      "tpdOverride",
      "toolsEnabled",
      "visionEnabled",
      "inChain",
      "aliases",
    ] as const) {
      if (fields[key] !== undefined) updates[key] = fields[key];
    }

    const existing = await db
      .select()
      .from(modelConfig)
      .where(eq(modelConfig.modelId, modelId))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(modelConfig)
        .set(updates)
        .where(eq(modelConfig.modelId, modelId))
        .returning();
      return Response.json({ success: true, config: updated });
    }

    const [inserted] = await db
      .insert(modelConfig)
      .values({ modelId, ...updates } as typeof modelConfig.$inferInsert)
      .returning();
    return Response.json({ success: true, config: inserted });
  } catch (error: any) {
    console.error("Error updating model config:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/models/config — bulk operations.
 * Body: { action: "reorder", order: string[] }
 *     | { action: "bulkEnabled", enabled: boolean, modelIds?: string[] }
 */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return adminUnauthorizedResponse();

  try {
    const body = await req.json();

    if (body.action === "reorder" && Array.isArray(body.order)) {
      const order: string[] = body.order;
      await Promise.all(
        order.map((modelId, index) =>
          db
            .insert(modelConfig)
            .values({ modelId, sortOrder: index })
            .onConflictDoUpdate({
              target: modelConfig.modelId,
              set: { sortOrder: index, updatedAt: new Date() },
            })
        )
      );
      return Response.json({ success: true });
    }

    if (body.action === "bulkEnabled" && typeof body.enabled === "boolean") {
      const enabled = body.enabled;
      if (Array.isArray(body.modelIds) && body.modelIds.length > 0) {
        const ids: string[] = body.modelIds;
        const existing = await db
          .select({ modelId: modelConfig.modelId })
          .from(modelConfig)
          .where(inArray(modelConfig.modelId, ids));
        const existingSet = new Set(existing.map((r) => r.modelId));
        await Promise.all([
          ...ids
            .filter((id) => existingSet.has(id))
            .map((id) =>
              db
                .update(modelConfig)
                .set({ enabled, updatedAt: new Date() })
                .where(eq(modelConfig.modelId, id))
            ),
          ...ids
            .filter((id) => !existingSet.has(id))
            .map((id) => db.insert(modelConfig).values({ modelId: id, enabled })),
        ]);
      } else {
        await db.update(modelConfig).set({ enabled, updatedAt: new Date() });
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in bulk model config:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
