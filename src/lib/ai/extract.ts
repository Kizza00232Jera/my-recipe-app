import "server-only";

export type PageContent = {
  host: string;
  title: string;
  text: string;
  jsonLd: unknown | null; // a schema.org Recipe object if found
  ogImage: string | null;
};

const MAX_TEXT = 7000;

/**
 * Fetches a URL and pulls out the bits useful for recipe parsing:
 *  - any schema.org "Recipe" JSON-LD block (most recipe sites have this — huge
 *    accuracy boost),
 *  - the og:image,
 *  - a cleaned-up plain-text version of the body as a fallback.
 *
 * NOTE: many sites (notably Instagram) block server-side scraping or hide the
 * content behind JS. For those, the reliable path is the user pasting the
 * caption/text instead — handled by the "text" import mode.
 */
export async function fetchPageContent(url: string): Promise<PageContent> {
  let host = "";
  try {
    host = new URL(url).host.replace(/^www\./, "");
  } catch {
    throw new Error("That doesn't look like a valid URL.");
  }

  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; RecipeImporter/1.0; +https://example.com/bot)",
      accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Couldn't open that page (HTTP ${res.status}).`);

  const html = await res.text();

  return {
    host,
    title: extractTitle(html),
    jsonLd: extractRecipeJsonLd(html),
    ogImage: extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image"),
    text: htmlToText(html).slice(0, MAX_TEXT),
  };
}

function extractTitle(html: string): string {
  const og = extractMeta(html, "og:title");
  if (og) return og;
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].trim()) : "";
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeEntities(m[1]);
  }
  return null;
}

function extractRecipeJsonLd(html: string): unknown | null {
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    try {
      const parsed = JSON.parse(b[1].trim());
      const found = findRecipeNode(parsed);
      if (found) return found;
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return null;
}

function findRecipeNode(node: unknown): unknown | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const f = findRecipeNode(item);
      if (f) return f;
    }
    return null;
  }
  const obj = node as Record<string, unknown>;
  const type = obj["@type"];
  const isRecipe = Array.isArray(type)
    ? type.includes("Recipe")
    : type === "Recipe";
  if (isRecipe) return obj;
  if (obj["@graph"]) return findRecipeNode(obj["@graph"]);
  return null;
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<\/(p|div|li|h[1-6]|br|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)));
}
