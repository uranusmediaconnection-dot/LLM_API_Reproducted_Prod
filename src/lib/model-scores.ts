import { ALL_MODELS, ModelDefinition } from "./models-data";

/**
 * Deterministic scoring priors derived from catalog data, matching the
 * original router's column model: Reliability / Speed / Intelligence /
 * Guardrails / composite Score (0-1). Live reliability overrides the prior
 * once a model has enough logged requests.
 */

export interface ModelScores {
  speed: number; // 0-100
  intelligence: number; // 0-100
  reliabilityPrior: number; // 0-100
  guardrails: number | null; // null = "—" (no guardrail tier)
  score: number; // 0-1 composite
}

const CATEGORY_INTELLIGENCE: Record<ModelDefinition["category"], number> = {
  chat: 52,
  coding: 66,
  reasoning: 78,
  vision: 62,
};

const STATUS_RELIABILITY: Record<ModelDefinition["status"], number> = {
  operational: 85,
  degraded: 55,
  maintenance: 25,
};

export function speedScore(m: ModelDefinition): number {
  return Math.min(100, Math.round(m.tokensPerSecond / 20));
}

export function intelligenceScore(m: ModelDefinition): number {
  const contextBonus = Math.min(25, Math.round((m.contextWindow / 400000) * 25));
  return Math.min(100, CATEGORY_INTELLIGENCE[m.category] + contextBonus);
}

export function reliabilityPrior(m: ModelDefinition): number {
  return STATUS_RELIABILITY[m.status];
}

export function guardrailsScore(m: ModelDefinition): number | null {
  const f = m.features.join(" ").toLowerCase();
  if (f.includes("safety") || f.includes("guard") || f.includes("moderation")) return 80;
  return null;
}

export function staticScores(m: ModelDefinition): ModelScores {
  const speed = speedScore(m);
  const intelligence = intelligenceScore(m);
  const reliabilityPrior = STATUS_RELIABILITY[m.status];
  const guardrails = guardrailsScore(m);
  const score = 0.35 * reliabilityPrior + 0.25 * speed + 0.4 * intelligence;
  return { speed, intelligence, reliabilityPrior, guardrails, score: score / 100 };
}

/** Composite score with an optional live reliability override (0-100). */
export function compositeScore(m: ModelDefinition, liveReliability?: number | null): number {
  const s = staticScores(m);
  const reliability = liveReliability ?? s.reliabilityPrior;
  return (0.35 * reliability + 0.25 * s.speed + 0.4 * s.intelligence) / 100;
}

/** Modality tabs mirroring the original /models/<type> routes. */
export const MODEL_TYPES = [
  { id: "chat", label: "Chat models" },
  { id: "coding", label: "Code Specialists" },
  { id: "reasoning", label: "Deep Reasoning" },
  { id: "vision", label: "Multimodal & Vision" },
] as const;

export type ModelType = (typeof MODEL_TYPES)[number]["id"];

export function isValidModelType(type: string): type is ModelType {
  return MODEL_TYPES.some((t) => t.id === type);
}

export function modelsForType(type: ModelType): ModelDefinition[] {
  return ALL_MODELS.filter((m) => m.category === type);
}

export function findModelBySlug(slug: string): ModelDefinition | undefined {
  const decoded = decodeURIComponent(slug).toLowerCase();
  return ALL_MODELS.find((m) => m.id.toLowerCase() === decoded);
}

export function formatContext(ctx: number): string {
  if (ctx >= 1000000) return `${(ctx / 1000000).toFixed(1)}M`;
  return `${Math.round(ctx / 1024)}K`;
}

export function formatQuota(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}
