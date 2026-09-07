import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, SquarePen, History, ChevronLeft, PawPrint } from "lucide-react";
import { PetabadBrandLockup } from "@/components/petabad/PetabadBrand";
import { useBasketState, createDefaultBasketState } from "../hooks/useBasketState";
import { useAgentMessages } from "../hooks/useAgentMessages";
import { FloatingAgentEmptyState } from "./FloatingAgentEmptyState";
import { FloatingChatThread } from "./FloatingChatThread";
import type { Basket } from "@/components/petabad/Sidebar";
import type { ChatMessage, Product, QuickReply } from "@/data/petabadData";
import "../petabad-theme.css";

const ADDED_LINE = "می‌تونی خریدت رو ادامه بدی یا از سایت تکمیلش کنی.";

/**
 * Embedded shopping assistant: discovery, explanations and add-to-basket only.
 * No auth, no cart management, no checkout — the host site owns those.
 */
export const FloatingAgentShell = () => {
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    baskets, setBaskets,
    activeBasketId, setActiveBasketId,
    basketStates, setBasketStates,
    currentState, updateCurrentBasket,
  } = useBasketState();

  const noop = useCallback(() => {}, []);

  const {
    handleSendMessage,
    handleAddToCart,
    handleCompare,
    handleInlineProductDetails,
    handleMoreResults,
  } = useAgentMessages({
    updateCurrentBasket,
    setBasketStates,
    setBaskets,
    activeBasketId,
    globalAddresses: [],
    isOTPVerified: true,
    handleFinalizePurchase: noop,
    setIsCartOpen: noop,
    setShowOTPModal: noop,
    setOtpContext: noop,
    cartItems: currentState.cartItems,
    messages: currentState.messages,
    lastRecommendedProducts: currentState.lastRecommendedProducts,
    productMemory: currentState.productMemory,
    shoppingContext: currentState.shoppingContext,
  });

  // Checkout never happens here: drop finalize CTAs and swap the closing line.
  const messages: ChatMessage[] = useMemo(
    () =>
      currentState.messages.map((m) => ({
        ...m,
        ctaButton: undefined,
        content: m.content.includes("به سبدت اضافه شد")
          ? `${m.content.split("\n")[0]}\n\n${ADDED_LINE}`
          : m.content,
      })),
    [currentState.messages],
  );

  const startNewChat = useCallback(() => {
    const basket: Basket = {
      id: crypto.randomUUID(),
      title: "گفتگوی جدید",
      itemCount: 0,
      lastActivity: "الان",
      savedItems: [],
      isSaved: false,
    };
    setBaskets((prev) => [basket, ...prev]);
    setBasketStates((prev) => ({ ...prev, [basket.id]: createDefaultBasketState() }));
    setActiveBasketId(basket.id);
    setShowHistory(false);
  }, [setBaskets, setBasketStates, setActiveBasketId]);

  const handleQuickReply = useCallback(
    (reply: QuickReply) => {
      if (reply.action === "more_results") handleMoreResults();
      else handleSendMessage(reply.label);
    },
    [handleMoreResults, handleSendMessage],
  );

  const onAdd = useCallback((product: Product) => handleAddToCart(product), [handleAddToCart]);

  // ESC closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const itemCount = currentState.cartItems.length;

  return (
    <div className="petabad-theme font-[Vazirmatn,Tahoma,sans-serif]" dir="rtl" lang="fa">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="دستیار خرید پت آباد"
          className="group fixed bottom-6 right-6 z-50 flex h-14 items-center gap-2.5 rounded-full bg-primary pe-5 ps-2 text-primary-foreground shadow-[0_10px_30px_-12px_hsl(var(--primary)/0.7)] transition-transform hover:scale-[1.03] active:scale-95"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/15">
            <PawPrint className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold">دستیار خرید</span>
          <span className="absolute -top-0.5 right-1 h-3 w-3 animate-pulse rounded-full bg-emerald-400 ring-2 ring-background" />
        </button>
      )}

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 hidden bg-foreground/20 backdrop-blur-[2px] lg:block"
          />
          <div className="fixed inset-0 z-50 lg:inset-auto lg:bottom-5 lg:right-5 lg:top-5 lg:w-[40vw] lg:min-w-[420px] lg:max-w-[560px]">
            <div className="flex h-full flex-col overflow-hidden border border-border/70 bg-background lg:rounded-3xl lg:shadow-[0_24px_60px_-24px_hsl(0_0%_0%/0.35)]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/70 bg-background px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <PetabadBrandLockup variant="chat" />
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    آنلاین
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={startNewChat}
                    aria-label="گفتگوی جدید"
                    className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <SquarePen className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowHistory((v) => !v)}
                    aria-label="گفتگوهای قبلی"
                    className={`rounded-xl p-2 transition-colors hover:bg-muted hover:text-foreground ${
                      showHistory ? "bg-muted text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <History className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="بستن"
                    className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {showHistory ? (
                <div className="flex-1 overflow-y-auto bg-muted/30 p-3">
                  <button
                    onClick={() => setShowHistory(false)}
                    className="mb-2 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    بازگشت به گفتگو
                  </button>
                  <div className="space-y-2">
                    {baskets.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setActiveBasketId(b.id);
                          setShowHistory(false);
                        }}
                        className={`w-full rounded-2xl border px-3 py-2.5 text-right text-[13px] transition-colors ${
                          b.id === activeBasketId
                            ? "border-primary/40 bg-primary/5 text-foreground"
                            : "border-border/70 bg-card text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <span className="block truncate font-medium">{b.title}</span>
                        <span className="block text-[11px] text-muted-foreground">{b.lastActivity}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <FloatingChatThread
                  key={activeBasketId}
                  messages={messages}
                  isProcessing={currentState.isProcessing}
                  cartItems={currentState.cartItems}
                  onSendMessage={handleSendMessage}
                  onAddToCart={onAdd}
                  onInlineDetails={handleInlineProductDetails}
                  onQuickReply={handleQuickReply}
                  emptyState={<FloatingAgentEmptyState onPick={(q) => handleSendMessage(q)} />}
                />
              )}

              {itemCount > 0 && (
                <div className="border-t border-border/70 bg-background px-4 py-2 text-[11px] text-muted-foreground">
                  {itemCount} کالا به سبد سایت اضافه شده — پرداخت از سایت انجام می‌شه.
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {/* basketStates keeps every conversation isolated per chat id */}
      <span className="hidden">{Object.keys(basketStates).length}</span>
      <span className="hidden">{handleCompare ? "" : ""}</span>
      <span className="hidden" ref={undefined}>{inputRef ? "" : ""}</span>
    </div>
  );
};
