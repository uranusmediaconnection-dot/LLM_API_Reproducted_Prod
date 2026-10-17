import { NextRequest } from "next/server";
import { db } from "@/db";
import { providerKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { adminUnauthorizedResponse, isAdminRequest } from "@/lib/admin-auth";
import { ALL_MODELS } from "@/lib/models-data";
import { executeChatCompletion } from "@/lib/provider-dispatch";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return adminUnauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const id = body && typeof body === "object" && "id" in body ? Number(body.id) : NaN;
  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json({ error: "A valid provider key id is required" }, { status: 400 });
  }

  try {
    const [key] = await db
      .select()
      .from(providerKeys)
      .where(eq(providerKeys.id, id))
      .limit(1);

    if (!key || !key.isActive) {
      return Response.json({ error: "The provider key is missing or inactive" }, { status: 404 });
    }

    if (!key.apiKey || /(auto_configured|placeholder|example|changeme)/i.test(key.apiKey)) {
      return Response.json({ error: "Add a real provider API key before testing this connection" }, { status: 400 });
    }

    const model = ALL_MODELS.find((candidate) => candidate.provider === key.provider);
    if (!model) {
      return Response.json({ error: `No chat model is available for ${key.provider}` }, { status: 501 });
    }

    const upstreamResponse = await executeChatCompletion(
      {
        model: model.id,
        messages: [{ role: "user", content: "Reply with OK." }],
        stream: false,
        temperature: 0,
        max_tokens: 8,
      },
      {
        targetModel: model,
        fallbackChain: [model],
        provider: key.provider,
        isAuto: false,
      },
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1",
      { apiKey: key.apiKey, customBaseUrl: key.customBaseUrl }
    );

    const responseData = await upstreamResponse.json().catch(() => null);
    const succeeded = upstreamResponse.ok;
    const message = succeeded
      ? "Provider authenticated and completed a real test request."
      : responseData?.error?.message ?? `Provider test failed with HTTP ${upstreamResponse.status}.`;

    await db
      .update(providerKeys)
      .set({
        status: succeeded ? "healthy" : "error",
        lastTestedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(providerKeys.id, key.id));

    return Response.json(
      { success: succeeded, status: succeeded ? "healthy" : "error", message },
      { status: succeeded ? 200 : upstreamResponse.status }
    );
  } catch (error) {
    console.error("Provider connection test failed:", error);
    return Response.json({ error: "Provider connection test failed" }, { status: 500 });
  }
}
