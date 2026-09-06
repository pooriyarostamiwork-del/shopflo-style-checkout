import { useState, useRef, useEffect } from "react";
import { ArrowUp, Zap, Mic, MessagesSquare, ShoppingBag, UserRound } from "lucide-react";
import { toPersianNumber } from "@/data/gptCommerceData";
import flowcartLogo from "@/assets/flowcart-logo.svg";
import { Button } from "@/components/ui/button";
import {
  ChatMessage,
  Product,
  QuickReply,
  AgenticState,
  DeliveryAddress,
  CartItem,
} from "@/data/gptCommerceData";
import { ChatProductCard } from "@/components/gpt-commerce/ChatProductCard";
import { PDPProductComponent } from "@/components/gpt-commerce/PDPProductComponent";
import {
  QuickReplyButtons,
  CTAButton,
  CartSummaryCard,
  AddressConfirmation,
  AddressSelector,
  PaymentSelector,
} from "@/components/gpt-commerce/AgenticMessageComponents";
import {
  AddressShippingSelector,
  MerchantShipping,
} from "@/components/gpt-commerce/AddressShippingSelector";
import { ClarificationBlock } from "@/components/gpt-commerce/ClarificationBlocks";
import { getThinkingLabel } from "@/features/gpt-commerce/hooks/loadingLabel";
import { ShiningText } from "@/components/gpt-commerce/ShiningText";




interface MobileChatThreadProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onAddToCart: (product: Product) => void;
  onCompare: (product: Product) => void;
  onSaveProduct?: (product: Product) => void;
  cartItems: CartItem[];
  isProcessing: boolean;
  savedProductIds?: string[];
  onInlineProductDetails?: (product: Product) => void;
  onQuickReply?: (reply: QuickReply) => void;
  onFinalizePurchase?: () => void;
  onAddressConfirm?: () => void;
  onAddressSelect?: (addressId: string) => void;
  selectedAddressId?: string | null;
  merchantShipping?: MerchantShipping[];
  selectedShippingByMerchant?: Record<string, string>;
  onSelectShipping?: (merchantId: string, shippingId: string) => void;
  onAddNewAddress?: (address: Omit<DeliveryAddress, "id">) => void;
  onPaymentSelect?: (paymentId: string) => void;
  agenticState?: AgenticState;
  onBack: () => void;
  onNewChat: () => void;
  onOpenBaskets?: () => void;
  onOpenCart?: () => void;
  onOpenAccount?: () => void;
  basketCount?: number;
}

export const MobileChatThread = ({
  messages,
  onSendMessage,
  onAddToCart,
  onCompare,
  onSaveProduct,
  cartItems,
  isProcessing,
  savedProductIds = [],
  onInlineProductDetails,
  onQuickReply,
  onFinalizePurchase,
  onAddressConfirm,
  onAddressSelect,
  selectedAddressId,
  merchantShipping = [],
  selectedShippingByMerchant = {},
  onSelectShipping,
  onAddNewAddress,
  onPaymentSelect,
  onBack,
  onNewChat,
  onOpenBaskets,
  onOpenCart,
  onOpenAccount,
  basketCount = 0,
}: MobileChatThreadProps) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px";
      const sh = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(sh, 120) + "px";
    }
  }, [inputValue]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handlePaymentSelection = (paymentId: string) => {
    setSelectedPayment(paymentId);
    if (onPaymentSelect) onPaymentSelect(paymentId);
  };

  const thinkingLabel = getThinkingLabel(
    [...messages].reverse().find((m) => m.role === "user")?.content
  );

  return (

    <div className="relative flex flex-col h-full min-h-0 bg-gradient-to-br from-background via-background to-primary/5 mobile-no-img-label" dir="rtl">
      {/* Mobile-scoped overrides */}
      <style>{`
        .mobile-no-img-label [role="img"] > span { display: none !important; }
        .mobile-no-img-label .scrollbar-none::-webkit-scrollbar { display: none; }
        .mobile-no-img-label .scrollbar-none { scrollbar-width: none; -ms-overflow-style: none; }
        /* Mobile PDP layout */
        .mobile-pdp { margin-inline-start: 0 !important; margin-inline-end: 0 !important; }
        .mobile-pdp .p-4 { padding: 0.875rem !important; }
        .mobile-pdp > div > div.p-4 > div.flex.gap-6 {
          flex-direction: column !important;
          gap: 1rem !important;
        }
        .mobile-pdp .w-56 {
          width: 100% !important;
          max-width: 280px !important;
          margin-inline: auto !important;
        }
        .mobile-pdp .w-28 { width: auto !important; min-width: 5.5rem !important; flex-shrink: 0 !important; }
        /* Chat product card — give action row breathing room above sticky input */
        .mobile-chat-card-wrap > div {
          height: 460px !important;
        }
      `}</style>

      {/* Floating bento decorations — match landing */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="absolute" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)", borderRadius: "20px", backdropFilter: "blur(28px)", opacity: 0.29, width: 110, height: 140, top: 80, right: -20, transform: "rotate(-3deg)" }}>
          <div className="w-full h-20 rounded-t-[16px] bg-gradient-to-br from-primary/5 to-primary/10" />
          <div className="p-2.5 space-y-2">
            <div className="h-2.5 bg-foreground/20 rounded w-3/4" />
            <div className="h-2 bg-foreground/10 rounded w-1/2" />
          </div>
        </div>
        <div className="absolute flex items-center justify-center" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)", borderRadius: "20px", backdropFilter: "blur(28px)", opacity: 0.29, width: 90, height: 32, top: 220, left: -10, transform: "rotate(2deg)" }}>
          <span className="text-[10px] text-foreground/30">٪۱۰ تخفیف</span>
        </div>
        <div className="absolute" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)", borderRadius: "20px", backdropFilter: "blur(28px)", opacity: 0.29, width: 100, height: 120, bottom: 220, left: -20, transform: "rotate(-2deg)" }}>
          <div className="w-full h-16 rounded-t-[16px] bg-gradient-to-br from-primary/5 to-primary/10" />
          <div className="p-2 space-y-1.5">
            <div className="h-2 bg-foreground/20 rounded w-3/4" />
            <div className="h-1.5 bg-foreground/10 rounded w-1/2" />
          </div>
        </div>
      </div>

      {/* Messages — scrolls full height; floating input sits above with extra bottom padding */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto pt-5 pb-56">
        <div className="px-3 space-y-5">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-3 animate-fade-in">
              {msg.content?.trim() && (
              <div
                className={`flex gap-2 ${
                  msg.role === "user" ? "justify-end flex-row-reverse" : "justify-start flex-row-reverse"
                }`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                    }}
                  >
                    <img src={flowcartLogo} alt="" style={{ width: "70%", height: "70%" }} draggable={false} />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 ${
                    msg.role === "user"
                      ? "rounded-[16px_16px_4px_16px]"
                      : "rounded-[16px_16px_16px_4px]"
                  }`}
                  style={{
                    background:
                      msg.role === "user"
                        ? "hsl(var(--primary) / 0.1)"
                        : "hsl(0 0% 100%)",
                    border: "1px solid hsl(0 0% 0% / 0.06)",
                  }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {msg.content
                      .replace(/\*\*(.*?)\*\*/g, "$1")
                      .replace(/\*(.*?)\*/g, "$1")
                      .replace(/^#{1,6}\s+/gm, "")
                      .replace(/^[-*]\s+/gm, "• ")}
                  </p>
                </div>
              </div>
              )}


              {/* Interactive clarification card */}
              {msg.clarification && (
                <div className="pr-1">
                  <ClarificationBlock clarification={msg.clarification} onAnswer={onSendMessage} />
                </div>
              )}

              {/* Product cards — horizontal scroll on mobile */}

              {msg.products && msg.products.length > 0 && (
                <div className="-mx-3 px-3 overflow-x-auto scrollbar-none">
                  <div className="flex gap-[0.375rem] pl-9 pb-1" style={{ width: "max-content" }}>
                    {msg.products.map((product, index) => (
                      <div key={product.id} className="w-auto flex-shrink-0 mobile-chat-card-wrap">
                        <ChatProductCard
                          product={product}
                          index={(msg.productIndexStart || 1) + index}
                          onAddToCart={onAddToCart}
                          onCompare={onCompare}
                          onSave={onSaveProduct}
                          onViewDetails={() => {}}
                          onInlineDetails={onInlineProductDetails}
                          useInlineDetails={true}
                          isInCart={cartItems.some((i) => i.id === product.id)}
                          isSaved={savedProductIds.includes(product.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {msg.inlineProduct && (
                <div className="mobile-pdp">
                  <PDPProductComponent
                    product={msg.inlineProduct}
                    isInCart={cartItems.some((i) => i.id === msg.inlineProduct?.id)}
                    onAddToCart={onAddToCart}
                    showContextLabel={false}
                    enableSwipeGallery={true}
                  />
                </div>
              )}


              {msg.addressShipping && onAddressConfirm && onSelectShipping && onAddNewAddress && (
                <div className="ml-9">
                  <AddressShippingSelector
                    mode={msg.addressShipping.mode}
                    addresses={msg.addressShipping.addresses}
                    selectedAddressId={selectedAddressId || null}
                    onSelectAddressId={(id) => onAddressSelect?.(id)}
                    merchantShipping={merchantShipping}
                    selectedShippingByMerchant={selectedShippingByMerchant}
                    onSelectShipping={onSelectShipping}
                    onSubmitNewAddress={onAddNewAddress}
                    onAddNewAddress={onAddNewAddress}
                    onConfirm={onAddressConfirm}
                  />
                </div>
              )}

              {msg.addressSelector && !msg.addressShipping && onAddressSelect && onAddressConfirm && (
                <div className="ml-9">
                  <AddressSelector
                    addresses={msg.addressSelector}
                    selectedAddressId={selectedAddressId || null}
                    onSelect={(address) => onAddressSelect(address.id)}
                    onConfirm={onAddressConfirm}
                  />
                </div>
              )}

              {msg.addressConfirmation && !msg.addressSelector && !msg.addressShipping && onAddressConfirm && (
                <div className="ml-9">
                  <AddressConfirmation
                    address={msg.addressConfirmation}
                    onConfirm={onAddressConfirm}
                    onEdit={() => {}}
                  />
                </div>
              )}

              {msg.paymentOptions && (
                <div className="ml-9">
                  <PaymentSelector
                    options={msg.paymentOptions}
                    selectedPayment={selectedPayment}
                    onSelect={handlePaymentSelection}
                  />
                </div>
              )}

              {msg.orderSummary && (
                <div className="ml-9">
                  <CartSummaryCard orderSummary={msg.orderSummary} cartItems={cartItems} />
                </div>
              )}

              {msg.quickReplies && onQuickReply && (
                <div className="ml-9">
                  <QuickReplyButtons replies={msg.quickReplies} onSelect={onQuickReply} />
                </div>
              )}

              {msg.ctaButton && onFinalizePurchase && (
                <div className="ml-9">
                  <CTAButton
                    label={msg.ctaButton.label}
                    onClick={onFinalizePurchase}
                    disabled={msg.ctaButton.disabled}
                    disabledReason={msg.ctaButton.disabledReason}
                  />
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-2 animate-fade-in justify-start flex-row-reverse">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                }}
              >
                <img src={flowcartLogo} alt="" style={{ width: "70%", height: "70%" }} draggable={false} />
              </div>
              <div
                className="rounded-[16px_16px_16px_4px] px-3.5 py-2.5"
                style={{
                  background: "hsl(0 0% 100%)",
                  border: "1px solid hsl(0 0% 0% / 0.06)",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <ShiningText text={thinkingLabel} className="text-[11px]" />
                </div>

              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* Bottom input — floats above messages with same gradient backdrop as landing */}
      <div
        className="absolute bottom-0 inset-x-0 z-30 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        style={{
          background:
            "linear-gradient(180deg, hsl(0 0% 100% / 0), hsl(0 0% 100% / 0.95) 30%)",
        }}
      >
        <form
          onSubmit={submit}
          className="flex items-center gap-2 p-2 rounded-2xl"
          style={{
            background: "hsl(0 0% 100%)",
            border: "1px solid hsl(0 0% 0% / 0.08)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <div className="relative flex-1 flex items-stretch min-h-[44px]">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder=""
              disabled={isProcessing}
              className="w-full max-h-[120px] bg-transparent border-none focus:outline-none focus:ring-0 text-right text-[15px] font-normal resize-none px-2 block"
              style={{ lineHeight: "22px", paddingBlock: "11px", letterSpacing: "-0.005em" }}
              dir="rtl"
            />
            {!inputValue && (
              <div
                className="absolute inset-0 flex items-center pointer-events-none px-2"
                dir="rtl"
              >
                <span className="text-muted-foreground/50 text-sm text-right w-full whitespace-normal break-words leading-snug">
                  از فلوکارت بخوا
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95"
              style={{
                background: "hsl(0 0% 98%)",
                border: "1px solid hsl(0 0% 0% / 0.06)",
              }}
              aria-label="پیام صوتی"
            >
              <Mic className="w-4 h-4 text-muted-foreground" />
            </button>
            <Button
              type="submit"
              disabled={!inputValue.trim() || isProcessing}
              className="h-9 w-9 rounded-full p-0"
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
          </div>
        </form>

        {/* Action bar — frameless icons with count badges on chats & cart */}
        {(onOpenBaskets || onOpenCart || onOpenAccount) && (
          <div className="flex items-center justify-center gap-[3.16rem] mt-3">
            {[
              { key: "baskets", icon: MessagesSquare, label: "چت‌ها", onClick: onOpenBaskets, count: basketCount },
              { key: "cart", icon: ShoppingBag, label: "سبد خرید", onClick: onOpenCart, count: cartItems.length },
              { key: "account", icon: UserRound, label: "حساب", onClick: onOpenAccount, count: 0 },
            ].map(({ key, icon: Icon, label, onClick, count }) => (
              <button
                key={key}
                type="button"
                onClick={onClick}
                aria-label={label}
                className="relative flex items-center justify-center active:scale-90 transition-transform p-1.5"
              >
                <Icon className="w-[26px] h-[26px] text-foreground/75" strokeWidth={1.75} />
                {count > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-[4px] flex items-center justify-center rounded-full text-[10px] font-bold leading-none"
                    style={{
                      background: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                      border: "1.5px solid hsl(0 0% 100%)",
                    }}
                  >
                    {toPersianNumber(count)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
