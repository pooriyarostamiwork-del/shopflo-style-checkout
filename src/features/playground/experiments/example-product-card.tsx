import { Plus, Bookmark, Star, Info } from "lucide-react";
import { PgProductCardProps } from "../slots";
import { faPrice, toFa } from "../data/mockStore";

/** Experiment: taller product card, larger image, action bar pinned to bottom. */
export const ExampleTallProductCard = ({
  product,
  index,
  isInCart,
  isSaved,
  onAddToCart,
  onSave,
  onDetails,
}: PgProductCardProps) => (
  <div className="pg-card pg-anim-in flex flex-col overflow-hidden" dir="rtl">
    <div className="relative aspect-[4/5] bg-muted/40">
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        className="w-full h-full object-cover"
      />
      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
        {toFa(index)}
      </span>
      {product.originalPrice && (
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-destructive text-destructive-foreground text-[11px] font-bold">
          {toFa(Math.round((1 - product.price / product.originalPrice) * 100))}٪
        </span>
      )}
    </div>

    <div className="p-3 flex flex-col flex-1">
      <h4 className="text-sm font-medium line-clamp-2 leading-relaxed">{product.name}</h4>
      <div className="flex items-center gap-1 mt-1.5">
        <Star className="w-3 h-3 fill-current text-amber-400" />
        <span className="text-[11px] text-muted-foreground">{toFa(product.rating)}</span>
      </div>
      <div className="mt-2 text-sm font-bold">{faPrice(product.price)}</div>

      <div className="mt-auto pt-3 flex items-center gap-2">
        <button
          onClick={() => onSave(product)}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
            isSaved ? "bg-amber-500 text-white border-amber-500" : "border-border"
          }`}
          aria-label="ذخیره"
        >
          <Bookmark className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDetails(product)}
          className="flex-1 h-8 rounded-lg border border-border text-xs text-muted-foreground flex items-center justify-center gap-1"
        >
          <Info className="w-3.5 h-3.5" /> جزئیات
        </button>
        <button
          onClick={() => onAddToCart(product)}
          disabled={isInCart}
          className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
          aria-label="افزودن به سبد"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);
