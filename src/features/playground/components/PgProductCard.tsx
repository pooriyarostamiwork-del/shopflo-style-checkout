import { Plus, Info, Bookmark, Star } from "lucide-react";
import { PgProductCardProps } from "../slots";
import { faPrice, toFa } from "../data/mockStore";

/** Default product card — mirrors the storefront card language. */
export const PgProductCard = ({
  product,
  index,
  isInCart,
  isSaved,
  onAddToCart,
  onSave,
  onDetails,
}: PgProductCardProps) => (
  <div className="pg-card pg-anim-in relative flex flex-col overflow-hidden" dir="rtl">
    <div className="absolute top-3 right-3 left-3 z-10 flex items-center justify-between">
      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
        {toFa(index)}
      </div>
      {product.originalPrice && (
        <div className="px-2 py-1 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold">
          {toFa(Math.round((1 - product.price / product.originalPrice) * 100))}٪
        </div>
      )}
    </div>

    <div className="relative w-full aspect-square bg-muted/40">
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      {product.fastDelivery && (
        <span className="absolute bottom-2 left-2 px-2 py-1 rounded-lg text-[11px] text-white bg-emerald-600/90">
          ارسال سریع
        </span>
      )}
      {!product.inStock && (
        <span className="absolute bottom-2 right-2 px-2 py-1 rounded-lg text-[11px] bg-background border border-border text-muted-foreground">
          ناموجود
        </span>
      )}
    </div>

    <div className="h-px w-full bg-border" />

    <div className="p-3 flex-1 flex flex-col">
      <h4 className="font-medium text-sm line-clamp-2 leading-relaxed min-h-[2.5rem]">
        {product.name}
      </h4>

      <div className="flex items-center gap-1 mt-2">
        <Star className="w-3 h-3 fill-current text-amber-400" />
        <span className="text-xs text-muted-foreground">{toFa(product.rating)}</span>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 mt-3">
        <span className="text-sm font-bold">{faPrice(product.price)}</span>
        {product.originalPrice && (
          <span className="text-xs text-muted-foreground line-through">
            {faPrice(product.originalPrice)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
        <button
          onClick={() => onSave(product)}
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
            isSaved
              ? "bg-amber-500 text-white border-amber-500"
              : "border-border text-muted-foreground hover:border-primary/40"
          }`}
          title="ذخیره"
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
        </button>

        <button
          onClick={() => onAddToCart(product)}
          disabled={isInCart || !product.inStock}
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-primary-foreground disabled:opacity-60 ${
            isInCart ? "bg-emerald-600" : "bg-primary"
          }`}
          title="افزودن به سبد"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDetails(product)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:border-primary/30 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          جزئیات
        </button>
      </div>
    </div>
  </div>
);
