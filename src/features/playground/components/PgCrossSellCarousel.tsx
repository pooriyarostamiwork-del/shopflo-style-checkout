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
      className={`min-w-[212px] max-w-[212px] shrink-0 rounded-2xl border bg-background p-3 flex flex-col transition-colors ${
        inCart ? "border-primary/50 bg-primary/[0.03]" : "border-border"
      }`}
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted/40 mb-2.5">
        <img
          src={item.product.image}
          alt={item.product.name}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <span className="absolute top-1.5 start-1.5 px-1.5 py-0.5 rounded-md bg-foreground text-background text-[10px] font-medium">
          {toFa(item.discountPercent)}٪ تخفیف
        </span>
      </div>

      <h4 className="text-[13px] leading-5 font-medium line-clamp-2 h-10">
        {item.product.name}
      </h4>

      {item.tag && <div className="mt-1.5"><Pill>{item.tag}</Pill></div>}

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[13px] font-semibold">{faPrice(final)}</span>
        <span className="text-[11px] text-muted-foreground line-through">
          {toFa(item.product.price.toLocaleString("en-US"))}
        </span>
      </div>
      <p className="text-[10px] text-primary mt-0.5">
        {toFa(csItemSaving(item).toLocaleString("en-US"))} تومان صرفه‌جویی
      </p>

      <button
        onClick={() => setOpenWhy((v) => !v)}
        className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={openWhy}
      >
        <Info className="w-3 h-3" />
        چرا این مورد؟
        <ChevronDown
          className={`w-3 h-3 transition-transform ${openWhy ? "rotate-180" : ""}`}
        />
      </button>
      {openWhy && (
        <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground bg-muted/50 rounded-lg p-2">
          {item.why}
        </p>
      )}

      <button
        onClick={() => !inCart && onAdd({ ...item.product, price: final })}
        disabled={inCart}
        className={`mt-3 h-9 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 transition-colors ${
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
      <div className="p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold">{bundle.title}</h3>
              <Pill>پیشنهاد شخصی‌سازی‌شده</Pill>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{bundle.basis}</p>
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

        {/* Bundle why */}
        <p className="text-xs leading-6 text-muted-foreground mt-2.5">{bundle.why}</p>

        {/* Collapsed teaser */}
        {!expanded && (
          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-primary">
            <TicketPercent className="w-3.5 h-3.5" />
            {toFa(bundle.items.length)} مورد · تا {toFa(math.totalPercent)}٪ تخفیف روی کل
            لیست
          </div>
        )}
      </div>

      {expanded && (
        <>
          {/* Carousel */}
          <div className="px-3.5 pb-3.5">
            <div className="flex gap-3 overflow-x-auto pg-scroll-hidden pb-1">
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
          <div className="border-t border-border bg-muted/30 p-3.5">
            <button
              onClick={() => setOpenMath((v) => !v)}
              className="w-full flex items-center gap-2 text-start"
              aria-expanded={openMath}
            >
              <TicketPercent className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-medium">
                با کل لیست {toFa(math.totalPercent)}٪ تخفیف می‌گیری
              </span>
              <span className="ms-auto text-[11px] text-muted-foreground">
                جزئیات
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                  openMath ? "rotate-180" : ""
                }`}
              />
            </button>

            {openMath && (
              <div className="mt-3 space-y-2 text-[11px]">
                {bundle.items.map((i) => (
                  <div key={i.product.id} className="flex items-center gap-2">
                    <span className="truncate text-muted-foreground flex-1">
                      {i.product.name}
                    </span>
                    <span className="text-primary shrink-0">
                      {toFa(i.discountPercent)}٪−
                      {toFa(csItemSaving(i).toLocaleString("en-US"))}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <span className="text-muted-foreground flex-1">
                    پاداش خرید کل لیست ({toFa(bundle.bundleBonusPercent)}٪)
                  </span>
                  <span className="text-primary shrink-0">
                    −{toFa(math.bonusSaving.toLocaleString("en-US"))}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground line-through">
                  {toFa(math.listPrice.toLocaleString("en-US"))} تومان
                </p>
                <p className="text-sm font-semibold">{faPrice(math.finalPrice)}</p>
                <p className="text-[11px] text-primary mt-0.5">
                  مجموع صرفه‌جویی {toFa(math.totalSaving.toLocaleString("en-US"))} تومان
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
                className={`h-10 px-4 rounded-xl text-xs inline-flex items-center gap-1.5 transition-colors ${
                  allAdded
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {allAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {allAdded
                  ? "کل لیست در سبد است"
                  : `افزودن کل لیست (${toFa(remaining.length)} مورد)`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
