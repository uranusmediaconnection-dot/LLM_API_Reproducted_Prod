import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({
      status: "healthy",
      service: "freellmapi-gateway",
      version: "0.15.2",
      openaiCompatible: true,
      providersSupported: 34,
      modelEndpoints: 635,
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
