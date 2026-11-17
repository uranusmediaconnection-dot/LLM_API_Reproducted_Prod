import { authenticateUnifiedApiRequest } from "@/lib/api-auth";
import { searchWeb } from "@/lib/web-tools";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

function extractQuery(request: Request, bodyQuery?: unknown): string | null {
  if (typeof bodyQuery === "string" && bodyQuery.trim()) return bodyQuery.trim();
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? url.searchParams.get("query");
  return q && q.trim() ? q.trim() : null;
}

export async function GET(request: Request) {
  const authenticationError = await authenticateUnifiedApiRequest(request, { corsHeaders });
  if (authenticationError) return authenticationError;

  const query = extractQuery(request);
  if (!query) {
    return Response.json(
      { error: { message: "Missing search query. Pass ?q=... or {\"query\": \"...\"}.", code: "missing_parameter" } },
      { status: 400, headers: corsHeaders }
    );
  }

  const started = Date.now();
  const outcome = await searchWeb(query);
  return Response.json(
    {
      object: "web_tools.search",
      query: outcome.query,
      engine: outcome.engine,
      results: outcome.results,
      note: outcome.note ?? null,
      took_ms: Date.now() - started,
    },
    { headers: corsHeaders }
  );
}

export async function POST(request: Request) {
  const authenticationError = await authenticateUnifiedApiRequest(request, { corsHeaders });
  if (authenticationError) return authenticationError;

  let bodyQuery: unknown;
  try {
    const body: any = await request.json();
    bodyQuery = body?.query;
  } catch {
    bodyQuery = undefined; // GET-style ?q= fallback still applies
  }

  const query = extractQuery(request, bodyQuery);
  if (!query) {
    return Response.json(
      { error: { message: "Missing search query. Pass {\"query\": \"...\"} or ?q=... .", code: "missing_parameter" } },
      { status: 400, headers: corsHeaders }
    );
  }

  const started = Date.now();
  const outcome = await searchWeb(query);
  return Response.json(
    {
      object: "web_tools.search",
      query: outcome.query,
      engine: outcome.engine,
      results: outcome.results,
      note: outcome.note ?? null,
      took_ms: Date.now() - started,
    },
    { headers: corsHeaders }
  );
}
