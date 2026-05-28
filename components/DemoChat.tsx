"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BauhausBtn,
  BauhausCard,
  BauhausInput,
  BauhausLogo,
  IconArrowRight,
} from "@/components/demo/bauhaus-ui";
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
    <section className="flex flex-col flex-1 min-h-screen">
      <header className="relative border-b-2 lg:border-b-4 border-[#121212] bg-white px-4 sm:px-6 py-4 shadow-[0_4px_0_0_#121212]">
        <div className="mx-auto flex max-w-2xl w-full items-center gap-3">
          <BauhausLogo />
          <div>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#1040C0]">
              Yield Demo
            </p>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter leading-[0.95] text-[#121212]">
              Cooking Assistant
            </h1>
          </div>
          <span
            className="ml-auto hidden sm:block h-8 w-8 rotate-45 border-2 border-[#121212] bg-[#F0C020]"
            aria-hidden
          />
        </div>
      </header>

      <div
        ref={scrollRef}
        className="dot-grid flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8"
      >
        <div className="mx-auto max-w-2xl w-full space-y-4 sm:space-y-5">
          {messages.map((m, i) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[90%] sm:max-w-[85%]"
                  : "mr-auto max-w-[90%] sm:max-w-[85%]"
              }
            >
              {m.role === "user" ? (
                <div className="rounded-none border-2 border-[#121212] bg-[#F0C020] px-4 py-3 shadow-[4px_4px_0px_0px_#121212]">
                  <p className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-[#121212]">
                    {m.text}
                  </p>
                </div>
              ) : (
                <BauhausCard
                  className="p-4 sm:p-5"
                  corner={(["circle", "square", "triangle"] as const)[i % 3]}
                  cornerColor={
                    (["#D02020", "#1040C0", "#F0C020"] as const)[i % 3]
                  }
                >
                  <p className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-[#121212] pr-4">
                    {m.text}
                  </p>
                  {m.placement && (
                    <div className="mt-4 border-t-2 border-[#121212] pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#121212]/70 mb-2">
                        Suggested product
                      </p>
                      <Link
                        href={`/demo/checkout?clickId=${encodeURIComponent(m.placement.clickId)}`}
                        className="group inline-flex w-full items-center justify-between gap-2 rounded-none border-2 border-[#121212] bg-[#1040C0] px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[3px_3px_0px_0px_#121212] transition-all duration-200 hover:bg-[#1040C0]/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                      >
                        <span className="text-left normal-case font-medium tracking-normal">
                          {m.placement.offer.title}
                          {m.placement.offer.price
                            ? ` · ${m.placement.offer.price}`
                            : ""}
                        </span>
                        <IconArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  )}
                </BauhausCard>
              )}
            </div>
          ))}
          {busy && (
            <div className="mr-auto flex items-center gap-2 px-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#D02020] border border-[#121212]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#121212]/60">
                Thinking…
              </span>
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t-2 lg:border-t-4 border-[#121212] bg-white px-4 sm:px-6 py-4"
      >
        <div className="mx-auto flex max-w-2xl w-full gap-2 sm:gap-3">
          <BauhausInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a cooking question…"
            disabled={busy}
            aria-label="Message"
          />
          <BauhausBtn
            type="submit"
            variant="red"
            shape="pill"
            disabled={busy || !input.trim()}
            className="shrink-0 px-5 sm:px-6"
          >
            Send
          </BauhausBtn>
        </div>
      </form>
    </section>
  );
}
