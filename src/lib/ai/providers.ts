import "server-only";

import type { ProviderId } from "@/lib/ai/models";

type LLMOpts = {
  provider: ProviderId;
  apiKey: string;
  model: string;
  system: string;
  user: string;
};

/**
 * Single entry point that calls the right provider with the user's own key and
 * returns the raw text response (expected to be JSON). Keys are used only for
 * this request and never persisted or logged.
 */
export async function callLLM(opts: LLMOpts): Promise<string> {
  switch (opts.provider) {
    case "anthropic":
      return callAnthropic(opts);
    case "openai":
      return callOpenAICompatible(opts, "https://api.openai.com/v1/chat/completions");
    case "mistral":
      return callOpenAICompatible(opts, "https://api.mistral.ai/v1/chat/completions");
    case "google":
      return callGemini(opts);
    default:
      throw new Error("Unknown AI provider.");
  }
}

async function callAnthropic({ apiKey, model, system, user }: LLMOpts): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw await providerError(res, "Anthropic");
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return (data.content ?? [])
    .map((c) => (c.type === "text" ? c.text ?? "" : ""))
    .join("")
    .trim();
}

async function callOpenAICompatible(
  { apiKey, model, system, user }: LLMOpts,
  endpoint: string
): Promise<string> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw await providerError(res, endpoint.includes("mistral") ? "Mistral" : "OpenAI");
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

async function callGemini({ apiKey, model, system, user }: LLMOpts): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 4096 },
    }),
  });
  if (!res.ok) throw await providerError(res, "Google");
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}

async function providerError(res: Response, name: string): Promise<Error> {
  let detail = "";
  try {
    const body = await res.text();
    detail = body.slice(0, 200);
  } catch {
    /* ignore */
  }
  if (res.status === 401 || res.status === 403)
    return new Error(`${name} rejected the API key. Check it in settings.`);
  if (res.status === 429) return new Error(`${name} rate limit hit. Try again shortly.`);
  return new Error(`${name} request failed (HTTP ${res.status}). ${detail}`);
}

/** Pulls the first balanced JSON object out of a model response. */
export function extractJson<T = unknown>(text: string): T {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = trimmed.indexOf("{");
  if (start === -1) throw new Error("The AI didn't return a recipe. Try again.");
  let depth = 0;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return JSON.parse(trimmed.slice(start, i + 1)) as T;
      }
    }
  }
  throw new Error("The AI response was incomplete. Try again.");
}

/**
 * Keyless AI-generated cover image (Pollinations). Always returns a usable,
 * hotlinkable URL — used as the final fallback when there's no source photo
 * and no Unsplash key, so every import gets a cover the user can keep or replace.
 */
export function generatedImageUrl(query: string): string {
  const prompt = `professional food photography of ${query}, plated and styled, appetising, natural soft light, shallow depth of field, high detail`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=800&nologo=true`;
}

/** Searches Unsplash for a cover photo. Returns a hotlinkable URL or null. */
export async function searchUnsplash(query: string, accessKey: string): Promise<string | null> {
  if (!accessKey) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&query=${encodeURIComponent(
        query
      )}`,
      { headers: { Authorization: `Client-ID ${accessKey}` } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: { urls?: { regular?: string } }[] };
    return data.results?.[0]?.urls?.regular ?? null;
  } catch {
    return null;
  }
}
