import { useEffect } from "react";
import { X, ShoppingCart, MessageSquare, User, Plus, Trash2, Sparkles, ArrowLeft, Store } from "lucide-react";
import {
  CartItem,
  Product,
  formatPersianPrice,
  toPersianNumber,
  calculateOrderSummary,
} from "@/data/gptCommerceData";
import { Basket } from "@/components/shift/Sidebar";
import { Button } from "@/components/ui/button";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";
import { ProductImage } from "@/components/shift/ProductImage";

// Stable per-basket pastel hue for the avatar accent
const BASKET_HUES = [
  { bg: "hsl(var(--primary) / 0.12)", fg: "hsl(var(--primary))" },
  { bg: "hsl(210 90% 56% / 0.12)", fg: "hsl(210 90% 46%)" },
  { bg: "hsl(38 92% 50% / 0.14)", fg: "hsl(28 85% 45%)" },
  { bg: "hsl(346 80% 60% / 0.12)", fg: "hsl(346 70% 50%)" },
];
const hueFromId = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return BASKET_HUES[h % BASKET_HUES.length];
};

export type MobileSheetTab = "cart" | "baskets" | "account";

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  tab: MobileSheetTab;
  onTabChange: (t: MobileSheetTab) => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  onAICheckout?: () => void;
  showAICheckout?: boolean;
  // Baskets
  baskets: Basket[];
  activeBasketId?: string;
  onBasketSelect: (id: string) => void;
  onCreateBasket: () => void;
  onDeleteBasket: (id: string) => void;
  // Account
  isAuthenticated: boolean;
  userFirstName?: string;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenAccountFull: () => void;
}

export const MobileBottomSheet = ({
  open,
  onClose,
  tab,
  onTabChange,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onAICheckout,
  showAICheckout,
  baskets,
  activeBasketId,
  onBasketSelect,
  onCreateBasket,
  onDeleteBasket,
  isAuthenticated,
  userFirstName,
  onSignIn,
  onSignOut,
  onOpenAccountFull,
}: MobileBottomSheetProps) => {
  const { getChatProductImage } = useHomepageSettings();
  const orderSummary = calculateOrderSummary(cartItems);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{
          maxHeight: "92dvh",
          height: "85dvh",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header tabs */}
        <div className="flex items-center justify-between px-3 pt-1 pb-2 border-b border-border/50">
          <div
            className="flex rounded-xl p-1 gap-1 flex-1"
            style={{ background: "hsl(0 0% 0% / 0.04)" }}
          >
            <SheetTabBtn
              active={tab === "baskets"}
              onClick={() => onTabChange("baskets")}
              icon={<MessageSquare className="w-3.5 h-3.5" />}
              label="چت‌ها"
              count={baskets.filter((b) => !b.isSaved).length}
            />
            <SheetTabBtn
              active={tab === "cart"}
              onClick={() => onTabChange("cart")}
              icon={<ShoppingCart className="w-3.5 h-3.5" />}
              label="سبد"
              count={cartItems.length}
            />
            <SheetTabBtn
              active={tab === "account"}
              onClick={() => onTabChange("account")}
              icon={<User className="w-3.5 h-3.5" />}
              label="حساب"
            />
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center mr-2 active:scale-95"
            style={{
              background: "hsl(0 0% 0% / 0.04)",
            }}
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {tab === "cart" && (
            <div className="p-4 space-y-3">
              {cartItems.length === 0 ? (
                <EmptyState
                  icon={<ShoppingCart className="w-7 h-7 text-muted-foreground/40" />}
                  title="سبد خریدت خالیه"
                  subtitle="از چت بخواه محصول پیدا کنه!"
                />
              ) : (
                <>
                  {orderSummary.vendorSummaries.map((vs, idx) => (
                    <div key={vs.merchant.id}>
                      {idx > 0 && <div className="h-px bg-border/60 my-3" />}
                      <div
                        className="rounded-2xl overflow-hidden"
                        style={{
                          background: "hsl(0 0% 100%)",
                          border: "1px solid hsl(0 0% 0% / 0.06)",
                        }}
                      >
                        <div
                          className="px-3 py-2 flex items-center gap-2"
                          style={{
                            background: "hsl(var(--primary) / 0.04)",
                            borderBottom: "1px solid hsl(0 0% 0% / 0.05)",
                          }}
                        >
                          <Store className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{vs.merchant.name}</span>
                          <span className="text-[11px] text-muted-foreground mr-auto">
                            {toPersianNumber(vs.items.length)} کالا
                          </span>
                        </div>
                        <div className="divide-y divide-border/40">
                          {vs.items.map((item) => (
                            <div key={item.id} className="flex gap-3 p-3">
                              <ProductImage
                                src={getChatProductImage(item.id, item.image)}
                                alt={item.name}
                                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">
                                  {item.name}
                                </p>
                                <p className="text-xs text-primary font-medium mt-0.5">
                                  {formatPersianPrice(item.price)}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <div
                                    className="flex items-center rounded-full"
                                    style={{
                                      background: "hsl(0 0% 0% / 0.04)",
                                    }}
                                  >
                                    <button
                                      onClick={() =>
                                        onUpdateQuantity(item.id, item.quantity - 1)
                                      }
                                      className="w-7 h-7 flex items-center justify-center"
                                    >
                                      −
                                    </button>
                                    <span className="px-2 text-xs font-medium min-w-[24px] text-center">
                                      {toPersianNumber(item.quantity)}
                                    </span>
                                    <button
                                      onClick={() =>
                                        onUpdateQuantity(item.id, item.quantity + 1)
                                      }
                                      className="w-7 h-7 flex items-center justify-center"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => onRemoveItem(item.id)}
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground active:bg-destructive/10 active:text-destructive"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === "baskets" && (
            <div className="p-4 space-y-4">
              {/* Hero new-chat card */}
              <button
                onClick={() => {
                  onCreateBasket();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-right active:scale-[0.98] transition-transform"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))",
                  boxShadow: "0 8px 24px hsl(var(--primary) / 0.25)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(0 0% 100% / 0.18)" }}
                >
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary-foreground">
                    گفتگوی جدید
                  </p>
                  <p className="text-[11px] text-primary-foreground/80 mt-0.5">
                    یک سبد خرید تازه شروع کن
                  </p>
                </div>
                <Plus className="w-5 h-5 text-primary-foreground/90" />
              </button>

              {baskets.length === 0 ? (
                <div className="text-center py-12">
                  <div
                    className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                    style={{
                      background: "hsl(0 0% 0% / 0.025)",
                      border: "1px dashed hsl(0 0% 0% / 0.12)",
                    }}
                  >
                    <MessageSquare className="w-7 h-7 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-foreground/80">
                    هنوز گفتگویی نداری
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    اولین چت خرید رو شروع کن
                  </p>
                  <Button
                    onClick={() => {
                      onCreateBasket();
                      onClose();
                    }}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    شروع کن
                  </Button>
                </div>
              ) : (
                <>
                  {/* Section label */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      گفتگوهای اخیر
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: "hsl(0 0% 0% / 0.05)",
                        color: "hsl(var(--muted-foreground))",
                      }}
                    >
                      {toPersianNumber(baskets.length)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {baskets.map((b) => {
                      const hue = hueFromId(b.id);
                      const isActive = b.id === activeBasketId;
                      return (
                        <button
                          key={b.id}
                          onClick={() => {
                            onBasketSelect(b.id);
                            onClose();
                          }}
                          className="w-full group flex items-center gap-3 p-3.5 rounded-2xl text-right active:scale-[0.99] transition-all relative overflow-hidden"
                          style={{
                            background: isActive
                              ? "hsl(var(--primary) / 0.06)"
                              : "hsl(0 0% 100%)",
                            border: `1px solid ${isActive ? "hsl(var(--primary) / 0.2)" : "hsl(0 0% 0% / 0.06)"}`,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                          }}
                        >
                          {isActive && (
                            <div
                              className="absolute right-0 top-3 bottom-3 w-[3px] rounded-l-full"
                              style={{ background: "hsl(var(--primary))" }}
                            />
                          )}
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ background: hue.bg }}
                          >
                            <MessageSquare
                              className="w-[18px] h-[18px]"
                              style={{ color: hue.fg }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-semibold text-foreground line-clamp-1 leading-tight">
                              {b.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              {b.itemCount > 0 && (
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                  style={{
                                    background: "hsl(var(--primary) / 0.08)",
                                    color: "hsl(var(--primary))",
                                  }}
                                >
                                  {toPersianNumber(b.itemCount)} کالا
                                </span>
                              )}
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                style={{
                                  background: "hsl(0 0% 0% / 0.04)",
                                  color: "hsl(var(--muted-foreground))",
                                }}
                              >
                                {b.lastActivity}
                              </span>
                            </div>
                          </div>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteBasket(b.id);
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/50 active:bg-destructive/10 active:text-destructive transition-colors"
                            aria-label="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "account" && (
            <div className="p-4 space-y-3">
              {isAuthenticated ? (
                <>
                  <div
                    className="rounded-2xl p-4 flex items-center gap-3"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.03))",
                      border: "1px solid hsl(var(--primary) / 0.12)",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: "hsl(var(--primary) / 0.15)" }}
                    >
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {userFirstName || "کاربر فلوکارت"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">حساب فعال</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onOpenAccountFull();
                      onClose();
                    }}
                    className="w-full p-4 rounded-2xl text-right text-sm font-medium active:scale-[0.99]"
                    style={{
                      background: "hsl(0 0% 100%)",
                      border: "1px solid hsl(0 0% 0% / 0.06)",
                    }}
                  >
                    پروفایل، آدرس‌ها و سفارش‌ها
                  </button>
                  <button
                    onClick={onSignOut}
                    className="w-full p-4 rounded-2xl text-right text-sm font-medium text-destructive active:scale-[0.99]"
                    style={{
                      background: "hsl(0 0% 100%)",
                      border: "1px solid hsl(0 0% 0% / 0.06)",
                    }}
                  >
                    خروج از حساب
                  </button>
                </>
              ) : (
                <>
                  <EmptyState
                    icon={<User className="w-7 h-7 text-muted-foreground/40" />}
                    title="وارد حساب خود نشده‌ای"
                    subtitle="برای ذخیره سفارش‌ها و آدرس‌ها وارد شو"
                  />
                  <Button
                    onClick={() => {
                      onSignIn();
                      onClose();
                    }}
                    className="w-full rounded-2xl py-3"
                  >
                    ورود / ثبت‌نام
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Cart footer */}
        {tab === "cart" && cartItems.length > 0 && (
          <div
            className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t space-y-2"
            style={{
              background: "hsl(0 0% 100%)",
              borderColor: "hsl(0 0% 0% / 0.05)",
            }}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                جمع کل ({toPersianNumber(orderSummary.totalItems)} کالا)
              </span>
              <span className="text-base font-bold">
                {formatPersianPrice(orderSummary.grandTotal)}
              </span>
            </div>
            {showAICheckout && onAICheckout ? (
              <Button
                onClick={() => {
                  onAICheckout();
                  onClose();
                }}
                className="w-full gap-2 py-3 rounded-2xl font-medium"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9))",
                }}
              >
                <Sparkles className="w-4 h-4" />
                تکمیل خرید با هوش مصنوعی
              </Button>
            ) : (
              <Button
                onClick={() => {
                  onCheckout();
                  onClose();
                }}
                className="w-full py-3 rounded-2xl font-medium"
              >
                ادامه به پرداخت
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SheetTabBtn = ({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all ${
      active ? "text-primary" : "text-muted-foreground"
    }`}
    style={{
      background: active ? "hsl(0 0% 100%)" : "transparent",
      boxShadow: active ? "0 1px 4px rgba(0,0,0,0.05)" : "none",
    }}
  >
    {icon}
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-full"
        style={{
          background: "hsl(var(--primary) / 0.12)",
          color: "hsl(var(--primary))",
        }}
      >
        {toPersianNumber(count)}
      </span>
    )}
  </button>
);

const EmptyState = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) => (
  <div className="text-center py-12">
    <div
      className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
      style={{ background: "hsl(0 0% 0% / 0.03)" }}
    >
      {icon}
    </div>
    <p className="text-sm text-foreground">{title}</p>
    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
  </div>
);
