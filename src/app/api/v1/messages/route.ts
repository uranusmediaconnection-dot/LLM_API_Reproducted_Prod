import { NextRequest } from "next/server";
import { resolveModelRouteWithConfig } from "@/lib/resolver-db";
import { executeChatCompletion } from "@/lib/provider-dispatch";
import { authenticateUnifiedApiRequest } from "@/lib/api-auth";
import { maybeEnhanceMessages } from "@/lib/web-tools";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, anthropic-version",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const authenticationError = await authenticateUnifiedApiRequest(req, {
    format: "anthropic",
    corsHeaders,
  });
  if (authenticationError) return authenticationError;

  try {
    const body = await req.json();
    const { model, messages, system, max_tokens, stream } = body;

    let chatMessages: any[] = [];
    if (system) {
      chatMessages.push({ role: "system", content: system });
    }
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        const textContent = Array.isArray(msg.content)
          ? msg.content.map((c: any) => c.text || "").join("\n")
          : msg.content;
        chatMessages.push({ role: msg.role, content: textContent });
      }
    }

    // Web tools: scrape/search intent -> WEB CONTEXT system message before the
    // last user message. Never throws; x-web-tools / WEB_TOOLS_MODE opt-outs apply.
    if (chatMessages.length > 0) {
      const enhancement = await maybeEnhanceMessages(chatMessages, req.headers);
      chatMessages = enhancement.messages;
      if (enhancement.summary) console.log(`[web-tools] ${enhancement.summary}`);
      else if (enhancement.note) console.log(`[web-tools] skipped: ${enhancement.note}`);
    }

    const route = await resolveModelRouteWithConfig(model || "auto:best");
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    const res = await executeChatCompletion(
      {
        model: model || route.targetModel.id,
        messages: chatMessages,
        stream: false,
        max_tokens: max_tokens || 2048,
      },
      route,
      clientIp
    );

    const data: any = await res.json();
    if (!res.ok) {
      return Response.json(
        {
          type: "error",
          error: {
            type: data?.error?.code || "api_error",
            message: data?.error?.message || "The upstream model request failed.",
          },
        },
        { status: res.status, headers: corsHeaders }
      );
    }

    const responseText = data.choices?.[0]?.message?.content || "";

    const anthropicFormat = {
      id: `msg_${Math.random().toString(36).substring(2, 14)}`,
      type: "message",
      role: "assistant",
      content: [
        {
          type: "text",
          text: responseText,
        },
      ],
      model: model || "claude-3-5-sonnet",
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: {
        input_tokens: data.usage?.prompt_tokens || 25,
        output_tokens: data.usage?.completion_tokens || 75,
      },
    };

    return Response.json(anthropicFormat, { headers: corsHeaders });
  } catch (err: any) {
    return Response.json({ error: { message: err?.message || "Internal error" } }, { status: 500, headers: corsHeaders });
  }
}
