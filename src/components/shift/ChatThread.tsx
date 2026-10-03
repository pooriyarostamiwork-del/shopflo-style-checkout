import { useState, useRef, useEffect } from "react";
import { ArrowUp, Zap, Paperclip, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage, Product, QuickReply, AgenticState, PaymentMethod, DeliveryAddress, CartItem } from "@/features/shift/data/shiftData";
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
import { useShiftStore } from "@/features/shift/context/ShiftStoreContext";


const placeholderTexts = [
  "«هدفون نویز کنسلینگ زیر ۵ میلیون»",
  "«بهترین تخفیف‌های امروز چیه؟»",
  "«خودت برام خرید کن»",
];

interface ChatThreadProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
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
}

export const ChatThread = ({
  messages,
  onSendMessage,
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
}: ChatThreadProps) => {
  const [inputValue, setInputValueInternal] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const setInputValue = externalSetInputValue || setInputValueInternal;
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { store, content } = useShiftStore();
  const isPetStore = store?.slug === 'petplayground';

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
  }, [messages]);

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

  return (
    <div
      className="flex-1 flex flex-col h-screen bg-gradient-to-br from-background via-background to-primary/5"
      dir="rtl"
      style={{
        marginLeft: isCartOpen ? '340px' : '0',
        transition: 'margin-left 0.3s ease-out',
      }}
    >
      {/* Fixed Top Bar */}
      <div
        className="sticky top-0 z-20 h-[72px] shrink-0 px-4 flex items-center justify-between border-b border-border/40 bg-background transition-all duration-300"
      >
        <CategorySelector activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        {content('home.promo_banner', '') && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs" style={{ background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.12)' }}>
            <span className="text-foreground/80">{content('home.promo_banner')}</span>
            {content('home.promo_link_label', '') && (
              <span className="text-primary font-semibold cursor-pointer hover:underline">{content('home.promo_link_label')}</span>
            )}
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="max-w-[820px] mx-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-4 animate-fade-in" dir="ltr">
              {/* Message Bubble */}
              <div dir="ltr" className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))' }}
                  >
                    <Zap className="w-4 h-4 text-primary-foreground" />
                  </div>
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
                    {msg.content
                      .replace(/\*\*(.*?)\*\*/g, '$1')
                      .replace(/\*(.*?)\*/g, '$1')
                      .replace(/^#{1,6}\s+/gm, '')
                      .replace(/^[-*]\s+/gm, '• ')
                    }
                  </p>
                </div>
              </div>

              {/* Product Cards */}
              {msg.products && msg.products.length > 0 && (
                <div className="ml-11 mr-auto w-[calc(100%-2.75rem)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" dir="rtl">
                  {msg.products.map((product, index) => (
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
                    onClick={onFinalizePurchase}
                    disabled={msg.ctaButton.disabled}
                    disabledReason={msg.ctaButton.disabledReason}
                  />
                </div>
              )}
            </div>
          ))}

          {/* Processing Indicator */}
          {isProcessing && (
            <div dir="ltr" className="flex items-center justify-start gap-3 animate-fade-in">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))' }}
              >
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <div dir="rtl" className="rounded-[16px_16px_16px_4px] border border-border/60 bg-card px-4 py-3" >
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="shrink-0 bg-gradient-to-t from-background via-background/80 to-transparent pt-2.5 pb-4">
        <form onSubmit={handleSubmit} className="max-w-[820px] mx-auto px-4">
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
                  <span
                    key={placeholderIndex}
                    className="text-muted-foreground/50 text-base text-right w-full whitespace-normal break-words leading-6"
                  >
                    {placeholderTexts[placeholderIndex]}
                  </span>
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
              <Button type="submit" aria-label="ارسال پیام" disabled={!inputValue.trim() || isProcessing} className="h-10 w-10 rounded-xl shadow-none">
                <ArrowUp className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </form>
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
