import { NextRequest } from "next/server";
import { db } from "@/db";
import { providerKeys, unifiedKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { adminUnauthorizedResponse, isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const SUPPORTED_PROVIDERS = new Set([
  "groq",
  "cerebras",
  "gemini",
  "mistral",
  "openrouter",
  "cohere",
  "cloudflare",
  "huggingface",
  "nvidia",
  "zhipu",
]);

// Helper to mask key: e.g. "gsk_1234567890abcdef" -> "gsk_12...cdef"
function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 5)}••••••••${key.slice(-4)}`;
}

function serializeProviderKey({ apiKey, ...key }: typeof providerKeys.$inferSelect) {
  return {
    ...key,
    maskedKey: maskKey(apiKey),
    isConfigured: Boolean(
      apiKey && !/(auto_configured|placeholder|example|changeme)/i.test(apiKey)
    ),
  };
}

// Generate unified key format: thesun-live-xxxx
function generateUnifiedKeyString(): string {
  const rand = crypto.randomBytes(16).toString("hex");
  return `thesun-live-${rand}`;
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminUnauthorizedResponse();

  try {
    // 1. Ensure unified key exists
    let existingUnified = await db.select().from(unifiedKeys).limit(1);
    if (existingUnified.length === 0) {
      const newKey = generateUnifiedKeyString();
      const [inserted] = await db
        .insert(unifiedKeys)
        .values({
          key: newKey,
          name: "Default Unified Key",
          isActive: true,
          requestsCount: 0,
          tokensUsed: 0,
        })
        .returning();
      existingUnified = [inserted];
    }

    const keys = await db.select().from(providerKeys);
    const maskedKeys = keys.map(serializeProviderKey);

    return Response.json({
      unifiedKey: existingUnified[0],
      providerKeys: maskedKeys,
      totalKeys: keys.length,
      activeKeysCount: maskedKeys.filter((key) => key.isActive && key.isConfigured).length,
    });
  } catch (error: any) {
    console.error("Error fetching keys:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return adminUnauthorizedResponse();

  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { provider, label, apiKey, customBaseUrl, rpmLimit, tpmLimit, rpdLimit } = body;
    const normalizedApiKey = typeof apiKey === "string" ? apiKey.trim() : "";

    if (
      typeof provider !== "string" ||
      !SUPPORTED_PROVIDERS.has(provider) ||
      normalizedApiKey.length < 8 ||
      normalizedApiKey.length > 4096 ||
      (label !== undefined && (typeof label !== "string" || label.length > 100))
    ) {
      return Response.json(
        { error: "Provide a valid provider, API key, and label." },
        { status: 400 }
      );
    }

    let normalizedCustomBaseUrl: string | null = null;
    if (provider === "cloudflare") {
      try {
        const endpoint = new URL(typeof customBaseUrl === "string" ? customBaseUrl : "");
        const validCloudflareEndpoint =
          endpoint.protocol === "https:" &&
          endpoint.hostname === "api.cloudflare.com" &&
          endpoint.pathname.includes("/client/v4/accounts/") &&
          endpoint.pathname.endsWith("/ai/v1");
        if (!validCloudflareEndpoint) throw new Error("Invalid Cloudflare endpoint");
        normalizedCustomBaseUrl = endpoint.origin + endpoint.pathname;
      } catch {
        return Response.json(
          { error: "Cloudflare requires an HTTPS AI endpoint URL ending in /client/v4/accounts/<account-id>/ai/v1." },
          { status: 400 }
        );
      }
    }

    // Check if key for provider exists
    const existing = await db
      .select()
      .from(providerKeys)
      .where(eq(providerKeys.provider, provider))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(providerKeys)
        .set({
          apiKey: normalizedApiKey,
          label: label || existing[0].label,
          customBaseUrl: normalizedCustomBaseUrl,
          isActive: true,
          status: "unverified",
          rpmLimit: rpmLimit || existing[0].rpmLimit,
          tpmLimit: tpmLimit || existing[0].tpmLimit,
          rpdLimit: rpdLimit || existing[0].rpdLimit,
          lastTestedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(providerKeys.id, existing[0].id))
        .returning();

      return Response.json({
        success: true,
        message: `Provider ${provider} updated successfully`,
        providerKey: serializeProviderKey(updated),
      });
    }

    // Insert new provider key
    const [inserted] = await db
      .insert(providerKeys)
      .values({
        provider,
        label: label || `${provider.toUpperCase()} Key`,
        apiKey: normalizedApiKey,
        customBaseUrl: normalizedCustomBaseUrl,
        isActive: true,
        rpmLimit: rpmLimit || 30,
        tpmLimit: tpmLimit || 50000,
        rpdLimit: rpdLimit || 14400,
        status: "unverified",
      })
      .returning();

    return Response.json({
      success: true,
      message: `Provider ${provider} added successfully`,
      providerKey: serializeProviderKey(inserted),
    });
  } catch (error: any) {
    console.error("Error saving provider key:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) return adminUnauthorizedResponse();

  try {
    const body = await req.json();
    const { action, id, isActive } = body;

    // Regenerate unified key
    if (action === "regenerate_unified_key") {
      const newKey = generateUnifiedKeyString();
      const existing = await db.select().from(unifiedKeys).limit(1);
      if (existing.length > 0) {
        const [updated] = await db
          .update(unifiedKeys)
          .set({ key: newKey })
          .where(eq(unifiedKeys.id, existing[0].id))
          .returning();
        return Response.json({ success: true, unifiedKey: updated });
      } else {
        const [inserted] = await db
          .insert(unifiedKeys)
          .values({ key: newKey, name: "Default Unified Key" })
          .returning();
        return Response.json({ success: true, unifiedKey: inserted });
      }
    }

    // Toggle provider key active status
    if (id && typeof isActive === "boolean") {
      const [updated] = await db
        .update(providerKeys)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(providerKeys.id, id))
        .returning();
      return Response.json({ success: true, providerKey: updated ? serializeProviderKey(updated) : null });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return adminUnauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Key id is required" }, { status: 400 });
    }

    await db.delete(providerKeys).where(eq(providerKeys.id, parseInt(id, 10)));
    return Response.json({ success: true, message: "Provider key removed" });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
