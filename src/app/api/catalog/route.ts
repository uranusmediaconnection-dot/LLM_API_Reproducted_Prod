import { ALL_MODELS, AUTO_PROFILES, PROVIDERS_INFO, PROVIDER_MODELS } from "@/lib/models-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    metrics: {
      providersCount: PROVIDERS_INFO.length,
      modelEndpointsCount: PROVIDER_MODELS.length,
      tokensPerMonthEstimate: "Up to 7.4 Billion (estimated)",
    },
    autoProfiles: AUTO_PROFILES,
    models: ALL_MODELS,
    providers: PROVIDERS_INFO,
  });
}
