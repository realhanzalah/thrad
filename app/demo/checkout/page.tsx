import { Suspense } from "react";
import Checkout from "@/components/Checkout";

function CheckoutFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F0F0F0]">
      <span className="h-10 w-10 border-4 border-[#121212] border-t-[#F0C020] animate-spin" />
      <p className="text-xs font-bold uppercase tracking-widest text-[#121212]/60">
        Loading…
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <Checkout />
    </Suspense>
  );
}
