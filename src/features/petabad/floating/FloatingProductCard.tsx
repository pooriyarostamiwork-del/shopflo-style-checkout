import { Check, Info, Plus, Star } from "lucide-react";
import { Product, formatPersianPrice, toPersianNumber } from "@/data/petabadData";
import { ProductImage } from "@/components/petabad/ProductImage";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";
import { BorderBeam } from "@/components/ui/border-beam";

interface Props {
  product: Product;
  index: number;
  isInCart?: boolean;
  onAdd: (p: Product) => void;
  onDetails?: (p: Product) => void;
}

/** Compact horizontal card, tuned for the narrow embedded column. */
export const FloatingProductCard = ({ product, index, isInCart, onAdd, onDetails }: Props) => {
  const { getChatProductImage } = useHomepageSettings();

  return (
    <div className="group relative flex gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card p-2.5 transition-colors hover:border-primary/40">
      <BorderBeam
        lightWidth={96}
        duration={4}
        className="opacity-0 group-hover:opacity-100"
      />
      <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-muted">
        <ProductImage
          src={getChatProductImage(product.id, product.image)}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-[10px] font-semibold text-background">
          {toPersianNumber(index)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <p className="line-clamp-2 text-[13px] font-medium leading-6 text-foreground">{product.name}</p>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Star className="h-3 w-3 fill-current text-amber-400" />
          <span>{toPersianNumber(product.rating)}</span>
          <span className="text-muted-foreground/40">|</span>
          <span className="truncate">{product.merchant?.name}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-bold text-foreground">{formatPersianPrice(product.price)}</span>
          <div className="flex items-center gap-1.5">
            {onDetails && (
              <button
                onClick={() => onDetails(product)}
                aria-label="جزئیات محصول"
                className="flex h-7 items-center gap-1 rounded-full border border-border px-2 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Info className="h-3 w-3" />
                جزئیات
              </button>
            )}
            <button
              onClick={() => !isInCart && onAdd(product)}
              disabled={isInCart}
              aria-label={isInCart ? "اضافه شد" : "افزودن به سبد"}
              className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium transition-all ${
                isInCart
                  ? "bg-emerald-500/12 text-emerald-600"
                  : "bg-primary text-primary-foreground hover:brightness-105"
              }`}
            >
              {isInCart ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              {isInCart ? "اضافه شد" : "افزودن"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
