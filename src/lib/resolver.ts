import { ALL_MODELS, ModelDefinition } from "./models-data";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  tools?: any[];
  tool_choice?: any;
  user?: string;
}

export interface ResolvedRoute {
  targetModel: ModelDefinition;
  fallbackChain: ModelDefinition[];
  provider: string;
  isAuto: boolean;
  profileName?: string;
}

// Map common client model names to catalog models
export function resolveModelRoute(modelInput?: string): ResolvedRoute {
  const modelName = (modelInput || "auto:best").trim().toLowerCase();

  // If auto profile
  if (
    modelName === "auto:best" ||
    modelName === "default" ||
    modelName.includes("gpt-4") ||
    modelName.includes("claude-3-5")
  ) {
    const primary = ALL_MODELS.find((m) => m.id === "groq/llama-3.3-70b-versatile") || ALL_MODELS[0];
    const chain = ALL_MODELS.filter((m) =>
      [
        "groq/llama-3.3-70b-versatile",
        "cerebras/llama-3.3-70b",
        "gemini/gemini-2.5-flash",
        "mistral/mistral-small-latest",
      ].includes(m.id)
    );
    return {
      targetModel: primary,
      fallbackChain: chain,
      provider: primary.provider,
      isAuto: true,
      profileName: "auto:best",
    };
  }

  if (modelName === "auto:fastest" || modelName.includes("instant") || modelName.includes("gpt-3.5")) {
    const primary = ALL_MODELS.find((m) => m.id === "cerebras/llama-3.1-8b") || ALL_MODELS[1];
    const chain = ALL_MODELS.filter((m) =>
      ["cerebras/llama-3.1-8b", "groq/llama-3.1-8b-instant", "cerebras/llama-3.3-70b"].includes(m.id)
    );
    return {
      targetModel: primary,
      fallbackChain: chain,
      provider: primary.provider,
      isAuto: true,
      profileName: "auto:fastest",
    };
  }

  if (
    modelName === "auto:coding" ||
    modelName.includes("code") ||
    modelName.includes("codestral") ||
    modelName.includes("qwen-coder")
  ) {
    const primary = ALL_MODELS.find((m) => m.id === "mistral/codestral-latest") || ALL_MODELS[0];
    const chain = ALL_MODELS.filter((m) =>
      ["mistral/codestral-latest", "openrouter/qwen/qwen-2.5-coder-32b-instruct:free", "groq/llama-3.3-70b-versatile"].includes(m.id)
    );
    return {
      targetModel: primary,
      fallbackChain: chain,
      provider: primary.provider,
      isAuto: true,
      profileName: "auto:coding",
    };
  }

  if (
    modelName === "auto:reasoning" ||
    modelName.includes("reasoning") ||
    modelName.includes("r1") ||
    modelName.includes("o1") ||
    modelName.includes("o3")
  ) {
    const primary = ALL_MODELS.find((m) => m.id === "groq/deepseek-r1-distill-llama-70b") || ALL_MODELS[0];
    const chain = ALL_MODELS.filter((m) =>
      ["groq/deepseek-r1-distill-llama-70b", "openrouter/deepseek/deepseek-r1:free", "gemini/gemini-1.5-pro"].includes(m.id)
    );
    return {
      targetModel: primary,
      fallbackChain: chain,
      provider: primary.provider,
      isAuto: true,
      profileName: "auto:reasoning",
    };
  }

  if (modelName === "auto:vision" || modelName.includes("vision") || modelName.includes("pixtral")) {
    const primary = ALL_MODELS.find((m) => m.id === "gemini/gemini-2.5-flash") || ALL_MODELS[0];
    const chain = ALL_MODELS.filter((m) =>
      ["gemini/gemini-2.5-flash", "mistral/pixtral-12b"].includes(m.id)
    );
    return {
      targetModel: primary,
      fallbackChain: chain,
      provider: primary.provider,
      isAuto: true,
      profileName: "auto:vision",
    };
  }

  // Exact ID match or partial match
  const exact = ALL_MODELS.find((m) => m.id.toLowerCase() === modelName);
  if (exact) {
    return {
      targetModel: exact,
      fallbackChain: [exact],
      provider: exact.provider,
      isAuto: false,
    };
  }

  // Substring match
  const match = ALL_MODELS.find((m) => m.id.toLowerCase().includes(modelName) || m.name.toLowerCase().includes(modelName));
  if (match) {
    return {
      targetModel: match,
      fallbackChain: [match],
      provider: match.provider,
      isAuto: false,
    };
  }

  // Fallback to primary default
  const defaultModel = ALL_MODELS.find((m) => m.id === "groq/llama-3.3-70b-versatile") || ALL_MODELS[0];
  return {
    targetModel: defaultModel,
    fallbackChain: [defaultModel],
    provider: defaultModel.provider,
    isAuto: false,
  };
}
