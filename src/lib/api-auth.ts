import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { unifiedKeys } from "@/db/schema";

type AuthErrorFormat = "openai" | "anthropic";

function authenticationError(
  message: string,
  format: AuthErrorFormat,
  corsHeaders: HeadersInit = {}
) {
  const body =
    format === "anthropic"
      ? { type: "error", error: { type: "authentication_error", message } }
      : {
          error: {
            message,
            type: "authentication_error",
            code: "invalid_api_key",
          },
        };

  return Response.json(body, {
    status: 401,
    headers: {
      ...Object.fromEntries(new Headers(corsHeaders).entries()),
      "Cache-Control": "no-store",
      "WWW-Authenticate": 'Bearer realm="The SUN"',
    },
  });
}

export async function authenticateUnifiedApiRequest(
  request: Request,
  options: { format?: AuthErrorFormat; corsHeaders?: HeadersInit } = {}
): Promise<Response | null> {
  const format = options.format ?? "openai";
  const authorization = request.headers.get("authorization");
  const bearerMatch = authorization?.match(/^Bearer\s+(.+)$/i);
  const credential = (bearerMatch?.[1] ?? request.headers.get("x-api-key"))?.trim();

  if (!credential || credential.length > 512) {
    return authenticationError("A valid API key is required.", format, options.corsHeaders);
  }

  try {
    const [key] = await db
      .select({ id: unifiedKeys.id })
      .from(unifiedKeys)
      .where(and(eq(unifiedKeys.key, credential), eq(unifiedKeys.isActive, true)))
      .limit(1);

    if (!key) {
      return authenticationError("The API key is invalid or inactive.", format, options.corsHeaders);
    }

    await db
      .update(unifiedKeys)
      .set({
        requestsCount: sql`${unifiedKeys.requestsCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(unifiedKeys.id, key.id));

    return null;
  } catch (error) {
    console.error("Unified API key verification failed:", error);
    return Response.json(
      {
        error: {
          message: "API key verification is temporarily unavailable.",
          type: "api_error",
          code: "authentication_unavailable",
        },
      },
      {
        status: 503,
        headers: {
          ...Object.fromEntries(new Headers(options.corsHeaders).entries()),
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
