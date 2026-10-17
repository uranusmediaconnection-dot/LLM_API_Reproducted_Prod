import { ALL_MODELS, ModelDefinition } from "./models-data";
import { db } from "@/db";
import { modelConfig, providerKeys, routingConfig } from "@/db/schema";
import { resolveModelRoute, ResolvedRoute } from "./resolver";

/**
 * Config-aware resolution: honors per-model enabled flags, manual ordering
 * (priority strategy), in-chain flags and custom aliases from model_config.
 * Falls back to the pure catalog resolution on any DB error.
 */
export async function resolveModelRouteWithConfig(
  modelInput?: string
): Promise<ResolvedRoute> {
  const base = resolveModelRoute(modelInput);

  try {
    const [configs, routingRows, storedKeys] = await Promise.all([
      db.select().from(modelConfig),
      db.select().from(routingConfig).limit(1),
      db.select({
        provider: providerKeys.provider,
        apiKey: providerKeys.apiKey,
        customBaseUrl: providerKeys.customBaseUrl,
        isActive: providerKeys.isActive,
      }).from(providerKeys),
    ]);
    const cfgByModel = new Map(configs.map((c) => [c.modelId, c]));
    const strategy = routingRows[0]?.strategy ?? "priority";
    const isRealCredential = (value?: string | null) =>
      Boolean(value && value.length > 10 && !/(auto_configured|placeholder|example|changeme)/i.test(value));
    const configuredProviders = new Set(
      storedKeys
        .filter((key) =>
          key.isActive &&
          isRealCredential(key.apiKey) &&
          (key.provider !== "cloudflare" || Boolean(key.customBaseUrl))
        )
        .map((key) => key.provider)
    );

    for (const model of ALL_MODELS) {
      const envKey = process.env[`${model.provider.toUpperCase()}_API_KEY`];
      if (model.provider !== "cloudflare" && isRealCredential(envKey)) {
        configuredProviders.add(model.provider);
      }
    }
    const hasConfiguredProviders = configuredProviders.size > 0;

    // Alias resolution: an alias maps to this unified model
    const requested = (modelInput || "").trim().toLowerCase();
    if (requested) {
      const aliasMatch = configs.find((c) =>
        ((c.aliases as string[]) ?? []).some((a) => a.toLowerCase() === requested)
      );
      if (aliasMatch) {
        const target = ALL_MODELS.find((m) => m.id === aliasMatch.modelId);
        if (target) {
          return { targetModel: target, fallbackChain: [target], provider: target.provider, isAuto: false };
        }
      }
    }

    const isEnabled = (m: ModelDefinition) => {
      const cfg = cfgByModel.get(m.id);
      return (cfg?.enabled ?? true) && (cfg?.inChain ?? true);
    };

    let chain = base.fallbackChain.filter(isEnabled);
    if (base.isAuto && hasConfiguredProviders) {
      chain = chain.filter((model) => configuredProviders.has(model.provider));
      if (chain.length === 0) {
        chain = ALL_MODELS.filter(
          (model) => isEnabled(model) && configuredProviders.has(model.provider)
        ).slice(0, 1);
      }
    }
    if (chain.length === 0 && !hasConfiguredProviders) {
      chain = ALL_MODELS.filter(isEnabled).slice(0, 1);
    }
    if (chain.length === 0) return base;

    // Manual (priority) mode: order the chain by persisted sortOrder
    if (strategy === "priority") {
      chain = [...chain].sort((a, b) => {
        const sa = cfgByModel.get(a.id)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const sb = cfgByModel.get(b.id)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
        return sa - sb;
      });
    }

    let target = base.targetModel;
    if (
      !isEnabled(target) ||
      (base.isAuto && hasConfiguredProviders && !configuredProviders.has(target.provider))
    ) {
      target = chain[0];
    } else if (strategy === "priority" && base.isAuto) {
      // In manual mode auto profiles follow the persisted order too
      target = chain[0];
    }

    return { ...base, targetModel: target, fallbackChain: chain, provider: target.provider };
  } catch (err) {
    console.error("[v0] resolveModelRouteWithConfig failed, using catalog fallback:", err);
    return base;
  }
}
