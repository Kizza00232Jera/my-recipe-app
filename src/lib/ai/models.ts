// Client-safe registry of AI providers + their models. NO secrets here.
// Used by the BYOK settings UI and (server-side) by the provider adapters.

export type ProviderId = "anthropic" | "openai" | "google" | "mistral";

export type ModelInfo = { id: string; label: string };

export const AI_PROVIDERS: Record<
  ProviderId,
  { label: string; emoji: string; keyPlaceholder: string; keyUrl: string; models: ModelInfo[] }
> = {
  anthropic: {
    label: "Anthropic",
    emoji: "🟣",
    keyPlaceholder: "sk-ant-…",
    keyUrl: "console.anthropic.com",
    models: [
      { id: "claude-opus-4-8", label: "Claude Opus 4.8 — most capable" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 — balanced" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 — fastest & cheapest" },
    ],
  },
  openai: {
    label: "OpenAI",
    emoji: "🟢",
    keyPlaceholder: "sk-…",
    keyUrl: "platform.openai.com",
    models: [
      { id: "gpt-5", label: "GPT-5 — most capable" },
      { id: "gpt-5-mini", label: "GPT-5 mini — balanced" },
      { id: "gpt-4.1", label: "GPT-4.1 — economical" },
    ],
  },
  google: {
    label: "Google",
    emoji: "🔵",
    keyPlaceholder: "AIza…",
    keyUrl: "aistudio.google.com",
    models: [
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro — most capable" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash — fast & cheap" },
    ],
  },
  mistral: {
    label: "Mistral",
    emoji: "🟠",
    keyPlaceholder: "…",
    keyUrl: "console.mistral.ai",
    models: [
      { id: "mistral-large-latest", label: "Mistral Large" },
      { id: "mistral-small-latest", label: "Mistral Small" },
    ],
  },
};

export const PROVIDER_IDS = Object.keys(AI_PROVIDERS) as ProviderId[];

export const DEFAULT_MODEL: Record<ProviderId, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-5-mini",
  google: "gemini-2.5-flash",
  mistral: "mistral-large-latest",
};

export function modelLabel(provider: ProviderId, modelId: string): string {
  const m = AI_PROVIDERS[provider]?.models.find((x) => x.id === modelId);
  return m?.label.split(" — ")[0] ?? modelId;
}
