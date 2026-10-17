import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const providerKeys = pgTable("provider_keys", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(), // 'groq' | 'cerebras' | 'gemini' | 'mistral' | 'openrouter' | 'cohere' | 'cloudflare' | 'huggingface' | 'nvidia' | 'custom'
  label: text("label").notNull(),
  apiKey: text("api_key").notNull(), // Encrypted/masked or secure representation
  customBaseUrl: text("custom_base_url"),
  isActive: boolean("is_active").default(true).notNull(),
  rpmLimit: integer("rpm_limit").default(30).notNull(),
  tpmLimit: integer("tpm_limit").default(50000).notNull(),
  rpdLimit: integer("rpd_limit").default(14400).notNull(),
  currentRpm: integer("current_rpm").default(0).notNull(),
  currentRpd: integer("current_rpd").default(0).notNull(),
  status: text("status").default("healthy").notNull(), // 'healthy' | 'rate_limited' | 'cooling_down' | 'error'
  lastTestedAt: timestamp("last_tested_at"),
  cooldownUntil: timestamp("cooldown_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const unifiedKeys = pgTable("unified_keys", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  requestsCount: integer("requests_count").default(0).notNull(),
  tokensUsed: integer("tokens_used").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
});

export const routingConfig = pgTable("routing_config", {
  id: serial("id").primaryKey(),
  strategy: text("strategy").default("priority").notNull(), // 'priority' | 'latency' | 'reliability' | 'round_robin' | 'capability'
  fallbackChain: jsonb("fallback_chain").default(["groq", "cerebras", "gemini", "mistral", "openrouter", "cohere"]).notNull(),
  cooldownSeconds: integer("cooldown_seconds").default(60).notNull(),
  maxRetries: integer("max_retries").default(3).notNull(),
  stickySessions: boolean("sticky_sessions").default(true).notNull(),
  sessionTimeoutMinutes: integer("session_timeout_minutes").default(30).notNull(),
  activeProfile: text("active_profile").default("auto:default").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const modelConfig = pgTable("model_config", {
  id: serial("id").primaryKey(),
  modelId: text("model_id").notNull().unique(),
  enabled: boolean("enabled").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  displayName: text("display_name"),
  contextOverride: integer("context_override"),
  capabilityTier: text("capability_tier"),
  rpmOverride: integer("rpm_override"),
  rpdOverride: integer("rpd_override"),
  tpmOverride: integer("tpm_override"),
  tpdOverride: integer("tpd_override"),
  toolsEnabled: boolean("tools_enabled").default(true).notNull(),
  visionEnabled: boolean("vision_enabled").default(false).notNull(),
  inChain: boolean("in_chain").default(true).notNull(),
  aliases: jsonb("aliases").default([]).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const requestLogs = pgTable("request_logs", {
  id: serial("id").primaryKey(),
  modelRequested: text("model_requested").notNull(),
  providerUsed: text("provider_used").notNull(),
  modelUsed: text("model_used").notNull(),
  promptTokens: integer("prompt_tokens").default(0).notNull(),
  completionTokens: integer("completion_tokens").default(0).notNull(),
  totalTokens: integer("total_tokens").default(0).notNull(),
  latencyMs: integer("latency_ms").default(0).notNull(),
  ttftMs: integer("ttft_ms").default(0).notNull(),
  statusCode: integer("status_code").default(200).notNull(),
  isFallback: boolean("is_fallback").default(false).notNull(),
  fallbackAttempts: integer("fallback_attempts").default(0).notNull(),
  clientIp: text("client_ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
