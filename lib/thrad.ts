// Client-side Thrad Tag integration.
//
// We use the publisher Tag (cdn.thrad.ai/tag.min.js) — no server-side API key
// required, just a tag_id. The agent decides server-side; the browser fires
// the actual Thrad events. This is the integration path Thrad recommends
// ("most start with the Tag" — tag-docs.thrad.ai).

export const THRAD_TAG_CDN = "https://cdn.thrad.ai/tag.min.js";

export function getPublicTagId(): string {
  // Exposed via env var (NEXT_PUBLIC_*) so it's readable client-side.
  return process.env.NEXT_PUBLIC_THRAD_TAG_ID || "adv_yield_demo";
}

// Tag event vocabulary (per https://tag-docs.thrad.ai/tag/events).
export type ThradEventName =
  | "contents_viewed" // we use this as the "impression" signal
  | "items_added" // we use this as the "click" signal
  | "checkout_started"
  | "order_created"
  | "lead_created"
  | "custom";

declare global {
  interface Window {
    thradTag?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  }
}

function safeCall(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  try {
    window.thradTag?.(...args);
  } catch (err) {
    console.error("[thrad] tag call threw", err);
  }
}

export function thradEvent(
  name: ThradEventName,
  props: Record<string, unknown>,
): void {
  safeCall("event", name, props);
}

export function thradConversion(props: {
  order_id: string;
  value: number;
  currency?: string;
  // extra props are passed through
  [k: string]: unknown;
}): void {
  safeCall("conversion", { currency: "GBP", ...props });
}
