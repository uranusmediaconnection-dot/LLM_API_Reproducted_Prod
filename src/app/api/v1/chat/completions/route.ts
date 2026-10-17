import { NextRequest } from "next/server";
import { resolveModelRoute } from "@/lib/router-engine";
import { executeChatCompletion } from "@/lib/provider-dispatch";

export const dynamic = "force-dynamic";

// Standard CORS headers for OpenAI API drop-in compatibility
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Provider-Key",
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        {
          error: {
            message: "Invalid JSON in request body",
            type: "invalid_request_error",
            code: "parse_error",
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate messages array
    if (!body || !body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return Response.json(
        {
          error: {
            message: "Missing or invalid 'messages' field in request body. It must be a non-empty array.",
            type: "invalid_request_error",
            code: "missing_parameter",
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Resolve model and fallback chain
    const route = resolveModelRoute(body.model);
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";

    // Execute chat completion
    const response = await executeChatCompletion(
      {
        model: body.model,
        messages: body.messages,
        stream: body.stream === true,
        temperature: typeof body.temperature === "number" ? body.temperature : 0.7,
        max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 2048,
        top_p: typeof body.top_p === "number" ? body.top_p : 1,
        tools: body.tools,
        tool_choice: body.tool_choice,
      },
      route,
      clientIp
    );

    // Attach CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error: any) {
    console.error("FreeLLMAPI Chat Completion Error:", error);
    return Response.json(
      {
        error: {
          message: error?.message || "Internal server error occurred while processing LLM request.",
          type: "api_error",
          code: "internal_error",
        },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
