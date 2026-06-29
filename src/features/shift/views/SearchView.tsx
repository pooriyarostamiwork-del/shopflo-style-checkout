import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShiftStore } from "../context/ShiftStoreContext";
import ProductCard from "../components/ProductCard";
import type { ShiftProduct } from "../data/types";
import { Search } from "lucide-react";

const SearchView = () => {
  const { store } = useShiftStore();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ShiftProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!store) return;
    setLoading(true);
    const run = async () => {
      if (q.trim().length === 0) {
        const { data } = await supabase.from("shift_products").select("*").eq("store_id", store.id).limit(24);
        setResults((data as any) || []);
      } else {
        const { data } = await supabase.rpc("shift_hybrid_search", {
          p_store_id: store.id, p_query: q, p_embedding: null,
          p_category: null, p_subcategory: null, p_species: null,
          p_max_price: null, p_min_price: null, p_in_stock: null, p_limit: 24,
        });
        setResults(((data as any) || []) as ShiftProduct[]);
      }
      setLoading(false);
    };
    const t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [q, store]);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">جستجو در کاتالوگ</h1>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--shift-muted))]" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="چی می‌خوای؟"
          className="w-full pr-10 pl-4 py-3 rounded-xl bg-[hsl(var(--shift-surface))] border border-[hsl(var(--shift-border))] text-sm focus:outline-none focus:border-[hsl(var(--shift-primary))]"
        />
      </div>
      {loading && <div className="text-xs text-[hsl(var(--shift-muted))]">در حال جستجو...</div>}
      {!loading && results.length === 0 && (
        <div className="rounded-xl border border-dashed border-[hsl(var(--shift-border))] p-6 text-center text-sm text-[hsl(var(--shift-muted))]">
          محصولی یافت نشد.
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {results.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
};

export default SearchView;
