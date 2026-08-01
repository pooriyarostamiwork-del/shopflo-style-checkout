import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { PgCartItem, PgOrderSummary, faPrice, toFa } from "../data/mockStore";
import { PgCartRowProps, usePgSlots } from "../slots";

const DefaultRow = ({ item, onRemove, onQuantity }: PgCartRowProps) => (
  <div className="flex items-start gap-3 py-3" dir="rtl">
    <img
      src={item.image}
      alt={item.name}
      loading="lazy"
      className="w-12 h-12 rounded-lg object-cover shrink-0"
    />
    <div className="min-w-0 flex-1">
      <p className="text-xs line-clamp-2 leading-relaxed">{item.name}</p>
      <p className="text-xs font-medium mt-1">{faPrice(item.price * item.quantity)}</p>
      <div className="flex items-center gap-1.5 mt-2">
        <button
          onClick={() => onQuantity(item.id, item.quantity - 1)}
          className="w-6 h-6 rounded-md border border-border flex items-center justify-center"
          aria-label="کاهش"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-xs w-5 text-center">{toFa(item.quantity)}</span>
        <button
          onClick={() => onQuantity(item.id, item.quantity + 1)}
          className="w-6 h-6 rounded-md border border-border flex items-center justify-center"
          aria-label="افزایش"
        >
          <Plus className="w-3 h-3" />
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground ms-auto"
          aria-label="حذف"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>
);

interface Props {
  items: PgCartItem[];
  summary: PgOrderSummary;
  onRemove: (id: string) => void;
  onQuantity: (id: string, q: number) => void;
}

export const PgCartPanel = ({ items, summary, onRemove, onQuantity }: Props) => {
  const slots = usePgSlots();
  const Row = slots.cartRow ?? DefaultRow;

  return (
    <aside
      className="w-[320px] shrink-0 h-full border-s border-border bg-background flex flex-col"
      dir="rtl"
    >
      <div className="px-4 py-3.5 border-b border-border flex items-center gap-2">
        <ShoppingBag className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">سبد خرید</span>
        <span className="text-[11px] text-muted-foreground ms-auto">
          {toFa(summary.totalItems)} کالا
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pg-scroll-hidden px-4 divide-y divide-border">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">
            سبد خرید خالی است. از گفت‌وگو محصول اضافه کن.
          </p>
        ) : (
          items.map((item) => (
            <Row key={item.id} item={item} onRemove={onRemove} onQuantity={onQuantity} />
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="p-4 border-t border-border space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">جمع کالاها</span>
            <span>{faPrice(summary.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ارسال</span>
            <span>{summary.shipping === 0 ? "رایگان" : faPrice(summary.shipping)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border font-bold text-sm">
            <span>مجموع</span>
            <span>{faPrice(summary.grandTotal)}</span>
          </div>
        </div>
      )}
    </aside>
  );
};
