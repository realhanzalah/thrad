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

function extractMerchant(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return undefined;
  }
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
      query,
      max_results: 5,
      search_depth: "basic",
      include_answer: false,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Tavily ${res.status}: ${body.slice(0, 200)}`);
  }
  const data: TavilyResponse = await res.json();
  const first = data.results?.find((r) => r.title && r.url);
  if (!first?.title || !first.url) {
    throw new Error("Tavily returned no usable results");
  }
  return {
    title: first.title,
    url: first.url,
    price: extractPrice(first.content),
    merchant: extractMerchant(first.url),
    snippet: first.content?.slice(0, 220),
  };
}
