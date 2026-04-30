import { useState, useRef, useEffect } from "react";
import { ArrowUp, Zap, Mic, Layers, ShoppingBag, UserRound } from "lucide-react";
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
      textareaRef.current.style.height = "56px";
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

  return (
    <div className="flex flex-col h-full min-h-0 bg-gradient-to-b from-background via-background to-primary/5 mobile-no-img-label" dir="rtl">
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
      `}</style>
      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto pt-5 pb-2">
        <div className="px-3 space-y-5">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-3 animate-fade-in">
              <div
                className={`flex gap-2 ${
                  msg.role === "user" ? "justify-end flex-row-reverse" : "justify-end"
                }`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                    }}
                  >
                    <Zap className="w-3.5 h-3.5 text-white" />
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

              {/* Product cards — horizontal scroll on mobile */}
              {msg.products && msg.products.length > 0 && (
                <div className="-mx-3 px-3 overflow-x-auto scrollbar-none">
                  <div className="flex gap-[0.375rem] pr-9 pb-1" style={{ width: "max-content" }}>
                    {msg.products.map((product, index) => (
                      <div key={product.id} className="w-[260px] flex-shrink-0">
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
                  />
                </div>
              )}

              {msg.addressShipping && onAddressConfirm && onSelectShipping && onAddNewAddress && (
                <div className="mr-9">
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
                <div className="mr-9">
                  <AddressSelector
                    addresses={msg.addressSelector}
                    selectedAddressId={selectedAddressId || null}
                    onSelect={(address) => onAddressSelect(address.id)}
                    onConfirm={onAddressConfirm}
                  />
                </div>
              )}

              {msg.addressConfirmation && !msg.addressSelector && !msg.addressShipping && onAddressConfirm && (
                <div className="mr-9">
                  <AddressConfirmation
                    address={msg.addressConfirmation}
                    onConfirm={onAddressConfirm}
                    onEdit={() => {}}
                  />
                </div>
              )}

              {msg.paymentOptions && (
                <div className="mr-9">
                  <PaymentSelector
                    options={msg.paymentOptions}
                    selectedPayment={selectedPayment}
                    onSelect={handlePaymentSelection}
                  />
                </div>
              )}

              {msg.orderSummary && (
                <div className="mr-9">
                  <CartSummaryCard orderSummary={msg.orderSummary} cartItems={cartItems} />
                </div>
              )}

              {msg.quickReplies && onQuickReply && (
                <div className="mr-9">
                  <QuickReplyButtons replies={msg.quickReplies} onSelect={onQuickReply} />
                </div>
              )}

              {msg.ctaButton && onFinalizePurchase && (
                <div className="mr-9">
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
            <div className="flex gap-2 animate-fade-in justify-end">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                }}
              >
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <div
                className="rounded-[16px_16px_16px_4px] px-3.5 py-2.5"
                style={{
                  background: "hsl(0 0% 100%)",
                  border: "1px solid hsl(0 0% 0% / 0.06)",
                }}
              >
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
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* Bottom input — mirrors landing */}
      <div
        className="px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
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
          <div className="relative flex-1">
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
              className="w-full min-h-[56px] max-h-[120px] bg-transparent border-none focus:outline-none focus:ring-0 text-right text-base resize-none py-2.5 px-2"
              style={{ lineHeight: "1.5" }}
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

        {/* Action bar — frameless icons, opens corresponding bottom-sheet tab */}
        {(onOpenBaskets || onOpenCart || onOpenAccount) && (
          <div className="flex items-center justify-center gap-[3.16rem] mt-3">
            {[
              { key: "baskets", icon: Layers, label: "سبدها", onClick: onOpenBaskets },
              { key: "cart", icon: ShoppingBag, label: "سبد خرید", onClick: onOpenCart },
              { key: "account", icon: UserRound, label: "حساب", onClick: onOpenAccount },
            ].map(({ key, icon: Icon, label, onClick }) => (
              <button
                key={key}
                type="button"
                onClick={onClick}
                aria-label={label}
                className="flex items-center justify-center active:scale-90 transition-transform p-1.5"
              >
                <Icon className="w-[26px] h-[26px] text-foreground/75" strokeWidth={1.75} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
