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

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function DemoChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      text: "Hi — ask me anything about cooking.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
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
        if (!r.ok) throw new Error(data.error ?? "request failed");
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
          });
        }
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: uid(),
            role: "assistant",
            text: "Something went wrong. Please try again.",
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
      <header className="px-6 py-4 border-b border-zinc-800/60">
        <h1 className="font-semibold text-zinc-100">Cooking Assistant</h1>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-w-2xl mx-auto w-full"
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
              <div className="mt-3 pt-3 border-t border-zinc-800">
                <Link
                  href={`/demo/checkout?clickId=${encodeURIComponent(m.placement.clickId)}`}
                  className="text-sm text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                >
                  View product · {m.placement.offer.title}
                  {m.placement.offer.price ? ` (${m.placement.offer.price})` : ""}
                </Link>
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="mr-auto text-sm text-zinc-500 px-4">Thinking…</div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-zinc-800/60 px-6 py-4 flex gap-2 max-w-2xl mx-auto w-full"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a cooking question…"
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
