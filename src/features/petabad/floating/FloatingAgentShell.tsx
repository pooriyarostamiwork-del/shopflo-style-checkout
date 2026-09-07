import { useCallback, useMemo, useRef, useState } from "react";
import { MessageCircle, X, SquarePen, History, ChevronLeft } from "lucide-react";
import { PetabadBrandLockup } from "@/components/petabad/PetabadBrand";
import { ChatThread } from "@/components/petabad/ChatThread";
import { useBasketState, createDefaultBasketState } from "../hooks/useBasketState";
import { useAgentMessages } from "../hooks/useAgentMessages";
import { FloatingAgentEmptyState } from "./FloatingAgentEmptyState";
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

  return (
    <div className="petabad-theme" dir="rtl" lang="fa">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="دستیار خرید پت آباد"
          className="fixed bottom-6 right-6 z-50 flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-primary-foreground transition-transform hover:scale-[1.03]"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">دستیار خرید</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 lg:inset-auto lg:bottom-6 lg:right-6 lg:top-6 lg:w-[40vw] lg:min-w-[420px]">
          <div className="flex h-full flex-col overflow-hidden border border-border bg-background lg:rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <PetabadBrandLockup variant="chat" />
              <div className="flex items-center gap-1">
                <button
                  onClick={startNewChat}
                  aria-label="گفتگوی جدید"
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <SquarePen className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  aria-label="گفتگوهای قبلی"
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <History className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="بستن"
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {showHistory ? (
              <div className="flex-1 overflow-y-auto p-3">
                <button
                  onClick={() => setShowHistory(false)}
                  className="mb-2 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  بازگشت به گفتگو
                </button>
                <div className="space-y-1">
                  {baskets.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setActiveBasketId(b.id);
                        setShowHistory(false);
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-right text-sm transition-colors ${
                        b.id === activeBasketId
                          ? "border-primary/40 bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="block truncate">{b.title}</span>
                      <span className="block text-[11px] text-muted-foreground">{b.lastActivity}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : messages.length === 0 ? (
              <FloatingAgentEmptyState onPick={(q) => handleSendMessage(q)} />
            ) : (
              <div className="flex-1 overflow-hidden">
                <ChatThread
                  key={activeBasketId}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onAddToCart={onAdd}
                  onCompare={handleCompare}
                  cartItems={currentState.cartItems}
                  isProcessing={currentState.isProcessing}
                  isCartOpen={false}
                  onSignIn={noop}
                  inputRef={inputRef}
                  onInlineProductDetails={handleInlineProductDetails}
                  onQuickReply={handleQuickReply}
                  agenticState={currentState.agenticState}
                />
              </div>
            )}

            {!showHistory && messages.length === 0 && (
              <div className="border-t border-border p-3">
                <ChatThread
                  messages={[]}
                  onSendMessage={handleSendMessage}
                  onAddToCart={onAdd}
                  onCompare={handleCompare}
                  cartItems={currentState.cartItems}
                  isProcessing={currentState.isProcessing}
                  isCartOpen={false}
                  onSignIn={noop}
                  inputRef={inputRef}
                  onQuickReply={handleQuickReply}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {/* basketStates keeps every conversation isolated per chat id */}
      <span className="hidden">{Object.keys(basketStates).length}</span>
    </div>
  );
};
