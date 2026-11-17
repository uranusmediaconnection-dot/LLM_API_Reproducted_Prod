import { authenticateUnifiedApiRequest } from "@/lib/api-auth";
import { scrapeUrl } from "@/lib/web-tools";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

function extractUrl(request: Request, bodyUrl?: unknown): string | null {
  if (typeof bodyUrl === "string" && bodyUrl.trim()) return bodyUrl.trim();
  const url = new URL(request.url);
  const target = url.searchParams.get("url");
  return target && target.trim() ? target.trim() : null;
}

function validUrl(candidate: string): boolean {
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const authenticationError = await authenticateUnifiedApiRequest(request, { corsHeaders });
  if (authenticationError) return authenticationError;

  const target = extractUrl(request);
  if (!target || !validUrl(target)) {
    return Response.json(
      { error: { message: "Missing or invalid url. Pass ?url=https://... .", code: "invalid_parameter" } },
      { status: 400, headers: corsHeaders }
    );
  }

  const started = Date.now();
  const outcome = await scrapeUrl(target);
  return Response.json(
    {
      object: "web_tools.scrape",
      url: outcome.url,
      source: outcome.source,
      title: outcome.title ?? null,
      content: outcome.content,
      chars: outcome.content.length,
      note: outcome.note ?? null,
      took_ms: Date.now() - started,
    },
    { headers: corsHeaders }
  );
}

export async function POST(request: Request) {
  const authenticationError = await authenticateUnifiedApiRequest(request, { corsHeaders });
  if (authenticationError) return authenticationError;

  let bodyUrl: unknown;
  try {
    const body: any = await request.json();
    bodyUrl = body?.url;
  } catch {
    bodyUrl = undefined; // ?url= fallback still applies
  }

  const target = extractUrl(request, bodyUrl);
  if (!target || !validUrl(target)) {
    return Response.json(
      { error: { message: "Missing or invalid url. Pass {\"url\": \"https://...\"} or ?url=... .", code: "invalid_parameter" } },
      { status: 400, headers: corsHeaders }
    );
  }

  const started = Date.now();
  const outcome = await scrapeUrl(target);
  return Response.json(
    {
      object: "web_tools.scrape",
      url: outcome.url,
      source: outcome.source,
      title: outcome.title ?? null,
      content: outcome.content,
      chars: outcome.content.length,
      note: outcome.note ?? null,
      took_ms: Date.now() - started,
    },
    { headers: corsHeaders }
  );
}
