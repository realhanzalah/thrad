import type { Category, Offer } from "./types";

const TAVILY_URL = "https://api.tavily.com/search";

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
};

type TavilyResponse = {
  results?: TavilyResult[];
};

function extractPrice(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const m = text.match(/£\s?\d{1,4}(?:[.,]\d{2})?/);
  return m?.[0]?.replace(/\s/g, "");
}

export function parsePriceGbp(price?: string): number | undefined {
  if (!price) return undefined;
  const m = price.match(/[\d,.]+/);
  if (!m) return undefined;
  const n = parseFloat(m[0].replace(",", ""));
  return Number.isFinite(n) ? n : undefined;
}

function extractMerchant(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function isValidProductUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function scoreResult(r: TavilyResult): number {
  if (!r.title || !r.url || !isValidProductUrl(r.url)) return -1;
  let score = 0;
  const hay = `${r.title} ${r.content ?? ""} ${r.url}`.toLowerCase();
  if (/amazon|argos|john lewis|currys|lakeland|etsy|ebay|shop|buy|product/.test(hay))
    score += 3;
  if (extractPrice(r.content)) score += 2;
  if (!/wikipedia|reddit|youtube|quora|forum/.test(r.url)) score += 1;
  return score;
}

export async function findOffer(query: string, category: Category): Promise<Offer> {
  void category;
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set");
  if (!query) throw new Error("findOffer requires a query");

  const res = await fetch(TAVILY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: `${query} buy UK price`,
      max_results: 8,
      search_depth: "advanced",
      include_answer: false,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Tavily ${res.status}: ${body.slice(0, 200)}`);
  }
  const data: TavilyResponse = await res.json();
  const ranked = (data.results ?? [])
    .map((r) => ({ r, score: scoreResult(r) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0]?.r;
  if (!best?.title || !best.url) {
    throw new Error("Tavily returned no usable product links");
  }
  return {
    title: best.title,
    url: best.url,
    price: extractPrice(best.content),
    merchant: extractMerchant(best.url),
    snippet: best.content?.slice(0, 220),
  };
}
