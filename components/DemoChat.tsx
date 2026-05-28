"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatResponse } from "@/lib/types";
import { thradEvent } from "@/lib/thrad";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  placement?: ChatResponse["placement"];
};

const TRY_THESE: { label: string; text: string }[] = [
  { label: "Egg timing", text: "How long should I soft-boil an egg?" },
  {
    label: "Pan under £40",
    text: "What's a good non-stick pan for omelettes under £40?",
  },
  {
    label: "Sensitive moment",
    text: "Honestly I've been too low to cook properly for weeks.",
  },
];

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function DemoChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      text: "Hi — I'm your cooking assistant. Ask me anything about food, kit, or technique.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || busy) return;
      setBusy(true);
      setMessages((m) => [...m, { id: uid(), role: "user", text: t }]);
      setInput("");
      try {
        const r = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: t }),
        });
        const data = (await r.json()) as ChatResponse & { error?: string };
        if (!r.ok) {
          throw new Error(data.error ?? "request failed");
        }
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: "assistant",
            text: data.assistantReply,
            placement: data.placement,
          },
        ]);
        if (data.placement) {
          thradEvent("contents_viewed", {
            content_id: data.placement.offer.url,
            impression_id: data.placement.impressionId,
            click_id: data.placement.clickId,
            session_id: data.placement.sessionId,
            turn_id: data.turnId,
            intent_score: data.decision.intent_score,
            category: data.decision.category,
            advertiser: data.placement.offer.merchant,
          });
        }
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: "assistant",
            text: "Sorry — something went wrong. Please try again.",
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  return (
    <section className="flex flex-col flex-1 min-h-screen bg-zinc-950">
      <header className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500">
            Sample app
          </div>
          <h1 className="font-semibold text-zinc-100">Cooking Assistant</h1>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {TRY_THESE.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => send(p.text)}
              disabled={busy}
              className="text-xs px-2.5 py-1.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40"
              title={p.text}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-w-3xl mx-auto w-full"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl bg-zinc-100 text-zinc-900 px-4 py-2.5"
                : "mr-auto max-w-[85%] rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 px-4 py-2.5"
            }
          >
            <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
              {m.text}
            </div>
            {m.placement && (
              <div className="mt-3 border-t border-zinc-800 pt-3 text-sm">
                <Link
                  href={`/demo/order?clickId=${encodeURIComponent(m.placement.clickId)}`}
                  className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                >
                  Complete purchase — {m.placement.offer.title}
                </Link>
                {m.placement.offer.merchant && (
                  <a
                    href={m.placement.offer.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block mt-1.5 text-xs text-zinc-500 hover:text-zinc-400"
                  >
                    Or view on {m.placement.offer.merchant}
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="mr-auto max-w-[85%] rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2.5 text-sm">
            Thinking…
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-zinc-800/60 px-6 py-4 flex gap-2 max-w-3xl mx-auto w-full"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about cooking…"
          disabled={busy}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-[15px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-900 text-sm font-medium disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </section>
  );
}
