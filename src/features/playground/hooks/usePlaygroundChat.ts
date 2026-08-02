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
  PG_PROVIDERS,
  PG_SERVICES,
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

  /* booking state */
  const [bookings, setBookings] = useState<PgBooking[]>([]);
  const [bookingService, setBookingService] = useState<PgService | null>(null);
  const [bookingProvider, setBookingProvider] = useState<PgProvider | null>(null);
  const [bookingDayKey, setBookingDayKey] = useState<string | null>(null);
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState<PgBookingFormValues | null>(null);
  const [rescheduleCode, setRescheduleCode] = useState<string | null>(null);


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

  /* ---------------- in-chat service booking ---------------- */

  const pushAssistant = useCallback((m: Omit<PgMessage, "id" | "role">) => {
    setMessages((prev) => [...prev, { id: pgId(), role: "assistant", ...m }]);
  }, []);

  const startBooking = useCallback(() => {
    setBookingService(null);
    setBookingProvider(null);
    setBookingDayKey(null);
    setBookingSlotId(null);
    setRescheduleCode(null);
    pushAssistant({
      content: "می‌تونم همین‌جا نوبتت رو رزرو کنم. اول بگو چه خدمتی می‌خوای:",
      booking: { kind: "services" },
    });
  }, [pushAssistant]);

  const pickBookingService = useCallback(
    (service: PgService) => {
      setBookingService(service);
      setBookingProvider(null);
      setBookingDayKey(null);
      setBookingSlotId(null);
      const providers = providersForService(service.id);
      setMessages((m) => [...m, userMessage(service.name)]);
      setIsProcessing(true);
      window.setTimeout(() => {
        setIsProcessing(false);
        pushAssistant({
          content: `برای «${service.name}» این متخصص‌ها در دسترس‌اند:`,
          booking: { kind: "providers", serviceId: service.id },
        });
        if (!providers.length)
          pushAssistant({
            content: "در این خدمت فعلاً ظرفیتی نیست.",
            booking: { kind: "notice", notice: "provider-full" },
          });
      }, 420);
    },
    [pushAssistant],
  );

  const showProviderProfile = useCallback(
    (provider: PgProvider) => {
      setMessages((m) => [...m, userMessage(`توضیحات ${provider.name}`)]);
      pushAssistant({
        content: `این پروفایل کامل ${provider.name} است؛ اگر مناسب بود، وقت بگیریم:`,
        booking: { kind: "profile", providerId: provider.id },
      });
    },
    [pushAssistant],
  );

  const pickBookingProvider = useCallback(
    (provider: PgProvider) => {
      setBookingProvider(provider);
      setBookingDayKey(null);
      setBookingSlotId(null);
      setMessages((m) => [...m, userMessage(provider.name)]);
      if (provider.nextOpenIn === 99) {
        pushAssistant({
          content: "ظرفیت این متخصص پر است:",
          booking: { kind: "notice", notice: "provider-full" },
        });
        return;
      }
      pushAssistant({
        content: `تقویم ${provider.name} را آوردم؛ روز و ساعت مناسب را انتخاب کن:`,
        booking: { kind: "scheduler", providerId: provider.id },
      });
    },
    [pushAssistant],
  );

  /** silent state setters — the scheduler keeps day/time in one interaction */
  const pickBookingDay = useCallback((day: PgDay) => {
    setBookingDayKey(day.key);
    setBookingSlotId(null);
  }, []);

  const pickBookingSlot = useCallback((slot: PgSlot) => {
    setBookingSlotId(slot.id);
  }, []);

  const confirmSchedule = useCallback(
    (day: PgDay, slot: PgSlot) => {
      setBookingDayKey(day.key);
      setBookingSlotId(slot.id);
      setMessages((m) => [
        ...m,
        userMessage(`${faDayLabel(day)} · ساعت ${faTime(slot.time)}`),
      ]);

      if (rescheduleCode) {
        const code = rescheduleCode;
        setRescheduleCode(null);
        setBookings((list) =>
          list.map((b) =>
            b.code === code
              ? {
                  ...b,
                  previous: { dayKey: b.dayKey, slotId: b.slotId },
                  dayKey: day.key,
                  slotId: slot.id,
                  status: "rescheduled" as PgBookingStatus,
                }
              : b,
          ),
        );
        pushAssistant({
          content: "زمان نوبتت را جابه‌جا کردم:",
          booking: { kind: "confirmation", code },
        });
        return;
      }

      pushAssistant({
        content: "مشخصات مراجع را کامل کن تا نوبت را ثبت کنم:",
        booking: { kind: "form" },
      });
    },
    [pushAssistant, rescheduleCode],
  );


  const submitBookingForm = useCallback(
    (values: PgBookingFormValues) => {
      setBookingForm(values);
      pushAssistant({
        content: "این خلاصه نوبت است؛ تأیید کن تا ثبت شود:",
        booking: { kind: "summary" },
      });
    },
    [pushAssistant],
  );

  const confirmBooking = useCallback(() => {
    if (!bookingService || !bookingProvider || !bookingDayKey || !bookingSlotId) return;
    const code = bookingCode(bookings.length * 137 + bookingSlotId.length * 41 + 613);
    const booking: PgBooking = {
      code,
      serviceId: bookingService.id,
      providerId: bookingProvider.id,
      dayKey: bookingDayKey,
      slotId: bookingSlotId,
      attendee: bookingForm?.attendee ?? "",
      phone: bookingForm?.phone ?? "",
      mode: bookingForm?.mode ?? "in-person",
      note: bookingForm?.note,
      insurance: bookingForm?.insurance,
      status: "confirmed",
    };
    setBookings((l) => [...l, booking]);
    pushAssistant({
      content: "نوبتت ثبت شد. جزئیاتش را برایت آوردم:",
      booking: { kind: "confirmation", code },
    });
  }, [
    bookingService,
    bookingProvider,
    bookingDayKey,
    bookingSlotId,
    bookingForm,
    bookings.length,
    pushAssistant,
  ]);

  const editBookingForm = useCallback(() => {
    pushAssistant({
      content: "بی‌خیال، اطلاعات را اصلاح کن:",
      booking: { kind: "form" },
    });
  }, [pushAssistant]);

  const rescheduleBooking = useCallback(
    (code: string) => {
      const booking = bookings.find((b) => b.code === code);
      if (!booking) return;
      setRescheduleCode(code);
      setBookingService(findService(booking.serviceId) ?? null);
      setBookingProvider(findProvider(booking.providerId) ?? null);
      setMessages((m) => [...m, userMessage("تغییر زمان نوبت")]);
      pushAssistant({
        content: "روز جدید را انتخاب کن؛ نوبت قبلی تا تأیید نگه داشته می‌شود:",
        booking: { kind: "calendar", providerId: booking.providerId },
      });
    },
    [bookings, pushAssistant],
  );

  const cancelBooking = useCallback(
    (code: string) => {
      setBookings((l) =>
        l.map((b) => (b.code === code ? { ...b, status: "cancelled" as PgBookingStatus } : b)),
      );
      setMessages((m) => [...m, userMessage("لغو نوبت")]);
      pushAssistant({
        content: "نوبتت لغو شد. بیعانه طی ۴۸ ساعت برمی‌گردد.",
        booking: { kind: "confirmation", code },
        quickReplies: [
          { id: pgId("q"), label: "رزرو نوبت جدید", send: "می‌خوام نوبت بگیرم" },
        ],
      });
    },
    [pushAssistant],
  );

  const addBookingToCalendar = useCallback(() => {
    pushAssistant({
      content: "فایل تقویم (ics) برایت ساخته شد و به شماره‌ات پیامک شد.",
    });
  }, [pushAssistant]);

  const showBookingBlock = useCallback(
    (payload: NonNullable<PgMessage["booking"]>, content: string) => {
      if (payload.kind === "providers" && !bookingService)
        setBookingService(PG_SERVICES[0]);
      if (payload.kind === "profile") {
        setBookingService((s) => s ?? PG_SERVICES[0]);
        setBookingProvider((p) => p ?? PG_PROVIDERS[0]);
      }
      if ((payload.kind === "calendar" || payload.kind === "slots") && !bookingProvider) {
        setBookingService((s) => s ?? PG_SERVICES[0]);
        setBookingProvider(PG_PROVIDERS[0]);
        if (payload.kind === "slots")
          setBookingDayKey(buildDays(PG_PROVIDERS[0].id).find((d) => !d.closed)?.key ?? null);
      }
      if (payload.kind === "form" || payload.kind === "summary") {
        setBookingService((s) => s ?? PG_SERVICES[0]);
        setBookingProvider((p) => p ?? PG_PROVIDERS[0]);
        const day = buildDays(PG_PROVIDERS[0].id).find((d) => !d.closed);
        setBookingDayKey((k) => k ?? day?.key ?? null);
        setBookingSlotId(
          (s) => s ?? (day ? buildSlots(day.key).find((x) => !x.taken)?.id ?? null : null),
        );
        if (payload.kind === "summary")
          setBookingForm(
            (f) =>
              f ?? {
                attendee: "سارا محمدی",
                phone: "09123456789",
                mode: "in-person",
                note: "",
                insurance: "تأمین اجتماعی",
              },
          );
      }
      pushAssistant({ content, booking: payload });
    },
    [bookingService, bookingProvider, pushAssistant],
  );

  return {
    bookings,
    bookingService,
    bookingProvider,
    bookingDayKey,
    bookingSlotId,
    bookingForm,
    rescheduleCode,
    startBooking,
    pickBookingService,
    pickBookingProvider,
    showProviderProfile,
    pickBookingDay,
    pickBookingSlot,
    submitBookingForm,
    confirmBooking,
    editBookingForm,
    rescheduleBooking,
    cancelBooking,
    addBookingToCalendar,
    showBookingBlock,

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
