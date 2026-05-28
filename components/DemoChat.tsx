"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatResponse } from "@/lib/types";
import { thradEvent } from "@/lib/thrad";
import { Btn, Label } from "./ui";

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
    <section className="flex flex-col flex-1 min-h-screen bg-background">
      <header className="px-6 md:px-8 py-8 border-b-4 border-foreground relative">
        <div className="absolute inset-0 texture-lines pointer-events-none" aria-hidden />
        <div className="relative mx-auto max-w-2xl w-full">
          <Label>Yield demo</Label>
          <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight mt-2">
            Cooking Assistant
          </h1>
          <div className="mt-4 flex items-center gap-2">
            <span className="block w-12 border-t-4 border-foreground" />
            <span className="block w-3 h-3 border border-foreground shrink-0" />
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 md:px-8 py-8 demo-texture-grid"
      >
        <div className="mx-auto max-w-2xl w-full space-y-6">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[90%] sm:max-w-[85%]"
                  : "mr-auto max-w-[90%] sm:max-w-[85%]"
              }
            >
              <div
                className={
                  m.role === "user"
                    ? "border-2 border-foreground bg-foreground text-background px-5 py-4"
                    : "border border-foreground bg-background text-foreground px-5 py-4"
                }
              >
                <p className="whitespace-pre-wrap text-base leading-relaxed">{m.text}</p>
                {m.placement && (
                  <div className="mt-4 pt-4 border-t border-foreground">
                    <Label className="text-muted-foreground">Suggested product</Label>
                    <Link
                      href={`/demo/checkout?clickId=${encodeURIComponent(m.placement.clickId)}`}
                      className="mt-2 flex items-center justify-between gap-2 text-sm underline underline-offset-4 hover:no-underline focus-ring"
                    >
                      <span>
                        {m.placement.offer.title}
                        {m.placement.offer.price ? ` · ${m.placement.offer.price}` : ""}
                      </span>
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="mr-auto font-label text-xs uppercase tracking-widest text-muted-foreground">
              Thinking…
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t-4 border-foreground px-6 md:px-8 py-5"
      >
        <div className="mx-auto flex max-w-2xl w-full gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a cooking question…"
            disabled={busy}
            aria-label="Message"
            className="flex-1 bg-background border-0 border-b-2 border-foreground px-0 py-2.5 text-base placeholder:text-muted-foreground placeholder:italic focus:outline-none focus:border-b-[4px] focus-visible:border-b-[4px]"
          />
          <Btn
            type="submit"
            variant="primary"
            disabled={busy || !input.trim()}
            className="shrink-0 px-6"
          >
            Send →
          </Btn>
        </div>
      </form>
    </section>
  );
}
