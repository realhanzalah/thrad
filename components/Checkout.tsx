"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BauhausBtn,
  BauhausCard,
  BauhausDecor,
  BauhausLink,
  BauhausLogo,
  IconArrowLeft,
  IconCheck,
} from "@/components/demo/bauhaus-ui";
import type { Conversion, Placement } from "@/lib/types";
import { thradConversion, thradEvent } from "@/lib/thrad";
import { fmtGbp } from "./ui";

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
    <div className="min-h-screen flex flex-col">
      <header className="relative overflow-hidden border-b-2 lg:border-b-4 border-[#121212] bg-[#1040C0] px-4 sm:px-6 py-6 text-white">
        <BauhausDecor />
        <div className="relative mx-auto flex max-w-lg w-full items-center gap-3">
          <BauhausLogo />
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-[0.9]">
            Checkout
          </h1>
        </div>
      </header>
      <div className="flex-1 px-4 sm:px-6 py-8 sm:py-10">{children}</div>
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F0F0F0]">
        <span className="h-10 w-10 border-4 border-[#121212] border-t-[#F0C020] animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#121212]/60">
          Loading product…
        </p>
      </div>
    );
  }

  if (load.status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-[#F0F0F0]">
        <BauhausCard className="p-8 max-w-md w-full text-center" corner="triangle" cornerColor="#D02020">
          <p className="font-bold uppercase tracking-wide text-[#121212]">{load.message}</p>
          <BauhausLink href="/demo" variant="blue" className="mt-6 inline-flex">
            Back to chat
          </BauhausLink>
        </BauhausCard>
      </div>
    );
  }

  const { placement, alreadyConverted } = load;
  const offer = placement.offer;

  if (done || alreadyConverted) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F0C020]">
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8">
          <BauhausCard className="p-8 sm:p-10 max-w-md w-full text-center" corner="circle" cornerColor="#1040C0">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#121212] bg-[#D02020] text-white">
              <IconCheck className="h-6 w-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-[#121212]">
              Order confirmed
            </h1>
            <p className="mt-2 text-base font-medium text-[#121212]/80">
              Thank you for your purchase.
            </p>
            {done && (
              <p className="mt-4 text-3xl font-black tabular-nums text-[#1040C0]">
                {fmtGbp(done.value)}
              </p>
            )}
            <BauhausLink href="/demo" variant="red" className="mt-8 inline-flex w-full justify-center py-3">
              Back to chat
            </BauhausLink>
          </BauhausCard>
        </div>
        <footer className="border-t-4 border-[#121212] bg-[#121212] py-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">
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
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#121212]/70 hover:text-[#1040C0] transition-colors duration-200"
        >
          <IconArrowLeft className="h-3.5 w-3.5" />
          Back to chat
        </Link>

        <p className="mt-4 text-sm font-medium leading-relaxed text-[#121212]/80 max-w-prose">
          Real product link from search. Purchase is only recorded when you confirm below.
        </p>

        <BauhausCard className="mt-6 p-5 sm:p-6" corner="square" cornerColor="#F0C020">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#1040C0] mb-1">
            Product
          </p>
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight leading-snug text-[#121212] pr-6">
            {offer.title}
          </h2>
          {offer.price && (
            <p className="mt-3 text-2xl font-black tabular-nums text-[#D02020]">{offer.price}</p>
          )}
          {offer.merchant && (
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-[#121212]/50">
              {offer.merchant}
            </p>
          )}
          {offer.snippet && (
            <p className="mt-4 text-sm font-medium leading-relaxed text-[#121212]/75 border-l-4 border-[#F0C020] pl-3">
              {offer.snippet}
            </p>
          )}
          <p className="mt-4 text-[10px] text-[#121212]/45 break-all font-mono border-t-2 border-[#E0E0E0] pt-3">
            {offer.url}
          </p>
        </BauhausCard>

        <ol className="mt-8 space-y-3">
          <li>
            <BauhausBtn variant="blue" className="w-full py-3.5" onClick={visitStore}>
              {visitedStore ? "1 · Visit store again" : "1 · Visit store"}
            </BauhausBtn>
          </li>
          <li>
            <BauhausBtn
              variant="yellow"
              className="w-full py-3.5"
              onClick={confirmPurchase}
              disabled={!visitedStore || confirming}
            >
              {confirming ? "Recording…" : "2 · Confirm purchase"}
            </BauhausBtn>
          </li>
        </ol>

        <div className="mt-6 border-2 border-[#121212] bg-[#E0E0E0] p-4 shadow-[3px_3px_0px_0px_#121212]">
          <p className="text-xs font-medium leading-relaxed text-[#121212]/80">
            Step 1 opens the merchant (logs a click). Step 2 records the sale — same as a
            postback on the store&apos;s thank-you page. In production this can come from Thrad.
          </p>
        </div>
      </div>
    </CheckoutShell>
  );
}
