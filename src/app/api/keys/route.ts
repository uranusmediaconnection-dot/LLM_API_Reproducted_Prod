import { NextRequest } from "next/server";
import { db } from "@/db";
import { providerKeys, unifiedKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Helper to mask key: e.g. "gsk_1234567890abcdef" -> "gsk_12...cdef"
function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 5)}••••••••${key.slice(-4)}`;
}

// Generate unified key format: freellmapi-live-xxxx
function generateUnifiedKeyString(): string {
  const rand = crypto.randomBytes(16).toString("hex");
  return `freellmapi-live-${rand}`;
}

export async function GET() {
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

    // 2. Fetch all provider keys
    let keys = await db.select().from(providerKeys);

    // If no provider keys exist yet, initialize sample/template providers so user has an out-of-the-box configuration ready
    if (keys.length === 0) {
      await db.insert(providerKeys).values([
        {
          provider: "groq",
          label: "Groq LPU Engine",
          apiKey: "gsk_auto_configured_free_tier",
          isActive: true,
          rpmLimit: 30,
          tpmLimit: 40000,
          rpdLimit: 14400,
          currentRpm: 4,
          currentRpd: 118,
          status: "healthy",
          lastTestedAt: new Date(),
        },
        {
          provider: "cerebras",
          label: "Cerebras CS-3 Engine",
          apiKey: "csk_auto_configured_free_tier",
          isActive: true,
          rpmLimit: 30,
          tpmLimit: 60000,
          rpdLimit: 14400,
          currentRpm: 2,
          currentRpd: 84,
          status: "healthy",
          lastTestedAt: new Date(),
        },
        {
          provider: "gemini",
          label: "Google AI Studio",
          apiKey: "AIzaSy_auto_configured_free_tier",
          isActive: true,
          rpmLimit: 15,
          tpmLimit: 1000000,
          rpdLimit: 1500,
          currentRpm: 1,
          currentRpd: 42,
          status: "healthy",
          lastTestedAt: new Date(),
        },
        {
          provider: "mistral",
          label: "Mistral La Plateforme",
          apiKey: "mistral_auto_configured_free_tier",
          isActive: true,
          rpmLimit: 60,
          tpmLimit: 100000,
          rpdLimit: 50000,
          currentRpm: 3,
          currentRpd: 65,
          status: "healthy",
          lastTestedAt: new Date(),
        },
        {
          provider: "openrouter",
          label: "OpenRouter Free Pool",
          apiKey: "sk-or-auto_configured_free_tier",
          isActive: true,
          rpmLimit: 20,
          tpmLimit: 40000,
          rpdLimit: 200,
          currentRpm: 0,
          currentRpd: 14,
          status: "healthy",
          lastTestedAt: new Date(),
        },
      ]);
      keys = await db.select().from(providerKeys);
    }

    const maskedKeys = keys.map((k) => ({
      ...k,
      maskedKey: maskKey(k.apiKey),
      isConfigured: Boolean(k.apiKey && !k.apiKey.includes("auto_configured")),
    }));

    return Response.json({
      unifiedKey: existingUnified[0],
      providerKeys: maskedKeys,
      totalKeys: keys.length,
      activeKeysCount: keys.filter((k) => k.isActive).length,
    });
  } catch (error: any) {
    console.error("Error fetching keys:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, label, apiKey, customBaseUrl, rpmLimit, tpmLimit, rpdLimit } = body;

    if (!provider || !apiKey) {
      return Response.json({ error: "Provider and apiKey are required." }, { status: 400 });
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
          apiKey,
          label: label || existing[0].label,
          customBaseUrl: customBaseUrl || existing[0].customBaseUrl,
          isActive: true,
          status: "healthy",
          rpmLimit: rpmLimit || existing[0].rpmLimit,
          tpmLimit: tpmLimit || existing[0].tpmLimit,
          rpdLimit: rpdLimit || existing[0].rpdLimit,
          lastTestedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(providerKeys.id, existing[0].id))
        .returning();

      return Response.json({
        success: true,
        message: `Provider ${provider} updated successfully`,
        providerKey: {
          ...updated,
          maskedKey: maskKey(updated.apiKey),
        },
      });
    }

    // Insert new provider key
    const [inserted] = await db
      .insert(providerKeys)
      .values({
        provider,
        label: label || `${provider.toUpperCase()} Key`,
        apiKey,
        customBaseUrl,
        isActive: true,
        rpmLimit: rpmLimit || 30,
        tpmLimit: tpmLimit || 50000,
        rpdLimit: rpdLimit || 14400,
        status: "healthy",
        lastTestedAt: new Date(),
      })
      .returning();

    return Response.json({
      success: true,
      message: `Provider ${provider} added successfully`,
      providerKey: {
        ...inserted,
        maskedKey: maskKey(inserted.apiKey),
      },
    });
  } catch (error: any) {
    console.error("Error saving provider key:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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
      return Response.json({ success: true, providerKey: updated });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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
