import { ChatCompletionRequest, ResolvedRoute, logRequestUsage } from "./router-engine";
import { db } from "@/db";
import { providerKeys } from "@/db/schema";
import { eq } from "drizzle-orm";

const PROVIDER_ENDPOINTS: Record<string, string> = {
  groq: "https://api.groq.com/openai/v1/chat/completions",
  cerebras: "https://api.cerebras.ai/v1/chat/completions",
  mistral: "https://api.mistral.ai/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  cohere: "https://api.cohere.com/compatibility/v1/chat/completions",
  huggingface: "https://router.huggingface.co/v1/chat/completions",
  nvidia: "https://integrate.api.nvidia.com/v1/chat/completions",
  zhipu: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
};

type DispatchOptions = { apiKey?: string; customBaseUrl?: string | null };
type Credentials = { apiKey: string; customBaseUrl?: string | null };

function isConfiguredCredential(value?: string | null): value is string {
  return Boolean(
    value &&
      value.length > 10 &&
      !/(auto_configured|placeholder|example|changeme)/i.test(value)
  );
}

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function getCloudflareEndpoint(baseUrl?: string | null) {
  if (!baseUrl) return null;

  try {
    const url = new URL(baseUrl);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "api.cloudflare.com" ||
      !url.pathname.includes("/client/v4/accounts/") ||
      !url.pathname.endsWith("/ai/v1")
    ) {
      return null;
    }

    url.pathname = `${url.pathname.replace(/\/+$/, "")}/chat/completions`;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function errorResponse(status: number, message: string, code: string) {
  return Response.json(
    { error: { message, type: "api_error", code } },
    { status }
  );
}

async function getCredentials(provider: string): Promise<Credentials | null> {
  try {
    const storedKeys = await db
      .select({
        apiKey: providerKeys.apiKey,
        customBaseUrl: providerKeys.customBaseUrl,
        isActive: providerKeys.isActive,
      })
      .from(providerKeys)
      .where(eq(providerKeys.provider, provider));
    const stored = storedKeys.find(
      (candidate) => candidate.isActive && isConfiguredCredential(candidate.apiKey)
    );

    if (stored) {
      return { apiKey: stored.apiKey, customBaseUrl: stored.customBaseUrl };
    }
  } catch (error) {
    console.error("Provider credential lookup failed:", error);
  }

  const environmentKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  return isConfiguredCredential(environmentKey) ? { apiKey: environmentKey } : null;
}

export async function executeChatCompletion(
  req: ChatCompletionRequest,
  route: ResolvedRoute,
  clientIp = "127.0.0.1",
  options: DispatchOptions = {}
) {
  const startTime = Date.now();
  const promptText = req.messages
    .map((message) => `${message.role}: ${typeof message.content === "string" ? message.content : ""}`)
    .join("\n");
  const estimatedPromptTokens = estimateTokens(promptText);
  const candidates = route.isAuto && route.fallbackChain.length > 0
    ? route.fallbackChain
    : [route.targetModel];
  let lastFailure = {
    status: 503,
    message: `No valid API key is configured for ${route.provider}. Add an upstream provider key in the admin dashboard.`,
    code: "provider_not_configured",
    provider: route.provider,
    model: route.targetModel.id,
    fallbackAttempts: 0,
  };

  const logResult = async (result: {
    status: number;
    provider: string;
    model: string;
    completionTokens?: number;
    promptTokens?: number;
    fallbackAttempts: number;
  }) => {
    const completionTokens = result.completionTokens ?? 0;
    await logRequestUsage({
      modelRequested: req.model || route.targetModel.id,
      providerUsed: result.provider,
      modelUsed: result.model,
      promptTokens: result.promptTokens ?? estimatedPromptTokens,
      completionTokens,
      totalTokens: (result.promptTokens ?? estimatedPromptTokens) + completionTokens,
      latencyMs: Date.now() - startTime,
      ttftMs: Date.now() - startTime,
      statusCode: result.status,
      isFallback: result.fallbackAttempts > 0,
      fallbackAttempts: result.fallbackAttempts,
      clientIp,
    });
  };

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const provider = candidate.provider;
    const credentials = options.apiKey && index === 0
      ? { apiKey: options.apiKey, customBaseUrl: options.customBaseUrl }
      : await getCredentials(provider);

    lastFailure = {
      status: 503,
      message: `No valid API key is configured for ${provider}. Add an upstream provider key in the admin dashboard.`,
      code: "provider_not_configured",
      provider,
      model: candidate.id,
      fallbackAttempts: index,
    };

    if (!credentials || !isConfiguredCredential(credentials.apiKey)) {
      if (route.isAuto) continue;
      break;
    }

    const endpoint = provider === "cloudflare"
      ? getCloudflareEndpoint(credentials.customBaseUrl)
      : PROVIDER_ENDPOINTS[provider];
    if (!endpoint) {
      lastFailure = {
        status: 501,
        message: `The ${provider} provider does not have a supported chat-completions endpoint configured.`,
        code: "provider_not_supported",
        provider,
        model: candidate.id,
        fallbackAttempts: index,
      };
      if (route.isAuto) continue;
      break;
    }

    const model = candidate.id.includes("/")
      ? candidate.id.split("/").slice(1).join("/")
      : candidate.id;
    let upstreamResponse: Response;

    try {
      upstreamResponse = await fetch(endpoint, {
        method: "POST",
        signal: AbortSignal.timeout(120_000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${credentials.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: req.messages,
          stream: req.stream === true,
          temperature: req.temperature ?? 0.7,
          max_tokens: req.max_tokens ?? 2048,
          top_p: req.top_p ?? 1,
          ...(req.tools ? { tools: req.tools } : {}),
          ...(req.tool_choice ? { tool_choice: req.tool_choice } : {}),
        }),
      });
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "TimeoutError";
      lastFailure = {
        status: 502,
        message: timedOut
          ? `The ${provider} request timed out after 120 seconds.`
          : `Could not connect to the ${provider} API. Check provider availability and try again.`,
        code: timedOut ? "upstream_timeout" : "upstream_connection_failed",
        provider,
        model: candidate.id,
        fallbackAttempts: index,
      };
      if (route.isAuto) continue;
      break;
    }

    if (!upstreamResponse.ok) {
      const retryStatus = upstreamResponse.status === 401 || upstreamResponse.status === 403 ||
        upstreamResponse.status === 429 || upstreamResponse.status >= 500;
      const status = upstreamResponse.status >= 500 ? 502 : upstreamResponse.status;
      const code = upstreamResponse.status === 401 || upstreamResponse.status === 403
        ? "provider_key_rejected"
        : upstreamResponse.status === 429
          ? "provider_rate_limited"
          : "upstream_error";
      lastFailure = {
        status,
        message: `The ${provider} API returned HTTP ${upstreamResponse.status}. Check the key, model access, and provider quota.`,
        code,
        provider,
        model: candidate.id,
        fallbackAttempts: index,
      };
      if (route.isAuto && retryStatus) continue;
      break;
    }

    const responseHeaders = {
      "x-thesun-provider": provider,
      "x-thesun-model": candidate.id,
      "x-thesun-routed": route.isAuto ? "true" : "false",
      ...(index > 0 ? { "x-thesun-fallback": "true" } : {}),
    };

    if (req.stream) {
      await logResult({
        status: 200,
        provider,
        model: candidate.id,
        fallbackAttempts: index,
      });
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: {
          ...responseHeaders,
          "Content-Type": upstreamResponse.headers.get("content-type") ?? "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    let data: {
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };
    try {
      data = await upstreamResponse.json();
    } catch {
      lastFailure = {
        status: 502,
        message: `The ${provider} API returned an invalid response.`,
        code: "invalid_upstream_response",
        provider,
        model: candidate.id,
        fallbackAttempts: index,
      };
      if (route.isAuto) continue;
      break;
    }

    const promptTokens = data.usage?.prompt_tokens ?? estimatedPromptTokens;
    const completionTokens = data.usage?.completion_tokens ?? 0;
    await logResult({
      status: 200,
      provider,
      model: candidate.id,
      promptTokens,
      completionTokens,
      fallbackAttempts: index,
    });
    return Response.json(data, { headers: responseHeaders });
  }

  await logResult(lastFailure);
  return errorResponse(lastFailure.status, lastFailure.message, lastFailure.code);
}
