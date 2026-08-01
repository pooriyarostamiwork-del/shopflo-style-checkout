import { useState } from "react";
import {
  Check,
  ChevronDown,
  Info,
  Plus,
  Sparkles,
  TicketPercent,
} from "lucide-react";
import { PgProduct, faPrice, toFa } from "../data/mockStore";
import {
  PgCrossSellBundle,
  PgCrossSellItem,
  csBundleMath,
  csItemFinal,
  csItemSaving,
} from "../data/mockCrossSell";

interface Props {
  bundle: PgCrossSellBundle;
  cartIds: string[];
  onAdd: (product: PgProduct) => void;
  onAddAll: (products: PgProduct[]) => void;
}

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium">
    {children}
  </span>
);

const CrossSellCard = ({
  item,
  inCart,
  onAdd,
}: {
  item: PgCrossSellItem;
  inCart: boolean;
  onAdd: (p: PgProduct) => void;
}) => {
  const [openWhy, setOpenWhy] = useState(false);
  const final = csItemFinal(item);

  return (
    <div
      className={`min-w-[176px] max-w-[176px] shrink-0 rounded-xl border bg-background p-2.5 flex flex-col transition-colors ${
        inCart ? "border-primary/50 bg-primary/[0.03]" : "border-border"
      }`}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted/40 mb-2">
        <img
          src={item.product.image}
          alt={item.product.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <span className="absolute top-1.5 start-1.5 px-1.5 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold tabular-nums">
          {toFa(item.discountPercent)}٪−
        </span>
      </div>

      <h4 className="text-[12px] leading-[18px] font-medium line-clamp-2 h-9">
        {item.product.name}
      </h4>

      {item.tag && (
        <p className="text-[10px] text-muted-foreground truncate mt-1">{item.tag}</p>
      )}

      <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
        <span className="text-[13px] font-semibold tabular-nums">{faPrice(final)}</span>
        <span className="text-[10px] text-muted-foreground line-through tabular-nums">
          {toFa(item.product.price.toLocaleString("en-US"))}
        </span>
      </div>

      <button
        onClick={() => setOpenWhy((v) => !v)}
        className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors self-start"
        aria-expanded={openWhy}
      >
        <Info className="w-3 h-3" />
        چرا این مورد؟
        <ChevronDown
          className={`w-3 h-3 transition-transform ${openWhy ? "rotate-180" : ""}`}
        />
      </button>
      {openWhy && (
        <p className="mt-1.5 text-[10px] leading-[17px] text-muted-foreground bg-muted/50 rounded-lg p-2">
          {item.why}
        </p>
      )}

      <button
        onClick={() => !inCart && onAdd({ ...item.product, price: final })}
        disabled={inCart}
        className={`mt-2.5 h-8 rounded-lg text-[11px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors ${
          inCart
            ? "bg-muted text-muted-foreground"
            : "bg-foreground text-background hover:opacity-90"
        }`}
      >
        {inCart ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        {inCart ? "در سبد" : "افزودن"}
      </button>
    </div>
  );
};

export const PgCrossSellCarousel = ({ bundle, cartIds, onAdd, onAddAll }: Props) => {
  const [expanded, setExpanded] = useState(true);
  const [openMath, setOpenMath] = useState(false);
  const math = csBundleMath(bundle);
  const remaining = bundle.items.filter((i) => !cartIds.includes(i.product.id));
  const allAdded = remaining.length === 0;

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="p-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold truncate">{bundle.title}</h3>
              <Pill>پیشنهاد شخصی‌سازی‌شده</Pill>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {bundle.basis}
            </p>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-expanded={expanded}
            aria-label={expanded ? "بستن پیشنهاد" : "بازکردن پیشنهاد"}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Promo strip — always visible */}
        <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-primary/[0.06] px-2.5 py-2">
          <TicketPercent className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-[11px] font-medium text-primary tabular-nums">
            تا {toFa(math.totalPercent)}٪ تخفیف روی کل لیست
          </p>
          <span className="ms-auto text-[10px] text-muted-foreground tabular-nums">
            {toFa(bundle.items.length)} مورد
          </span>
        </div>

        {expanded && (
          <p className="text-[11px] leading-5 text-muted-foreground mt-2.5">
            {bundle.why}
          </p>
        )}
      </div>

      {expanded && (
        <>
          {/* Carousel */}
          <div className="px-3 pb-3">
            <div className="flex gap-2.5 overflow-x-auto pg-scroll-hidden pb-1">
              {bundle.items.map((i) => (
                <CrossSellCard
                  key={i.product.id}
                  item={i}
                  inCart={cartIds.includes(i.product.id)}
                  onAdd={onAdd}
                />
              ))}
            </div>
          </div>

          {/* Bundle economics */}
          <div className="border-t border-border bg-muted/25 p-3">
            <div className="flex items-center gap-3">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-semibold tabular-nums">
                    {faPrice(math.finalPrice)}
                  </span>
                  <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                    {toFa(math.listPrice.toLocaleString("en-US"))}
                  </span>
                </div>
                <p className="text-[10px] text-primary mt-0.5 tabular-nums">
                  صرفه‌جویی {toFa(math.totalSaving.toLocaleString("en-US"))} تومان
                </p>
              </div>

              <button
                onClick={() =>
                  !allAdded &&
                  onAddAll(
                    remaining.map((i) => ({ ...i.product, price: csItemFinal(i) })),
                  )
                }
                disabled={allAdded}
                className={`ms-auto h-10 px-3.5 rounded-xl text-[11px] font-medium inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors ${
                  allAdded
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {allAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {allAdded
                  ? "کل لیست در سبد است"
                  : `افزودن کل لیست (${toFa(remaining.length)})`}
              </button>
            </div>

            <button
              onClick={() => setOpenMath((v) => !v)}
              className="mt-2.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              aria-expanded={openMath}
            >
              جزئیات تخفیف‌ها
              <ChevronDown
                className={`w-3 h-3 transition-transform ${openMath ? "rotate-180" : ""}`}
              />
            </button>

            {openMath && (
              <div className="mt-2 space-y-1.5 text-[10px] rounded-xl bg-background border border-border p-2.5">
                {bundle.items.map((i) => (
                  <div key={i.product.id} className="flex items-center gap-2">
                    <span className="truncate text-muted-foreground flex-1">
                      {i.product.name}
                    </span>
                    <span className="text-primary shrink-0 tabular-nums">
                      {toFa(i.discountPercent)}٪−
                      {toFa(csItemSaving(i).toLocaleString("en-US"))}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1.5 border-t border-border">
                  <span className="text-muted-foreground flex-1">
                    پاداش خرید کل لیست ({toFa(bundle.bundleBonusPercent)}٪)
                  </span>
                  <span className="text-primary shrink-0 tabular-nums">
                    −{toFa(math.bonusSaving.toLocaleString("en-US"))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
