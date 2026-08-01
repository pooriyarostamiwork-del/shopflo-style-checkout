import { useCallback, useState } from "react";
import {
  PgCartItem,
  PgProduct,
  PG_ADDRESSES,
  PG_PRODUCTS,
  PG_SHIPPING,
  pgOrderSummary,
} from "../data/mockStore";
import {
  PgJourneyStep,
  PgMessage,
  mockRespond,
  stepMessages,
  userMessage,
  pgId,
} from "../data/mockJourney";
import { PgInteractive } from "../data/mockDiscovery";
import {
  PgCompareChip,
  PgComparePreset,
  CHIP_LABELS,
  buildComparison,
  buildPreset,
  resolveChipTarget,
} from "../data/mockComparison";
import {
  PgBooking,
  PgBookingStatus,
  PgDay,
  PgProvider,
  PgService,
  PgSlot,
  bookingCode,
  buildDays,
  buildSlots,
  faDayLabel,
  faTime,
  findDay,
  findProvider,
  findService,
  providersForService,
} from "../data/mockBooking";
import { PgBookingFormValues } from "../components/PgBookingFlow";


export type PgCartSeed = "empty" | "single" | "multi" | "out-of-stock";
export type PgAuthState = "guest" | "signed-in";

const seedItems = (seed: PgCartSeed): PgCartItem[] => {
  switch (seed) {
    case "empty":
      return [];
    case "single":
      return [{ ...PG_PRODUCTS[0], quantity: 1 }];
    case "multi":
      return [
        { ...PG_PRODUCTS[0], quantity: 1 },
        { ...PG_PRODUCTS[2], quantity: 2 },
        { ...PG_PRODUCTS[4], quantity: 1 },
      ];
    case "out-of-stock":
      return [
        { ...PG_PRODUCTS[0], quantity: 1 },
        { ...PG_PRODUCTS[5], quantity: 1 },
      ];
  }
};

export const usePlaygroundChat = () => {
  const [messages, setMessages] = useState<PgMessage[]>(() => stepMessages("discovery"));
  const [cart, setCart] = useState<PgCartItem[]>([]);
  const [step, setStep] = useState<PgJourneyStep>("discovery");
  const [cartSeed, setCartSeed] = useState<PgCartSeed>("empty");
  const [auth, setAuth] = useState<PgAuthState>("guest");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    PG_ADDRESSES[0].id,
  );
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(
    PG_SHIPPING[1].id,
  );
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const shippingPrice =
    PG_SHIPPING.find((s) => s.id === selectedShippingId)?.price ?? 0;
  const summary = pgOrderSummary(cart, shippingPrice);

  const send = useCallback((text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, userMessage(text)]);
    setIsProcessing(true);
    window.setTimeout(() => {
      setMessages((m) => [...m, mockRespond(text)]);
      setIsProcessing(false);
    }, 550);
  }, []);

  const addToCart = useCallback((product: PgProduct) => {
    setCart((c) =>
      c.some((i) => i.id === product.id)
        ? c.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...c, { ...product, quantity: 1 }],
    );
    setMessages((m) => [
      ...m,
      {
        id: pgId(),
        role: "assistant",
        content: `«${product.name}» به سبد اضافه شد. چیز دیگه‌ای لازم داری؟`,
        quickReplies: [
          { id: pgId("q"), label: "سبدم", send: "سبدم رو نشون بده" },
          { id: pgId("q"), label: "ادامه خرید", send: "چیز دیگه‌ای پیشنهاد بده" },
        ],
      },
    ]);
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((c) => c.filter((i) => i.id !== id));
  }, []);

  const setQuantity = useCallback((id: string, q: number) => {
    setCart((c) =>
      q <= 0
        ? c.filter((i) => i.id !== id)
        : c.map((i) => (i.id === id ? { ...i, quantity: q } : i)),
    );
  }, []);

  const toggleSave = useCallback((product: PgProduct) => {
    setSavedIds((s) =>
      s.includes(product.id) ? s.filter((x) => x !== product.id) : [...s, product.id],
    );
  }, []);

  const showInlineDetails = useCallback((product: PgProduct) => {
    setMessages((m) => [
      ...m,
      {
        id: pgId(),
        role: "assistant",
        content: "مشخصات کامل این محصول:",
        inlineProduct: product,
      },
    ]);
  }, []);

  /** Ask a dynamic, context-aware question via an interactive component. */
  const showInteractive = useCallback((kind: PgInteractive) => {
    const content =
      kind === "quiz"
        ? "برای اینکه دقیق پیشنهاد بدم، یه سؤال دارم:"
        : kind === "wizard"
          ? "چند سؤال کوتاه می‌پرسم تا دقیق‌ترین گزینه رو پیدا کنم:"
          : "بذار محدوده قیمتت رو دقیق کنیم:";
    setMessages((m) => [...m, { id: pgId(), role: "assistant", content, interactive: kind }]);
  }, []);

  const addManyToCart = useCallback((products: PgProduct[]) => {
    setCart((c) => {
      let next = [...c];
      products.forEach((p) => {
        const i = next.findIndex((x) => x.id === p.id);
        if (i >= 0) next[i] = { ...next[i], quantity: next[i].quantity + 1 };
        else next = [...next, { ...p, quantity: 1 }];
      });
      return next;
    });
    setMessages((m) => [
      ...m,
      {
        id: pgId(),
        role: "assistant",
        content: `کل لیست (${products.length} مورد) با تخفیف ست به سبدت اضافه شد.`,
        quickReplies: [
          { id: pgId("q"), label: "سبدم", send: "سبدم رو نشون بده" },
          { id: pgId("q"), label: "ثبت آدرس", send: "بریم مرحله آدرس" },
        ],
      },
    ]);
  }, []);

  /** Lab: render a comparison preset (2/3 columns, external, edge states). */
  const showComparison = useCallback((preset: PgComparePreset) => {
    const cmp = buildPreset(preset);
    setMessages((m) => [
      ...m,
      {
        id: pgId(),
        role: "assistant",
        content:
          cmp.mode === "single"
            ? "برای مقایسه به گزینه دوم نیاز دارم:"
            : cmp.mode === "usecase-only"
              ? "این گزینه‌ها هم‌رده نیستند؛ بر اساس کاربرد کنار هم گذاشتمشان:"
              : "این مقایسه را برایت چیدم؛ نتیجه اول، جزئیات بعد از آن:",
        comparison: cmp,
      },
    ]);
  }, []);

  /** Product-card chip: compare this product against a resolved counterpart. */
  const compareFromChip = useCallback(
    (product: PgProduct, chip: PgCompareChip) => {
      const target = resolveChipTarget(product, chip);
      const label = CHIP_LABELS[chip];
      setMessages((m) => [...m, userMessage(`${product.name} — ${label}`)]);
      setIsProcessing(true);
      window.setTimeout(() => {
        const cmp = buildComparison(target ? [product, target] : [product], {
          currentId: product.id,
          scope: `${label} — انتخاب‌شده از کارت محصول`,
        });
        setMessages((m) => [
          ...m,
          {
            id: pgId(),
            role: "assistant",
            content:
              cmp.mode === "usecase-only"
                ? "نزدیک‌ترین گزینه هم‌قیمت در دسته دیگری بود؛ بر اساس کاربرد مقایسه کردم:"
                : cmp.mode === "single"
                  ? "گزینه‌ای برای این مقایسه پیدا نکردم:"
                  : "نتیجه مقایسه:",
            comparison: cmp,
          },
        ]);
        setIsProcessing(false);
      }, 450);
    },
    [],
  );

  /** Show the AI cross-sell bundle carousel. */
  const showCrossSell = useCallback(() => {
    setMessages((m) => [
      ...m,
      {
        id: pgId(),
        role: "assistant",
        content: "بر اساس انتخابت این ست رو چیدم؛ با هم گرفتنشون تخفیف بیشتری داره:",
        crossSell: true,
      },
    ]);
  }, []);

  /** Dev-drawer: jump straight to any journey step. */
  const jumpTo = useCallback(
    (next: PgJourneyStep) => {
      setStep(next);
      const needsCart = ["cart", "address", "shipping", "payment", "confirmation"];
      if (needsCart.includes(next) && cart.length === 0) {
        setCart(seedItems("multi"));
        setCartSeed("multi");
      }
      if (next === "payment") setSelectedPaymentId(null);
      if (next === "confirmation") setSelectedPaymentId("pay-online");
      setMessages(stepMessages(next));
    },
    [cart.length],
  );

  const applySeed = useCallback((seed: PgCartSeed) => {
    setCartSeed(seed);
    setCart(seedItems(seed));
  }, []);

  const reset = useCallback(() => {
    setStep("discovery");
    setCart([]);
    setCartSeed("empty");
    setSelectedPaymentId(null);
    setMessages(stepMessages("discovery"));
  }, []);

  const finalize = useCallback(() => {
    setStep("confirmation");
    setMessages((m) => [
      ...m,
      {
        id: pgId(),
        role: "assistant",
        content: "سفارشت ثبت شد. جزئیاتش رو برات آوردم:",
        block: "success",
      },
    ]);
  }, []);

  return {
    messages,
    cart,
    summary,
    step,
    cartSeed,
    auth,
    isProcessing,
    savedIds,
    selectedAddressId,
    selectedShippingId,
    selectedPaymentId,
    send,
    addToCart,
    removeFromCart,
    setQuantity,
    toggleSave,
    showInlineDetails,
    showInteractive,
    showCrossSell,
    showComparison,
    compareFromChip,
    addManyToCart,
    jumpTo,
    applySeed,
    reset,
    finalize,
    setAuth,
    setSelectedAddressId,
    setSelectedShippingId,
    setSelectedPaymentId,
  };
};

export type PgChat = ReturnType<typeof usePlaygroundChat>;
