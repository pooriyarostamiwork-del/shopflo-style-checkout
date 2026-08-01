import { Check, MapPin, Truck, CreditCard, Package, PartyPopper, Lock } from "lucide-react";
import {
  PgAddress,
  PgOrderSummary,
  PgPaymentOption,
  PgProduct,
  PgShippingOption,
  faPrice,
  toFa,
} from "../data/mockStore";

const Card = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="pg-card pg-anim-in overflow-hidden" dir="rtl">
    <div className="px-4 py-3 flex items-center gap-2 border-b border-border bg-primary/5">
      <span className="text-primary">{icon}</span>
      <span className="text-sm font-medium">{title}</span>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const Row = ({
  selected,
  onClick,
  disabled,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full text-right p-3 rounded-xl border transition-colors flex items-start gap-3 disabled:opacity-50 ${
      selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
    }`}
  >
    <span
      className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
        selected ? "bg-primary border-primary" : "border-border"
      }`}
    >
      {selected && <Check className="w-3 h-3 text-primary-foreground" />}
    </span>
    <span className="min-w-0 flex-1">{children}</span>
  </button>
);

export const PgAddressBlock = ({
  addresses,
  selectedId,
  onSelect,
}: {
  addresses: PgAddress[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) => (
  <Card icon={<MapPin className="w-4 h-4" />} title="آدرس ارسال">
    <div className="space-y-2">
      {addresses.map((a) => (
        <Row key={a.id} selected={selectedId === a.id} onClick={() => onSelect(a.id)}>
          <span className="block text-sm font-medium">{a.title}</span>
          <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
            {a.city}، {a.line}
          </span>
          <span className="block text-[11px] text-muted-foreground mt-1">
            {a.recipient} — {a.phone}
          </span>
        </Row>
      ))}
    </div>
  </Card>
);

export const PgShippingBlock = ({
  options,
  selectedId,
  onSelect,
}: {
  options: PgShippingOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) => (
  <Card icon={<Truck className="w-4 h-4" />} title="روش ارسال">
    <div className="space-y-2">
      {options.map((o) => (
        <Row key={o.id} selected={selectedId === o.id} onClick={() => onSelect(o.id)}>
          <span className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{o.label}</span>
            <span className="text-xs text-muted-foreground">
              {o.price === 0 ? "رایگان" : faPrice(o.price)}
            </span>
          </span>
          <span className="block text-[11px] text-muted-foreground mt-1">{o.eta}</span>
        </Row>
      ))}
    </div>
  </Card>
);

export const PgPaymentBlock = ({
  options,
  selectedId,
  onSelect,
}: {
  options: PgPaymentOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) => (
  <Card icon={<CreditCard className="w-4 h-4" />} title="روش پرداخت">
    <div className="space-y-2">
      {options.map((o) => (
        <Row
          key={o.id}
          selected={selectedId === o.id}
          disabled={o.disabled}
          onClick={() => onSelect(o.id)}
        >
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium">{o.label}</span>
            {o.disabled && <Lock className="w-3 h-3 text-muted-foreground" />}
          </span>
          {o.hint && (
            <span className="block text-[11px] text-muted-foreground mt-1">{o.hint}</span>
          )}
        </Row>
      ))}
    </div>
  </Card>
);

export const PgSummaryBlock = ({ summary }: { summary: PgOrderSummary }) => (
  <Card icon={<Package className="w-4 h-4" />} title="خلاصه سفارش">
    {summary.items.length === 0 ? (
      <p className="text-xs text-muted-foreground">سبد خرید خالی است.</p>
    ) : (
      <>
        <div className="space-y-2">
          {summary.items.map((i) => (
            <div key={i.id} className="flex items-center gap-2">
              <img
                src={i.image}
                alt={i.name}
                loading="lazy"
                className="w-9 h-9 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs line-clamp-1">{i.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {toFa(i.quantity)} عدد
                </p>
              </div>
              <span className="text-xs">{faPrice(i.price * i.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">جمع کالاها</span>
            <span>{faPrice(summary.subtotal)}</span>
          </div>
          {summary.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>سود شما از تخفیف</span>
              <span>{faPrice(summary.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">هزینه ارسال</span>
            <span>{summary.shipping === 0 ? "رایگان" : faPrice(summary.shipping)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border font-bold text-sm">
            <span>مبلغ قابل پرداخت</span>
            <span>{faPrice(summary.grandTotal)}</span>
          </div>
        </div>
      </>
    )}
  </Card>
);

export const PgSuccessBlock = ({ summary }: { summary: PgOrderSummary }) => (
  <Card icon={<PartyPopper className="w-4 h-4" />} title="سفارش ثبت شد">
    <div className="space-y-1.5 text-xs">
      <div className="flex justify-between">
        <span className="text-muted-foreground">شماره سفارش</span>
        <span dir="ltr">PG-2048871</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">تعداد کالا</span>
        <span>{toFa(summary.totalItems)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">مبلغ پرداخت‌شده</span>
        <span className="font-bold">{faPrice(summary.grandTotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">زمان تحویل</span>
        <span>۲ تا ۳ روز کاری</span>
      </div>
    </div>
  </Card>
);

export const PgInlinePdp = ({
  product,
  isInCart,
  onAddToCart,
}: {
  product: PgProduct;
  isInCart: boolean;
  onAddToCart: (p: PgProduct) => void;
}) => (
  <div className="pg-card pg-anim-in overflow-hidden" dir="rtl">
    <div className="flex gap-4 p-4">
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        className="w-28 h-28 rounded-xl object-cover shrink-0"
      />
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-medium leading-relaxed">{product.name}</h4>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          {product.description}
        </p>
        <div className="mt-3 text-sm font-bold">{faPrice(product.price)}</div>
      </div>
    </div>
    <div className="px-4 pb-4">
      <div className="rounded-xl border border-border divide-y divide-border">
        {product.specs.map((s) => (
          <div key={s.label} className="flex justify-between px-3 py-2 text-xs">
            <span className="text-muted-foreground">{s.label}</span>
            <span>{s.value}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => onAddToCart(product)}
        disabled={isInCart}
        className="mt-3 w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm disabled:opacity-60"
      >
        {isInCart ? "در سبد شماست" : "افزودن به سبد"}
      </button>
    </div>
  </div>
);
