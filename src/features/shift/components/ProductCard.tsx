import type { ShiftProduct } from "../data/types";
import { useShiftCart } from "../context/ShiftCartContext";
import { formatPrice } from "../data/format";
import { Plus } from "lucide-react";

interface Props { product: ShiftProduct; }

const ProductCard = ({ product }: Props) => {
  const { addItem } = useShiftCart();
  const hasDiscount = product.original_price && product.original_price > product.price;

  return (
    <div className="group rounded-xl overflow-hidden bg-[hsl(var(--shift-surface))] border border-[hsl(var(--shift-border))] transition hover:border-[hsl(var(--shift-primary)/0.5)]">
      <div className="aspect-square bg-[hsl(var(--shift-bg))] overflow-hidden relative">
        {product.image_url
          ? <img src={product.image_url} alt={product.name_fa} loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-xs text-[hsl(var(--shift-muted))]">بدون تصویر</div>}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">ناموجود</div>
        )}
        <button onClick={() => addItem(product)}
          disabled={!product.in_stock}
          className="absolute bottom-2 left-2 w-8 h-8 rounded-full bg-[hsl(var(--shift-primary))] text-white flex items-center justify-center shadow-md disabled:opacity-40">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="p-3 space-y-1.5">
        <div className="text-xs font-medium line-clamp-2 min-h-[2.5rem]">{product.name_fa}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
          {hasDiscount && (
            <span className="text-[10px] text-[hsl(var(--shift-muted))] line-through">
              {formatPrice(product.original_price!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
