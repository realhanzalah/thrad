"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Conversion, Placement } from "@/lib/types";
import { thradConversion, thradEvent } from "@/lib/thrad";
import { Btn, Card, fmtGbp } from "./ui";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      placement: Placement;
      alreadyConverted: boolean;
    };

export default function Checkout() {
  const searchParams = useSearchParams();
  const clickId = searchParams.get("clickId") ?? "";
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [visitedStore, setVisitedStore] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<Conversion | null>(null);

  useEffect(() => {
    if (!clickId) {
      setLoad({ status: "error", message: "Missing product reference." });
      return;
    }
    fetch(`/api/placement?clickId=${encodeURIComponent(clickId)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "not found");
        if (data.alreadyConverted) {
          setLoad({
            status: "ready",
            placement: data.placement,
            alreadyConverted: true,
          });
          setDone(data.conversion);
          return;
        }
        setLoad({
          status: "ready",
          placement: data.placement,
          alreadyConverted: false,
        });
      })
      .catch(() => setLoad({ status: "error", message: "Product not found." }));
  }, [clickId]);

  const visitStore = useCallback(async () => {
    if (load.status !== "ready") return;
    const { placement } = load;
    window.open(placement.offer.url, "_blank", "noopener,noreferrer");
    thradEvent("items_added", { click_id: clickId });
    await fetch("/api/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clickId }),
    });
    setVisitedStore(true);
  }, [clickId, load]);

  const confirmPurchase = useCallback(async () => {
    if (load.status !== "ready" || load.alreadyConverted) return;
    if (!visitedStore) return;
    setConfirming(true);
    try {
      const r = await fetch("/api/conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clickId, mode: "clean" }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "failed");
      const c = data.conversion as Conversion;
      if (c.auditStatus === "clean_auto_billed" || c.auditStatus === "human_confirmed") {
        thradConversion({
          order_id: c.conversionId,
          value: c.value,
          currency: c.currency,
          click_id: c.clickId,
        });
      }
      setDone(c);
    } catch {
      alert("Could not record purchase. Visit the store first, then confirm.");
    } finally {
      setConfirming(false);
    }
  }, [clickId, load, visitedStore]);

  if (load.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">
        Loading product…
      </div>
    );
  }

  if (load.status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-zinc-400">{load.message}</p>
        <Link href="/demo" className="text-emerald-400 text-sm underline">
          Back to chat
        </Link>
      </div>
    );
  }

  const { placement, alreadyConverted } = load;
  const offer = placement.offer;

  if (done || alreadyConverted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <Card className="p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-zinc-100">Order confirmed</h1>
          <p className="mt-2 text-sm text-zinc-400">Thank you for your purchase.</p>
          {done && (
            <p className="mt-4 text-lg tabular-nums text-emerald-300">
              {fmtGbp(done.value)}
            </p>
          )}
          <Link href="/demo" className="mt-6 inline-block text-sm text-emerald-400 underline">
            Back to chat
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <Link href="/demo" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Back to chat
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-100 tracking-tight">Checkout</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Real product link from search. Purchase is only recorded when you confirm below.
        </p>

        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-zinc-100 leading-snug">{offer.title}</h2>
          {offer.price && (
            <p className="mt-2 text-lg tabular-nums text-emerald-300">{offer.price}</p>
          )}
          {offer.merchant && (
            <p className="mt-1 text-xs text-zinc-500">{offer.merchant}</p>
          )}
          {offer.snippet && (
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{offer.snippet}</p>
          )}
          <p className="mt-3 text-[11px] text-zinc-600 break-all font-mono">{offer.url}</p>
        </Card>

        <div className="mt-6 space-y-3">
          <Btn variant="primary" className="w-full py-3" onClick={visitStore}>
            {visitedStore ? "Visit store again" : "1 · Visit store"}
          </Btn>
          <Btn
            className="w-full py-3"
            onClick={confirmPurchase}
            disabled={!visitedStore || confirming}
          >
            {confirming ? "Recording…" : "2 · Confirm purchase"}
          </Btn>
        </div>

        <p className="mt-4 text-xs text-zinc-600 leading-relaxed">
          Step 1 opens the merchant (logs a click). Step 2 records the sale — same as a
          postback on the store&apos;s thank-you page. In production this can come from Thrad.
        </p>
      </div>
    </div>
  );
}
