import { AI_PROVIDERS, DEFAULT_MODEL, type ProviderId } from "@/lib/ai/models";

// User's BYOK settings. Stored ONLY in the browser's localStorage — keys never
// touch our database and are sent to the server action just-in-time for a single
// request, then forwarded to the chosen provider. Never logged.

export type ImageMode = "stock" | "generate";

export type AiSettings = {
  provider: ProviderId;
  keys: Partial<Record<ProviderId, string>>;
  model: string;
  unsplashKey: string;
  imageMode: ImageMode;
};

const STORAGE_KEY = "recipe-ai-settings:v1";

export function defaultSettings(): AiSettings {
  return {
    provider: "anthropic",
    keys: {},
    model: DEFAULT_MODEL.anthropic,
    unsplashKey: "",
    imageMode: "stock",
  };
}

export function loadSettings(): AiSettings {
  if (typeof window === "undefined") return defaultSettings();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as Partial<AiSettings>;
    const provider: ProviderId =
      parsed.provider && parsed.provider in AI_PROVIDERS ? parsed.provider : "anthropic";
    return {
      provider,
      keys: parsed.keys ?? {},
      model: parsed.model ?? DEFAULT_MODEL[provider],
      unsplashKey: parsed.unsplashKey ?? "",
      imageMode: parsed.imageMode === "generate" ? "generate" : "stock",
    };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(s: AiSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function activeKey(s: AiSettings): string {
  return (s.keys[s.provider] ?? "").trim();
}
