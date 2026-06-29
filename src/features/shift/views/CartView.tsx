import { useShiftCart } from "../context/ShiftCartContext";
import { formatPrice, toPersianDigits } from "../data/format";
import { Plus, Minus, X } from "lucide-react";

interface Props { onCheckout: () => void; }

const CartView = ({ onCheckout }: Props) => {
  const { items, updateQty, removeItem, subtotal, count } = useShiftCart();

  if (items.length === 0) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold">سبد خرید</h1>
        <div className="rounded-xl border border-dashed border-[hsl(var(--shift-border))] p-10 text-center text-sm text-[hsl(var(--shift-muted))]">
          سبد خرید خالی است.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">سبد خرید ({toPersianDigits(count)})</h1>

      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.product_id}
            className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--shift-surface))] border border-[hsl(var(--shift-border))]">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-[hsl(var(--shift-bg))] shrink-0">
              {it.image_url
                ? <img src={it.image_url} alt={it.name_fa} className="w-full h-full object-cover" />
                : <div className="w-full h-full" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{it.name_fa}</div>
              <div className="text-xs text-[hsl(var(--shift-muted))] mt-1">{formatPrice(it.price)}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQty(it.product_id, it.qty - 1)}
                className="w-7 h-7 rounded-full bg-[hsl(var(--shift-bg))] flex items-center justify-center">
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm min-w-[20px] text-center">{toPersianDigits(it.qty)}</span>
              <button onClick={() => updateQty(it.product_id, it.qty + 1)}
                className="w-7 h-7 rounded-full bg-[hsl(var(--shift-bg))] flex items-center justify-center">
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <button onClick={() => removeItem(it.product_id)}
              className="text-[hsl(var(--shift-muted))] hover:text-red-500 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-[hsl(var(--shift-surface))] border border-[hsl(var(--shift-border))] p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[hsl(var(--shift-muted))]">جمع کل</span>
          <span className="font-semibold">{formatPrice(subtotal)}</span>
        </div>
        <button onClick={onCheckout}
          className="w-full py-3 rounded-xl bg-[hsl(var(--shift-primary))] text-white text-sm font-medium">
          ادامه به پرداخت
        </button>
      </div>
    </div>
  );
};

export default CartView;
