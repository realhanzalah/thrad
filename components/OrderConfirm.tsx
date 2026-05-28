"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Conversion } from "@/lib/types";
import { thradConversion, thradEvent } from "@/lib/thrad";

type Status = "loading" | "done" | "held" | "error";

export default function OrderConfirm() {
  const searchParams = useSearchParams();
  const clickId = searchParams.get("clickId") ?? "";
  const [status, setStatus] = useState<Status>("loading");
  const [detail, setDetail] = useState<string>("");
  const ran = useRef(false);

  useEffect(() => {
    if (!clickId || ran.current) return;
    ran.current = true;

    (async () => {
      try {
        thradEvent("items_added", { click_id: clickId });
        const clickRes = await fetch("/api/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clickId }),
        });
        if (!clickRes.ok) throw new Error("click failed");

        const convRes = await fetch("/api/conversion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clickId, mode: "clean" }),
        });
        if (!convRes.ok) throw new Error("conversion failed");
        const data = (await convRes.json()) as { conversion?: Conversion };
        const c = data.conversion;
        if (!c) throw new Error("no conversion");

        if (c.auditStatus === "clean_auto_billed") {
          thradConversion({
            order_id: c.conversionId,
            value: c.value,
            currency: c.currency,
            click_id: c.clickId,
            audit_status: c.auditStatus,
          });
          setStatus("done");
          setDetail(
            `Your order is confirmed. ${new Intl.NumberFormat("en-GB", {
              style: "currency",
              currency: "GBP",
            }).format(c.value)} was logged and counted.`,
          );
        } else if (c.auditStatus === "held_for_review") {
          setStatus("held");
          setDetail(
            "Your order is noted, but Yield flagged it for review before it counts toward earnings. Check the Yield console.",
          );
        } else {
          setStatus("done");
          setDetail("Order recorded.");
        }
      } catch {
        setStatus("error");
        setDetail("We could not record this order. Try again from the chat.");
      }
    })();
  }, [clickId]);

  if (!clickId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div>
          <p className="text-zinc-400">Missing order reference.</p>
          <Link href="/demo" className="mt-4 inline-block text-emerald-400 underline">
            Back to chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      {status === "loading" && (
        <>
          <div className="text-2xl font-semibold text-zinc-100">Processing…</div>
          <p className="mt-2 text-sm text-zinc-500">
            Confirming your purchase — same flow a real shop would use.
          </p>
        </>
      )}
      {status === "done" && (
        <>
          <div className="text-2xl font-semibold text-emerald-300">Thank you!</div>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{detail}</p>
        </>
      )}
      {status === "held" && (
        <>
          <div className="text-2xl font-semibold text-amber-300">Order received</div>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{detail}</p>
        </>
      )}
      {status === "error" && (
        <>
          <div className="text-2xl font-semibold text-zinc-300">Something went wrong</div>
          <p className="mt-2 text-sm text-zinc-500">{detail}</p>
        </>
      )}
      <div className="mt-8 flex flex-col gap-2 text-sm">
        <Link href="/demo" className="text-emerald-400 hover:text-emerald-300 underline">
          Back to cooking assistant
        </Link>
        <Link href="/" className="text-zinc-500 hover:text-zinc-400 underline">
          Open Yield console
        </Link>
      </div>
    </div>
  );
}
