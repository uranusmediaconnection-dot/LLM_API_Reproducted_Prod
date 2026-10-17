import { ALL_MODELS, AUTO_PROFILES, PROVIDERS_INFO } from "@/lib/models-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    metrics: {
      providersCount: 34,
      modelEndpointsCount: 635,
      tokensPerMonthEstimate: "7.4 Billion",
      averageSpeedTps: 420,
      availabilityPercent: 99.8,
    },
    autoProfiles: AUTO_PROFILES,
    models: ALL_MODELS,
    providers: PROVIDERS_INFO,
  });
}
