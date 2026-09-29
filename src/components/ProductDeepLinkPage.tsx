import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Standalone PDP view driven by the `?p=<productId>` deep link.
 * Brand-agnostic: each storefront passes its table, row mapper and PDP renderer.
 */
interface ProductDeepLinkPageProps<P extends { id: string; name: string }> {
  productId: string;
  table: "products" | "pet_products";
  mapRow: (row: any) => P;
  initialProduct?: P | null;
  onBack: () => void;
  onAskAbout?: (product: P) => void;
  renderPDP: (product: P) => ReactNode;
  fullScreen?: boolean;
}

export function ProductDeepLinkPage<P extends { id: string; name: string }>({
  productId,
  table,
  mapRow,
  initialProduct,
  onBack,
  onAskAbout,
  renderPDP,
  fullScreen = false,
}: ProductDeepLinkPageProps<P>) {
  const seeded = initialProduct && initialProduct.id === productId ? initialProduct : null;
  const { data, isLoading } = useQuery({
    queryKey: ["pdp-deeplink", table, productId],
    enabled: !seeded,
    queryFn: async () => {
      const { data, error } = await supabase.from(table as any).select("*").eq("id", productId).maybeSingle();
      if (error) throw error;
      return data ? mapRow(data) : null;
    },
    staleTime: 5 * 60 * 1000,
  });
  const product = seeded || data || null;

  return (
    <div
      dir="rtl"
      className={fullScreen ? "fixed inset-0 z-[90] overflow-y-auto bg-background" : "w-full max-w-4xl mx-auto px-4 py-6"}
    >
      <div className={fullScreen ? "sticky top-0 z-10 bg-background border-b border-border px-3 py-2 flex items-center gap-2" : "mb-4 flex items-center gap-2"}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm hover:border-primary/30 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت</span>
        </button>
        {product && onAskAbout && (
          <button
            onClick={() => onAskAbout(product)}
            className="mr-auto flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm hover:border-primary/30 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>گفت‌وگو درباره این محصول</span>
          </button>
        )}
      </div>

      <div className={fullScreen ? "" : "rounded-2xl border border-border bg-background overflow-hidden"}>
        {product ? (
          renderPDP(product)
        ) : isLoading ? (
          <div className="p-10 text-center text-muted-foreground text-sm">در حال بارگذاری محصول…</div>
        ) : (
          <div className="p-10 text-center text-muted-foreground text-sm">این محصول پیدا نشد.</div>
        )}
      </div>
    </div>
  );
}
