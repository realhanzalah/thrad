import { Suspense } from "react";
import OrderConfirm from "@/components/OrderConfirm";

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center text-zinc-500 text-sm">
          Loading…
        </div>
      }
    >
      <OrderConfirm />
    </Suspense>
  );
}
