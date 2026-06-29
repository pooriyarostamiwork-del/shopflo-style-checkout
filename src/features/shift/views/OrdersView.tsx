import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useShiftStore } from "../context/ShiftStoreContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, toPersianDigits } from "../data/format";
import type { ShiftOrder } from "../data/types";

const OrdersView = () => {
  const { user } = useAuth();
  const { store } = useShiftStore();
  const [orders, setOrders] = useState<ShiftOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !store) { setLoading(false); return; }
    supabase.from("shift_orders").select("*").eq("user_id", user.id).eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setOrders((data as any) || []); setLoading(false); });
  }, [user, store]);

  if (!user) {
    return <div className="text-sm text-[hsl(var(--shift-muted))]">برای مشاهده سفارش‌ها وارد حساب شوید.</div>;
  }
  if (loading) return <div className="text-sm text-[hsl(var(--shift-muted))]">در حال بارگذاری...</div>;
  if (orders.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold">سفارش‌های من</h1>
        <div className="rounded-xl border border-dashed border-[hsl(var(--shift-border))] p-10 text-center text-sm text-[hsl(var(--shift-muted))]">
          سفارشی ثبت نکرده‌اید.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">سفارش‌های من</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="p-4 rounded-xl bg-[hsl(var(--shift-surface))] border border-[hsl(var(--shift-border))]">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs text-[hsl(var(--shift-muted))]">شناسه: {toPersianDigits(o.id.slice(0, 8))}</div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--shift-primary)/0.1)] text-[hsl(var(--shift-primary))]">
                {o.status === "pending" ? "در انتظار تایید" : o.status}
              </span>
            </div>
            <div className="text-sm">{toPersianDigits(o.items.length)} کالا</div>
            <div className="text-sm font-semibold mt-1">{formatPrice(o.total)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersView;
