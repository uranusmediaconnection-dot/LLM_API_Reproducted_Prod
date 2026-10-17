import { ALL_MODELS } from "@/lib/models-data";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const modelsData = ALL_MODELS.map((m) => ({
    id: m.id,
    object: "model",
    created: 1710000000,
    owned_by: m.provider,
    name: m.name,
    category: m.category,
    context_window: m.contextWindow,
    tokens_per_second: m.tokensPerSecond,
    free_tier: m.freeTier,
    features: m.features,
    status: m.status,
    permission: [
      {
        id: `modelperm-${m.id}`,
        object: "model_permission",
        created: 1710000000,
        allow_create_engine: false,
        allow_sampling: true,
        allow_logprobs: true,
        allow_search_indices: false,
        allow_view: true,
        allow_fine_tuning: false,
        organization: "*",
        group: null,
        is_blocking: false,
      },
    ],
    root: m.id,
    parent: null,
  }));

  return Response.json(
    {
      object: "list",
      data: modelsData,
    },
    { headers: corsHeaders }
  );
}
