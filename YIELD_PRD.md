# Yield — Product Requirements Document (Hackathon Build Spec)

> **For the build agent (Claude Code):** This is a ~3-hour hackathon MVP. Optimise for a *working, deployable, demo-able* build over completeness. Follow the **Build Rules** in §11 strictly — they are what keep this from breaking on stage. Build in the order in §10. Ship to Vercel after every milestone.

---

## 1. One-liner & positioning

**Yield is the autonomous yield-and-trust agent for AI publishers.** It sits on top of an ad exchange (Thrad), watches the conversations an AI app is already having, monetizes the high-intent moments, attributes every pound back to the exact prompt that earned it, and audits conversions before they become billing events — pausing for a one-tap human decision only when judgment is required.

**Mental model:** Thrad is the *exchange* (two-sided, optimises for fill + advertiser spend). **Yield is the publisher's brain that operates the exchange on the publisher's behalf** — a fiduciary agent with a duty to the publisher's revenue *and* their users, not to the network.

**The differentiating twist (use this voice everywhere, including the agent's decision copy):** Yield represents the publisher *against* the ad network. It will turn down profitable placements that hurt retention ("fiduciary refusal"), and it verifies the exchange's own billing rather than trusting it by default ("trust but verify your ad network").

**Hackathon track:** Track 02 — Sell-Side & Measurement (publisher side).

---

## 2. The problem (demo hook)

Tens of thousands of AI apps have real conversational traffic and zero revenue. Ads have arrived in AI, but the on-ramps target large players (six-figure minimum commitments) and the network optimises for itself. The indie builder with 10k users burning tokens has no simple, trustworthy way to turn conversations into money without degrading the product. Yield is that on-ramp + the agent that runs it safely.

---

## 3. What we're proving on screen (maps to judging rubric)

The whole product is **one loop, three gates**, all visible in **one screen, no tabs**:

1. **Front gate — monetize:** score prompt intent in real time, decide whether to place, and weave a real offer into the answer as a natural recommendation. *(Agent autonomy, product thinking.)*
2. **Attribution — prove ROI:** stitch chat → impression → click → conversion back to the exact prompt and show attributed revenue. *(Real-world applicability, measurement.)*
3. **Back gate — audit billing:** flag suspicious conversions and hold them for one-tap human confirmation before they bill. *(Safety & oversight design.)*

Rubric coverage to hit explicitly: Technical execution · Product thinking · Agent autonomy · UX clarity · Real-world applicability · Safety & oversight.

---

## 4. Demo vertical & scripted inputs

The host AI app is a **cooking assistant** (clean, legible commercial intent). Hardcode/seed these four scripted moments so the demo is deterministic:

| # | User message | Expected agent behaviour |
|---|---|---|
| 1 | "How long should I soft-boil an egg?" | **No monetize.** Agent stays invisible, normal helpful reply. Proves restraint. |
| 2 | "What's a good non-stick pan for omelettes under £40?" | **PLACE (GREEN).** High intent → Tavily-grounded real pan offer woven into reply → impression fired → earnings tick up. |
| 3 | "Honestly I've been too low to cook properly for weeks." | **SKIP (fiduciary refusal).** Sensitive → agent declines to monetize, states the fiduciary reason. |
| 4 | (Pre-seeded) a conversion with zero dwell / implausible latency | **HOLD (audit).** Back gate flags it → inline "confirm before billing?" card. |

The build must include a way to trigger #4 deterministically (a "simulate conversion" button that can inject a clean OR a suspicious conversion).

---

## 5. Architecture (keep it boring and unbreakable)

- **Single Next.js app (App Router, TypeScript), deployed to Vercel.**
- **No database.** All state is in-memory (a module-level store). This is a single-session demo; persistence is out of scope.
- The "agent" is server-side logic in API routes calling the Anthropic API.
- All external calls (Anthropic, Tavily, Thrad) are wrapped in try/catch with graceful fallbacks so a hiccup never blanks the UI.

### File structure (suggested)
```
/app
  /api/chat/route.ts          # run agent on a user message
  /api/click/route.ts         # simulate an ad click
  /api/conversion/route.ts    # inject a conversion (clean or suspicious) → runs back-gate audit
  /api/audit/confirm/route.ts # human approves a held conversion → bills it
  page.tsx                    # the single cockpit screen
/lib
  agent.ts                    # scoreAndDecide() — Anthropic call, strict JSON out
  tavily.ts                   # findOffer(query) — real grounded offer
  thrad.ts                    # collect(event) — real Thrad events, fire-and-forget
  audit.ts                    # scoreConversionTrust() — back-gate heuristics
  store.ts                    # in-memory attribution store + helpers
  trace.ts                    # Overmind wrap (bonus, optional)
  types.ts
/components
  ChatPanel.tsx               # left: the AI app
  YieldConsole.tsx            # right: ambient decision rail + earnings + autonomy dial
  RailItem.tsx                # expands into attribution chain / audit card
```

---

## 6. Real integrations (this is the point — no mocking the connections)

### 6.1 Anthropic (the agent's reasoning)
- SDK: `@anthropic-ai/sdk`. Env: `ANTHROPIC_API_KEY`.
- Model: `claude-sonnet-4-6` for the agent (swap to `claude-haiku-4-5-20251001` if latency matters for live scoring).
- The agent call must return **strict JSON only** (see §7 schema). Parse defensively; on parse failure, fall back to a "no monetize" decision so the chat never breaks.

### 6.2 Tavily (real offer grounding — the demand signal)
- Use Tavily search to find a **real, current** product/merchant/price for the intent. This is what makes the offer real rather than invented.
- REST: `POST https://api.tavily.com/search` with `Authorization: Bearer <TAVILY_API_KEY>`, body `{ query, max_results, ... }`. Env: `TAVILY_API_KEY`. **Confirm exact params against https://docs.tavily.com.** A JS SDK (`@tavily/core`) also exists — either is fine.
- `findOffer(query)` returns `{ title, url, price?, merchant?, snippet }`. On failure, fall back to one hardcoded plausible offer per category so the demo still lands.

### 6.3 Thrad (the real exchange/event spine — measurement & attribution)
- Auth: bearer token. Env: `THRAD_API_KEY`, `THRAD_TAG_ID` (format `adv_<name>_<id>`). **Get the publisher key/tag from the Thrad team on-site.**
- **Events API (confirmed):**
  ```
  POST https://events.thrad.ai/api/collect
  Authorization: Bearer <THRAD_API_KEY>
  Content-Type: application/json
  ```
  Body (only `event_name` required; send the IDs that make stitching work):
  ```json
  {
    "tag_id": "<THRAD_TAG_ID>",
    "event_name": "impression",
    "event_id": "evt_<uuid>",
    "timestamp": 1748275200,
    "session_id": "sess_<uuid>",
    "impression_id": "imp_<uuid>",
    "click_id": "clk_<uuid>",
    "attribution_type": "click",
    "params": { "content_id": "sku_123", "value": 0, "currency": "GBP" }
  }
  ```
  Returns `204 No Content` (fire-and-forget). Pass a stable `event_id` for idempotency.
- Fire three events across the loop, all to the same endpoint, carrying the join IDs:
  - `event_name: "impression"` when a placement is made (with `session_id` + `impression_id`).
  - `event_name: "click"` on click (with `click_id`).
  - **Conversion:** prefer Thrad's dedicated **Conversion API** at `https://tag-docs.thrad.ai/server-api/conversions` — **confirm its exact endpoint/shape against the docs** — carrying `click_id` + `session_id` + `value`. If time-constrained, fire a `event_name: "conversion"` event to `/api/collect` with the same IDs + value as a working stand-in.
- Helper `thrad.collect(event)`: awaited but non-blocking, wrapped in try/catch; a failed/`!204` response is logged and ignored, never thrown to the UI.
- **(Optional, if creds available on-site):** if Thrad exposes a publisher *serving* endpoint that returns an actual ad/offer, call it for the offer instead of Tavily and render that. Treat as an enhancement; Tavily-grounded offers + real Thrad events are the robust default.

### 6.4 Overmind (bonus — supervision/tracing)
- Goal: every agent decision is a **traced, supervised action** visible in `console.overmindlab.ai`. Pitch line: "every monetization decision our agent makes is traced and supervised in Overmind; their policy engine is our pass / hold / stop gate."
- Integrate via the Overmind JS/OTel SDK (see https://docs.overmindlab.ai). Wrap the agent's LLM calls so traces flow. **Minimal viable target:** init + traces appearing in the console. **Cut-line:** if the JS path is awkward in the time available, drop to "wrapped + traces visible" or cut entirely — do NOT let it block the core loop.

### 6.5 Cursor (bonus — build craft)
- Win this on velocity: the whole thing built with Composer 2.5 in one evening. No runtime SDK requirement.

### 6.6 Alpic (bonus — stretch, first to cut)
- If ahead of schedule: expose the intent scorer as an MCP server (TypeScript template) one-click-deployed on Alpic, so "any AI app connects via MCP." Otherwise omit.

---

## 7. The agent: decision contract

`agent.scoreAndDecide(message, sessionContext, autonomyLevel)` calls Anthropic and returns **strict JSON**:

```json
{
  "intent_score": 0,
  "category": "cookware | ingredients | appliances | general | sensitive",
  "monetizable": false,
  "decision": "place | hold | skip",
  "reason": "Short, first-person, fiduciary-voiced explanation of the decision.",
  "offer_query": "tavily search query, or null",
  "assistant_reply": "The natural answer to the user. If decision == place, weave the recommendation in naturally — never a banner."
}
```

Decision logic:
- **skip** if `category == "sensitive"` (mental health, financial distress, grief, health, minors, crisis) → fiduciary refusal regardless of intent. Reason e.g. *"Declined — placing here would erode trust and cost you more retention than the impression is worth."*
- **place** if `intent_score >= threshold(autonomyLevel)` and category is allowed.
- **hold** if intent is borderline (within a band just below threshold) → surfaces an inline approve/skip card in the rail.
- otherwise **no-op** (normal reply, agent invisible).
- `threshold` is set by the **autonomy dial**: Conservative (e.g. 80) / Balanced (65) / Aggressive (50). The dial is the headline human-in-the-loop control.

---

## 8. Attribution spine (data model)

Mint UUIDs and keep an in-memory map; this map **is** the attribution store.

```ts
type Placement = {
  impressionId: string; clickId: string; sessionId: string;
  turnId: string; prompt: string;            // the exact prompt that earned it
  offer: { title: string; url: string; price?: string; merchant?: string };
  intentScore: number; reason: string; ts: number;
};

type Conversion = {
  conversionId: string; clickId: string; sessionId: string;
  value: number; currency: string;
  signals: { dwellMs: number; latencyMs: number; repeatFingerprint: boolean; valueMismatch: boolean };
  auditStatus: "clean_auto_billed" | "held_for_review" | "human_confirmed" | "rejected";
  ts: number;
};

// store.ts holds: sessions, placements[byImpressionId], conversions[byConversionId], totals
```

**Stitch:** given a conversion's `clickId` → find the `Placement` → recover `sessionId`, `prompt`, `offer`, `intentScore`, `reason`. That reconstructed chain is the attribution view shown in the UI.

**Back gate (`audit.scoreConversionTrust`)** — simple heuristics, no ML:
- zero/near-zero dwell, implausibly low click→conversion latency, repeat fingerprint, or value mismatch ⇒ `held_for_review`.
- else ⇒ `clean_auto_billed` (and fire the conversion event immediately).
- Held conversions only fire the conversion event after `/api/audit/confirm`.

---

## 9. UI: one cockpit, ambient agent, inline approvals

**Single screen, two columns. No tabs, no modals that hide context.**

- **Left — ChatPanel:** the cooking assistant. Looks like a normal AI chat. Most turns produce only a reply.
- **Right — YieldConsole:**
  - **Top bar:** live **earnings counter** (animates on each conversion) + **autonomy dial** (Conservative / Balanced / Aggressive).
  - **Decision rail:** a reverse-chronological feed of agent decisions. Each item is compact by default:
    - *Place* → shows offer + intent score + one-line reason.
    - *Skip* → shows the fiduciary refusal reason (this is a feature, make it look intentional, not like an error).
    - *Hold* → inline **approve / skip** card.
  - **Attribution (same rail, expand-in-place):** when a conversion lands, the related rail item **expands inline** to show the stitched chain: `prompt → placement → click → conversion → £value`. No navigation.
  - **Audit (same rail):** a suspicious conversion turns its rail item into an inline **"This looks off — confirm before billing?"** card with the triggering signals and a one-tap confirm/reject.

Design: clean, minimal, confident (use the frontend-design conventions). The "wow" is that it's 99% silent and only asks for a human when judgment is needed — the opposite of a dashboard you have to go check.

---

## 10. Build order (≈3 hours) with cut-lines

1. **(15m) Scaffold + deploy empty to Vercel now.** Confirm the deploy pipeline before writing features. Collect all env keys.
2. **(45m) Core loop, stubbed offer.** ChatPanel + `/api/chat` + `agent.scoreAndDecide` returning strict JSON + render reply and a rail item. Hardcode the offer. Get GREEN/normal/SKIP rendering end-to-end. Redeploy.
3. **(30m) Tavily.** Replace the stub with real grounded offers.
4. **(30m) Thrad + attribution.** Mint IDs, in-memory store, fire real impression/click/conversion events, earnings counter, rail item → expand into stitched chain.
5. **(25m) Back gate + oversight.** `scoreConversionTrust`, the "simulate conversion (clean/suspicious)" trigger, inline audit card, `/api/audit/confirm`, autonomy dial wired to threshold. Overmind wrap if time.
6. **(15m) Polish + lock scripted prompts.** Make the four demo moments reliable.
7. **(30m) Record demo + write submission. Buffer.**

**Cut order if behind:** Alpic → Overmind (to minimal/none) → dedicated Conversion API (use conversion *event* instead) → Tavily (fallback offers). **Never cut:** chat → intent → native placement → attribution chain → audit card. That is the demo.

---

## 11. Build Rules (non-negotiable — these prevent on-stage failure)

1. **No database.** In-memory module state only.
2. **Every external call (Anthropic/Tavily/Thrad) in try/catch with a fallback.** A failure logs and degrades gracefully; it never throws to the UI or blanks the screen.
3. **Strict JSON from the model, parsed defensively.** On parse failure → default to a safe "no monetize / normal reply" so the chat keeps working.
4. **Deploy to Vercel after every milestone.** Never debug a first deploy at code-freeze.
5. **Scripted demo inputs are sacred.** The four moments in §4 must work deterministically. Don't rely on improvised prompts on stage.
6. **One screen.** No tabs; attribution and audit are states of the same rail item.
7. **Keep secrets server-side.** All third-party calls happen in API routes, never the browser.
8. **Time-box ruthlessly.** Honour the cut order in §10 over feature completeness.

---

## 12. Environment variables
```
ANTHROPIC_API_KEY=
TAVILY_API_KEY=
THRAD_API_KEY=
THRAD_TAG_ID=adv_<name>_<id>
OVERMIND_API_KEY=        # optional / bonus
```

---

## 13. Acceptance criteria (definition of done for the MVP)
- [ ] Deployed and reachable on a Vercel URL.
- [ ] Normal prompt → helpful reply, agent stays invisible.
- [ ] High-intent prompt → real Tavily-grounded offer woven into the reply; **real** Thrad impression event fired (`204`); earnings update.
- [ ] Sensitive prompt → fiduciary SKIP with a stated reason.
- [ ] A conversion stitches back to its originating prompt in an inline attribution chain.
- [ ] A suspicious conversion is held and requires one-tap human confirmation before billing.
- [ ] Autonomy dial visibly changes the monetize threshold.
- [ ] (Bonus) Overmind traces visible in console; (Bonus) Alpic MCP endpoint live.

---

## 14. Pitch close (for the demo voiceover)
"Real Thrad integration, live tonight. Yield is the brain every AI publisher needs on top of the exchange — an agent on *their* side of the table. It monetizes the long tail that Thrad's own fund is chasing, attributes every pound back to the prompt that earned it, and never lets a bad signal become a bad billing event without asking a human first. Agents run the money; humans hold the guardrails."
