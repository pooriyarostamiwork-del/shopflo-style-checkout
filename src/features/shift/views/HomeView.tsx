import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ShiftProduct } from "../data/types";
import { useShiftStore } from "../context/ShiftStoreContext";
import ProductCard from "../components/ProductCard";

interface Props { onNavigate: (tab: string) => void; }

const HomeView = ({ onNavigate }: Props) => {
  const { store } = useShiftStore();
  const [featured, setFeatured] = useState<ShiftProduct[]>([]);
  const [trending, setTrending] = useState<ShiftProduct[]>([]);

  useEffect(() => {
    if (!store) return;
    supabase.from("shift_products").select("*").eq("store_id", store.id).eq("in_stock", true)
      .order("rating", { ascending: false }).limit(6)
      .then(({ data }) => setFeatured((data as any) || []));
    supabase.from("shift_products").select("*").eq("store_id", store.id).eq("in_stock", true)
      .order("review_count", { ascending: false }).limit(6)
      .then(({ data }) => setTrending((data as any) || []));
  }, [store]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-[hsl(var(--shift-primary)/0.15)] to-[hsl(var(--shift-accent)/0.05)] p-6 md:p-10">
        <div className="text-2xl md:text-4xl font-bold leading-tight">
          {store?.name_fa}
        </div>
        {store?.tagline_fa && <p className="mt-3 text-sm md:text-base text-[hsl(var(--shift-muted))]">{store.tagline_fa}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => onNavigate("chat")}
            className="px-5 py-2.5 rounded-full bg-[hsl(var(--shift-primary))] text-white text-sm font-medium">
            گفتگو با دستیار
          </button>
          <button onClick={() => onNavigate("search")}
            className="px-5 py-2.5 rounded-full bg-[hsl(var(--shift-surface))] text-[hsl(var(--shift-fg))] border border-[hsl(var(--shift-border))] text-sm">
            مرور کاتالوگ
          </button>
        </div>
        {store?.suggested_prompts && store.suggested_prompts.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {store.suggested_prompts.map((p, i) => (
              <button key={i} onClick={() => onNavigate("chat")}
                className="text-xs px-3 py-1.5 rounded-full bg-white/60 border border-[hsl(var(--shift-border))] text-[hsl(var(--shift-fg))]">
                {p}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Featured */}
      <section>
        <h2 className="text-base md:text-lg font-semibold mb-3">پیشنهاد ویژه</h2>
        {featured.length === 0
          ? <EmptyHint />
          : <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">{featured.map((p) => <ProductCard key={p.id} product={p} />)}</div>}
      </section>

      {/* Trending */}
      <section>
        <h2 className="text-base md:text-lg font-semibold mb-3">پرفروش‌ها</h2>
        {trending.length === 0
          ? <EmptyHint />
          : <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">{trending.map((p) => <ProductCard key={p.id} product={p} />)}</div>}
      </section>
    </div>
  );
};

const EmptyHint = () => (
  <div className="rounded-xl border border-dashed border-[hsl(var(--shift-border))] p-6 text-center text-sm text-[hsl(var(--shift-muted))]">
    هنوز محصولی در کاتالوگ ثبت نشده. از تب «مدیریت کاتالوگ» فایل CSV خودت رو آپلود کن.
  </div>
);

export default HomeView;
