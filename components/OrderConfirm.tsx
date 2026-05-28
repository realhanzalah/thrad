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
          });
          setStatus("done");
        } else if (c.auditStatus === "held_for_review") {
          setStatus("held");
        } else {
          setStatus("done");
        }
      } catch {
        setStatus("error");
      }
    })();
  }, [clickId]);

  if (!clickId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Link href="/demo" className="text-emerald-400 text-sm underline">
          Back to chat
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
      {status === "loading" && (
        <p className="text-zinc-400 text-sm">Confirming order…</p>
      )}
      {status === "done" && (
        <>
          <h1 className="text-xl font-semibold text-zinc-100">Order confirmed</h1>
          <p className="mt-2 text-sm text-zinc-500">Thank you for your purchase.</p>
        </>
      )}
      {status === "held" && (
        <>
          <h1 className="text-xl font-semibold text-amber-200">Order received</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Pending review in the Yield console.
          </p>
        </>
      )}
      {status === "error" && (
        <p className="text-sm text-zinc-500">Could not confirm order.</p>
      )}
      <Link
        href="/demo"
        className="mt-8 text-sm text-emerald-400 hover:text-emerald-300 underline"
      >
        Back to chat
      </Link>
    </div>
  );
}
