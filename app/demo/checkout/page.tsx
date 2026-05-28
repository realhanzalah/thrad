import { Suspense } from "react";
import Checkout from "@/components/Checkout";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">
          Loading…
        </div>
      }
    >
      <Checkout />
    </Suspense>
  );
}
