import { QuickReplyBar } from "@/components/chat/QuickReplyBar";
import { resolveQuickReplies } from "@/lib/quickReplies";
import { StreamText, useStreamingMessage } from "@/components/chat/StreamText";
import { UserMessageActions, AgentMessageActions } from "@/components/chat/MessageActions";
import { useState, useRef, useEffect } from "react";
import { Square, ArrowUp, Paperclip, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage, Product, QuickReply, AgenticState, PaymentMethod, DeliveryAddress, CartItem, encodeJourneyAnswer } from "@/data/petabadData";
import { ChatProductCard } from "./ChatProductCard";
import { CategorySelector } from "./CategorySelector";
import { ProductDetailsModal } from "./ProductDetailsModal";
import { PDPProductComponent } from "./PDPProductComponent";
import {
  QuickReplyButtons,
  CTAButton,
  CartSummaryCard,
  AddressConfirmation,
  AddressSelector,
  PaymentSelector,
} from "./AgenticMessageComponents";
import { AddressShippingSelector, MerchantShipping } from "./AddressShippingSelector";
import { ClarificationBlock, JourneyCard, answerAfter } from "@/components/petabad/ClarificationBlocks";
import { getThinkingLabel } from "@/features/petabad/hooks/loadingLabel";
import { ShiningText } from "@/components/petabad/ShiningText";
import { PetabadMark } from "@/components/petabad/PetabadBrand";
import { WanderingEyes } from "@/components/petabad/WanderingEyes";
import { TypingText } from "@/components/petabad/TypingText";



const placeholderTexts = [
  "«غذای خشک سگ برای نژاد کوچک»",
  "«خوراک گربه حساس معده»",
  "«خودت برام خرید حیوان خانگی کن»",
];

interface ChatThreadProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onStop?: () => void;
  onResend?: (messageId: string) => void;
  onFeedback?: (messageId: string, value: 'up' | 'down' | null) => void;
  onAddToCart: (product: Product) => void;
  onCompare: (product: Product) => void;
  onSaveProduct?: (product: Product) => void;
  cartItems: CartItem[];
  isProcessing: boolean;
  isCartOpen: boolean;
  onSignIn: () => void;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  setInputValue?: (value: string) => void;
  savedProductIds?: string[];
  onInlineProductDetails?: (product: Product) => void;
  onQuickReply?: (reply: QuickReply) => void;
  onFinalizePurchase?: (action?: string) => void;
  onAddressConfirm?: () => void;
  onAddressSelect?: (addressId: string) => void;
  selectedAddressId?: string | null;
  merchantShipping?: MerchantShipping[];
  selectedShippingByMerchant?: Record<string, string>;
  onSelectShipping?: (merchantId: string, shippingId: string) => void;
  onAddNewAddress?: (address: Omit<DeliveryAddress, "id">) => void;
  onPaymentSelect?: (paymentId: string) => void;
  agenticState?: AgenticState;
  /** Embedded (floating widget) mode: no storefront top bar, fills its container. */
  embedded?: boolean;
}

export const ChatThread = ({
  messages,
  onSendMessage,
  onStop,
  onResend,
  onFeedback,
  onAddToCart,
  onCompare,
  onSaveProduct,
  cartItems,
  isProcessing,
  isCartOpen,
  onSignIn,
  inputRef: externalInputRef,
  setInputValue: externalSetInputValue,
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
  agenticState,
  embedded = false,
}: ChatThreadProps) => {
  const [inputValue, setInputValueInternal] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { streamingId, onDone: onStreamDone } = useStreamingMessage(messages as any);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const barReplies = resolveQuickReplies({ messages: messages as any, cartCount: cartItems.length, checkoutStep: (agenticState as any)?.step, isProcessing });
  const pickQuickReply = (text: string) => {
    setInputValue(text);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) { el.focus(); el.setSelectionRange(text.length, text.length); }
    });
  };

  const setInputValue = externalSetInputValue || setInputValueInternal;
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    if (inputValue) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [inputValue]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 160) + 'px';
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    <div
      className={`flex-1 flex flex-col ${embedded ? "h-full" : "h-screen"} bg-gradient-to-br from-background via-background to-primary/5`}
      dir="rtl"
      style={{
        marginLeft: isCartOpen ? '340px' : '0',
        transition: 'margin-left 0.3s ease-out',
      }}
    >
      {/* Fixed Top Bar */}
      {!embedded && (
      <div
        className="sticky top-0 z-20 shrink-0 h-[72px] px-4 flex items-center justify-between border-b border-border/40 bg-background transition-all duration-300"
      >
        <CategorySelector activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs" style={{ background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.12)' }}>
          <span className="text-foreground/80">همراه پت آباد، خیالت از خرید لوازم حیوان خانگی راحت باشه!</span>
        </div>
      </div>
      )}

      {/* Messages Area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="max-w-[820px] mx-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`space-y-4 animate-fade-in ${msg.id === streamingId ? "stream-pending" : "stream-revealed"}`} dir="ltr">
              {/* Message Bubble — skipped when the turn carries no text */}
              {msg.content?.trim() && (
              <div dir="ltr" className={`stream-text-row flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <PetabadMark size="avatar" />
                )}
                <div
                  dir="rtl"
                  className={`max-w-[70%] px-4 py-3 ${msg.role === 'user' ? 'rounded-[16px_16px_4px_16px]' : 'rounded-[16px_16px_16px_4px]'}`}
                  style={{
                    background: msg.role === 'user' ? 'hsl(var(--primary) / 0.1)' : 'hsl(0 0% 100%)',
                    border: '1px solid hsl(0 0% 0% / 0.06)',
                  }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {<StreamText active={msg.id === streamingId} onDone={onStreamDone} text={msg.content
                      .replace(/\*\*(.*?)\*\*/g, '$1')
                      .replace(/\*(.*?)\*/g, '$1')
                      .replace(/^#{1,6}\s+/gm, '')
                      .replace(/^[-*]\s+/gm, '• ')} />}
                  </p>
                </div>
              </div>
              )}
              {msg.content?.trim() && msg.role === 'user' && (
                <UserMessageActions
                  className="justify-start"
                  text={msg.content}
                  status={msg.deliveryStatus}
                  disabled={isProcessing}
                  onResend={onResend ? () => onResend(msg.id) : undefined}
                />
              )}
              {msg.content?.trim() && msg.role === 'assistant' && onFeedback && !msg.id.startsWith('welcome') && (
                <AgentMessageActions
                  className="pl-11"
                  feedback={msg.feedback}
                  onFeedback={(v) => onFeedback(msg.id, v)}
                />
              )}


              {/* Interactive clarification card */}
              {msg.clarification && (
                <div className="ml-11 mr-auto w-[calc(100%-2.75rem)] max-w-[520px]" dir="rtl">
                  <ClarificationBlock
                    clarification={msg.clarification}
                    onAnswer={onSendMessage}
                    resolvedWith={answerAfter(messages, msg.id)}
                  />
                </div>
              )}

              {/* One card for the whole guidance journey */}
              {msg.journey && (
                <div className="ml-11 mr-auto w-[calc(100%-2.75rem)] max-w-[520px]" dir="rtl">
                  <JourneyCard
                    journey={msg.journey}
                    onAnswer={(answer) => onSendMessage(encodeJourneyAnswer({ messageId: msg.id, answer }))}
                    onRedo={(redoIndex) => onSendMessage(encodeJourneyAnswer({ messageId: msg.id, answer: "", redoIndex }))}
                  />
                </div>
              )}

              {/* Product Cards */}
              {msg.products && msg.products.length > 0 && (
                <div className="ml-11 mr-auto w-[calc(100%-2.75rem)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" dir="rtl">
                  {msg.products.slice(0, 12).map((product, index) => (

                    <ChatProductCard
                      key={product.id}
                      product={product}
                      index={(msg.productIndexStart || 1) + index}
                      onAddToCart={onAddToCart}
                      onCompare={onCompare}
                      onSave={onSaveProduct}
                      onViewDetails={setQuickViewProduct}
                      onInlineDetails={onInlineProductDetails}
                      useInlineDetails={true}
                      isInCart={cartItems.some(item => item.id === product.id)}
                      isSaved={savedProductIds.includes(product.id)}
                    />
                  ))}
                </div>
              )}

              {/* Inline Product Details */}
              {msg.inlineProduct && (
                <div className="ml-11 mr-auto w-[calc(100%-2.75rem)] max-w-[600px]" dir="rtl">
                  <PDPProductComponent
                    product={msg.inlineProduct}
                    isInCart={cartItems.some(item => item.id === msg.inlineProduct?.id)}
                    onAddToCart={onAddToCart}
                    showContextLabel={false}
                  />
                </div>
              )}

              {/* Address + Shipping Selector */}
              {msg.addressShipping && onAddressConfirm && onSelectShipping && onAddNewAddress && (
                <div className="ml-11 mr-auto w-[calc(100%-2.75rem)] max-w-[560px]" dir="rtl">
                  <AddressShippingSelector
                    mode={msg.addressShipping.mode}
                    startWithForm={msg.addressShipping.openForm}
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

              {/* Address Selector */}
              {msg.addressSelector && !msg.addressShipping && onAddressSelect && onAddressConfirm && (
                <div className="ml-11 mr-auto w-[calc(100%-2.75rem)] max-w-[450px]" dir="rtl">
                  <AddressSelector
                    addresses={msg.addressSelector}
                    selectedAddressId={selectedAddressId || null}
                    onSelect={(address) => onAddressSelect(address.id)}
                    onConfirm={onAddressConfirm}
                  />
                </div>
              )}

              {/* Legacy Address Confirmation */}
              {msg.addressConfirmation && !msg.addressSelector && !msg.addressShipping && onAddressConfirm && (
                <div className="ml-11 mr-auto w-[calc(100%-2.75rem)] max-w-[400px]" dir="rtl">
                  <AddressConfirmation address={msg.addressConfirmation} onConfirm={onAddressConfirm} onEdit={() => {}} />
                </div>
              )}

              {/* Payment Options */}
              {msg.paymentOptions && (
                <div className="ml-11 mr-auto w-[calc(100%-2.75rem)] max-w-[400px]" dir="rtl">
                  <PaymentSelector
                    options={msg.paymentOptions}
                    selectedPayment={selectedPayment}
                    onSelect={handlePaymentSelection}
                  />
                </div>
              )}

              {/* Order Summary Card */}
              {msg.orderSummary && (
                <div className="ml-11 mr-auto w-[calc(100%-2.75rem)] max-w-[480px]" dir="rtl">
                  <CartSummaryCard orderSummary={msg.orderSummary} cartItems={cartItems} />
                </div>
              )}

              {/* Quick Reply Buttons */}
              {msg.quickReplies && onQuickReply && (
                <div className="ml-11 mr-auto w-fit max-w-[calc(100%-2.75rem)]" dir="rtl">
                  <QuickReplyButtons replies={msg.quickReplies} onSelect={onQuickReply} />
                </div>
              )}

              {/* CTA Button */}
              {msg.ctaButton && onFinalizePurchase && (
                <div className="ml-11 mr-auto w-[calc(100%-2.75rem)] max-w-[300px]" dir="rtl">
                  <CTAButton
                    label={msg.ctaButton.label}
                    onClick={() => onFinalizePurchase(msg.ctaButton?.action)}
                    disabled={msg.ctaButton.disabled}
                    disabledReason={msg.ctaButton.disabledReason}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Processing Indicator */}
          {isProcessing && !messages.some((m) => m.journey?.status === "checking") && (
            <div dir="ltr" className="flex items-center justify-start gap-3 animate-fade-in">
              <PetabadMark size="avatar" />
              <div dir="rtl" className="rounded-[16px_16px_16px_4px] border border-border/60 bg-card px-4 py-3" >
                <div className="flex items-center gap-2">
                  <WanderingEyes className="h-5 w-[45px] text-primary" />
                  <ShiningText text={thinkingLabel} className="text-xs" />
                </div>

              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="bg-gradient-to-t from-background via-background/80 to-transparent pt-2.5 pb-4">
        <div className="max-w-[820px] mx-auto px-4 space-y-2.5">
          <QuickReplyBar replies={barReplies} onPick={pickQuickReply} />
        <form onSubmit={handleSubmit}>
          <div
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            
          >
            <div className="relative min-w-0 flex-1">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder=""
                disabled={isProcessing}
                rows={1}
                aria-label="پیام شما"
                className="block w-full min-h-[48px] max-h-[160px] bg-transparent border-none focus:outline-none focus:ring-0 text-right text-base leading-6 resize-none py-3 px-2"
                dir="rtl"
              />
              {!inputValue && (
                <div
                  className="absolute inset-0 flex items-center pointer-events-none px-2 py-3"
                  dir="rtl"
                >
                  <TypingText
                    key={placeholderIndex}
                    text={placeholderTexts[placeholderIndex]}
                    className="text-muted-foreground/50 text-base text-right w-full leading-6"
                  />
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border bg-muted/40" title="ارسال فایل" aria-label="ارسال فایل">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-border bg-muted/40" title="پیام صوتی" aria-label="پیام صوتی">
                <Mic className="w-4 h-4 text-muted-foreground" />
              </Button>
              {isProcessing && onStop ? (
                <Button type="button" onClick={onStop} aria-label="توقف پاسخ" className="h-10 w-10 rounded-xl shadow-none">
                  <Square className="w-4 h-4" fill="currentColor" />
                </Button>
              ) : (
              <Button type="submit" aria-label="ارسال پیام" disabled={!inputValue.trim() || isProcessing} className="h-10 w-10 rounded-xl shadow-none">
                <ArrowUp className="w-5 h-5" />
              </Button>
              )}
            </div>
          </div>
        </form>
        </div>
      </div>

      {/* Quick View Modal */}
      <ProductDetailsModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={onAddToCart}
        isInCart={cartItems.some(item => item.id === quickViewProduct?.id)}
      />
    </div>
  );
};
