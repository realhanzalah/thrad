import { Suspense } from "react";
import Checkout from "@/components/Checkout";

function CheckoutFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="font-label text-xs uppercase tracking-widest text-muted-foreground">
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
