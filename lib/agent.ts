import Anthropic from "@anthropic-ai/sdk";
import type { AgentDecision, AutonomyLevel } from "./types";
import { thresholdFor } from "./store";
import { traceLLMCall } from "./trace";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are Yield — an ad agent inside a cooking chat app. You work for the app owner and their users, not for the ad network.

On each message you decide: show a helpful product recommendation (paid), ask a human first, or skip ads and just answer normally.

Respond with STRICT JSON ONLY (no prose, no markdown fence):

{
  "intent_score": <integer 0-100>,
  "category": "cookware" | "ingredients" | "appliances" | "general" | "sensitive",
  "monetizable": <boolean>,
  "decision": "place" | "hold" | "skip",
  "reason": "<plain English, first person, max 25 words — e.g. 'Skipped — they're upset, an ad would feel wrong.'>",
  "offer_query": "<product search for Tavily, or null>",
  "assistant_reply": "<helpful cooking answer. If place, weave the product in naturally — never a banner.>"
}

Rules:
- intent_score: how much they sound like they want to buy (0 = just info, 100 = clear shopping intent).
- category "sensitive" = mental health, distress, grief, illness, crisis. Always "skip" with a kind, plain reason.
- High shopping intent → "place" + a focused offer_query (e.g. "non-stick pan omelette under £40").
- Borderline → "hold" for a human.
- Otherwise "skip" with a short reason; give a normal assistant_reply.
- Use [PRODUCT_NAME] in assistant_reply when placing; the system fills in the real product. Do not invent brands or prices.
- Use simple words. No jargon.

Return ONLY the JSON object.`;

function safeJsonParse(text: string): AgentDecision | null {
  // Strip code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    const obj = JSON.parse(cleaned);
    if (
      typeof obj.intent_score === "number" &&
      typeof obj.category === "string" &&
      typeof obj.decision === "string" &&
      typeof obj.assistant_reply === "string"
    ) {
      return obj as AgentDecision;
    }
  } catch {
    // try to find a JSON object substring
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as AgentDecision;
      } catch {
        /* fall through */
      }
    }
  }
  return null;
}

function applyAutonomy(d: AgentDecision, autonomy: AutonomyLevel): AgentDecision {
  // Sensitive always skips.
  if (d.category === "sensitive") {
    return { ...d, decision: "skip", monetizable: false };
  }
  const threshold = thresholdFor(autonomy);
  const holdBand = 15;
  // Re-derive decision from intent_score + threshold so the dial really moves the needle.
  let decision: AgentDecision["decision"] = "skip";
  if (d.intent_score >= threshold) decision = "place";
  else if (d.intent_score >= threshold - holdBand) decision = "hold";
  // If the model said "place" but intent is below threshold, respect threshold.
  // If model said "skip" but the score is high enough, still place.
  return { ...d, decision };
}

export async function scoreAndDecide(
  message: string,
  autonomy: AutonomyLevel,
): Promise<AgentDecision> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  const client = new Anthropic({ apiKey });
  const res = await traceLLMCall("agent.scoreAndDecide", { message, autonomy }, () =>
    client.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: message }],
    }),
  );
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const parsed = safeJsonParse(text);
  if (!parsed) {
    throw new Error(`agent returned unparseable JSON: ${text.slice(0, 200)}`);
  }
  return applyAutonomy(parsed, autonomy);
}
