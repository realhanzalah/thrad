"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Conversion, Placement } from "@/lib/types";
import { thradConversion, thradEvent } from "@/lib/thrad";
import { Btn, Card, fmtGbp, Label } from "./ui";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      placement: Placement;
      alreadyConverted: boolean;
    };

function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="relative px-6 md:px-8 py-8 md:py-10 border-b-4 border-foreground section-inverted texture-lines-inverted">
        <div className="relative mx-auto max-w-lg w-full">
          <Label className="text-background/60">Yield demo</Label>
          <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight text-background mt-2">
            Checkout
          </h1>
        </div>
      </header>
      <div className="flex-1 px-6 md:px-8 py-10 md:py-12 demo-texture-grid">{children}</div>
    </div>
  );
}

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-label text-xs uppercase tracking-widest text-muted-foreground">
          Loading product…
        </p>
      </div>
    );
  }

  if (load.status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-background">
        <Card className="p-8 max-w-md w-full text-center border-2">
          <p className="text-base leading-relaxed">{load.message}</p>
          <Link
            href="/demo"
            className="mt-6 inline-block text-sm underline underline-offset-4 hover:no-underline focus-ring"
          >
            Back to chat →
          </Link>
        </Card>
      </div>
    );
  }

  const { placement, alreadyConverted } = load;
  const offer = placement.offer;

  if (done || alreadyConverted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Card className="p-10 max-w-md w-full text-center border-2">
            <span className="mx-auto mb-6 flex h-12 w-12 items-center justify-center border-2 border-foreground bg-foreground text-background text-xl">
              ✓
            </span>
            <h1 className="font-display text-3xl font-medium tracking-tight">
              Order confirmed
            </h1>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Thank you for your purchase.
            </p>
            {done && (
              <p className="mt-6 font-display text-4xl tabular-nums tracking-tight">
                {fmtGbp(done.value)}
              </p>
            )}
            <Link
              href="/demo"
              className="mt-8 inline-flex w-full items-center justify-center border-2 border-foreground bg-foreground text-background px-8 py-4 font-label text-sm uppercase tracking-widest transition-colors duration-100 hover:bg-background hover:text-foreground focus-ring min-h-[44px]"
            >
              Back to chat →
            </Link>
          </Card>
        </div>
        <footer className="border-t-4 border-foreground bg-foreground py-4 text-center">
          <p className="font-label text-xs uppercase tracking-widest text-background/70">
            Yield · Demo checkout
          </p>
        </footer>
      </div>
    );
  }

  return (
    <CheckoutShell>
      <div className="mx-auto max-w-lg w-full">
        <Link
          href="/demo"
          className="font-label text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground focus-ring"
        >
          ← Back to chat
        </Link>

        <p className="mt-6 text-base text-muted-foreground leading-relaxed max-w-prose">
          Real product link from search. Purchase is only recorded when you confirm below.
        </p>

        <Card className="mt-8 p-6 border-2">
          <Label>Product</Label>
          <h2 className="mt-2 font-display text-xl font-medium leading-snug pr-4">
            {offer.title}
          </h2>
          {offer.price && (
            <p className="mt-4 text-2xl font-medium tabular-nums">{offer.price}</p>
          )}
          {offer.merchant && (
            <p className="mt-3 font-label text-xs uppercase tracking-widest text-muted-foreground">
              {offer.merchant}
            </p>
          )}
          {offer.snippet && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed border-l-4 border-foreground pl-4">
              {offer.snippet}
            </p>
          )}
          <p className="mt-4 font-label text-[10px] text-muted-foreground break-all border-t border-border-light pt-4">
            {offer.url}
          </p>
        </Card>

        <ol className="mt-8 space-y-3">
          <li>
            <Btn variant="primary" className="w-full py-4" onClick={visitStore}>
              {visitedStore ? "1 · Visit store again →" : "1 · Visit store →"}
            </Btn>
          </li>
          <li>
            <Btn
              className="w-full py-4"
              onClick={confirmPurchase}
              disabled={!visitedStore || confirming}
            >
              {confirming ? "Recording…" : "2 · Confirm purchase"}
            </Btn>
          </li>
        </ol>

        <div className="mt-8 border border-foreground bg-muted p-5">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Step 1 opens the merchant (logs a click). Step 2 records the sale — same as a
            postback on the store&apos;s thank-you page. In production this can come from Thrad.
          </p>
        </div>
      </div>
    </CheckoutShell>
  );
}
