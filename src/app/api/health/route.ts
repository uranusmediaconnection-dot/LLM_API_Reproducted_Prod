import { db } from "@/db";
import { sql } from "drizzle-orm";
import { PROVIDERS_INFO, PROVIDER_MODELS } from "@/lib/models-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({
      status: "healthy",
      service: "thesun-gateway",
      version: "0.15.2",
      openaiCompatible: true,
      providersSupported: PROVIDERS_INFO.length,
      modelEndpoints: PROVIDER_MODELS.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json(
      {
        status: "unhealthy",
        error: err?.message || "Database connection error",
      },
      { status: 500 }
    );
  }
}
