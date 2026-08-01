import { Minus, Plus, Trash2 } from "lucide-react";
import { PgCartRowProps } from "../slots";
import { faPrice, toFa } from "../data/mockStore";

/** Experiment: compact cart row with inline quantity stepper. */
export const ExampleCompactCartRow = ({ item, onRemove, onQuantity }: PgCartRowProps) => (
  <div className="pg-anim-in flex items-center gap-2 py-2" dir="rtl">
    <img
      src={item.image}
      alt={item.name}
      loading="lazy"
      className="w-10 h-10 rounded-lg object-cover"
    />
    <div className="min-w-0 flex-1">
      <p className="text-[12px] line-clamp-1">{item.name}</p>
      <p className="text-[11px] text-muted-foreground">{faPrice(item.price)}</p>
    </div>
    <div className="flex items-center gap-1">
      <button
        onClick={() => onQuantity(item.id, item.quantity - 1)}
        className="w-6 h-6 rounded-md border border-border flex items-center justify-center"
        aria-label="کاهش"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="text-[12px] w-5 text-center">{toFa(item.quantity)}</span>
      <button
        onClick={() => onQuantity(item.id, item.quantity + 1)}
        className="w-6 h-6 rounded-md border border-border flex items-center justify-center"
        aria-label="افزایش"
      >
        <Plus className="w-3 h-3" />
      </button>
      <button
        onClick={() => onRemove(item.id)}
        className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground"
        aria-label="حذف"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);
