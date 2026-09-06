import { useState, useRef, useEffect } from "react";
import { ArrowUp, Paperclip, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage, Product, QuickReply, AgenticState, PaymentMethod, DeliveryAddress, CartItem } from "@/data/gptCommerceData";
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
import { ClarificationBlock } from "@/components/petabad/ClarificationBlocks";
import { getThinkingLabel } from "@/features/petabad/hooks/loadingLabel";
import { ShiningText } from "@/components/petabad/ShiningText";
import { PetabadMark } from "@/components/petabad/PetabadBrand";
import { WanderingEyes } from "@/components/petabad/WanderingEyes";
import { TypingText } from "@/components/petabad/TypingText";



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
      textareaRef.current.style.height = '56px';
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
      className="flex-1 flex flex-col h-screen bg-gradient-to-br from-background via-background to-primary/5"
      dir="rtl"
      style={{
        marginLeft: isCartOpen ? '340px' : '0',
        transition: 'margin-left 0.3s ease-out',
      }}
    >
      {/* Fixed Top Bar */}
      <div
        className="sticky top-0 z-20 p-4 flex items-center justify-between transition-all duration-300"
        style={{
          background: 'hsl(0 0% 100% / 0.9)',
          borderBottom: '1px solid hsl(0 0% 0% / 0.06)',
        }}
      >
        <CategorySelector activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs" style={{ background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.12)' }}>
          <span className="text-foreground/80">همراه پت آباد، خیالت از خرید لوازم حیوان خانگی راحت باشه!</span>
          <span className="text-primary font-semibold cursor-pointer hover:underline">دریافت وام فلوپی</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[820px] mx-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-4 animate-fade-in">
              {/* Message Bubble — skipped when the turn carries no text */}
              {msg.content?.trim() && (
              <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <PetabadMark size="avatar" />
                )}
                <div
                  className={`max-w-[70%] px-4 py-3 ${msg.role === 'user' ? 'rounded-[16px_16px_4px_16px]' : 'rounded-[16px_16px_16px_4px]'}`}
                  style={{
                    background: msg.role === 'user' ? 'hsl(var(--primary) / 0.1)' : 'hsl(0 0% 100%)',
                    border: '1px solid hsl(0 0% 0% / 0.06)',
                  }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {msg.content
                      .replace(/\*\*(.*?)\*\*/g, '$1')
                      .replace(/\*(.*?)\*/g, '$1')
                      .replace(/^#{1,6}\s+/gm, '')
                      .replace(/^[-*]\s+/gm, '• ')
                    }
                  </p>
                </div>
              </div>
              )}


              {/* Interactive clarification card */}
              {msg.clarification && (
                <div className="mr-11 max-w-[520px]">
                  <ClarificationBlock clarification={msg.clarification} onAnswer={onSendMessage} />
                </div>
              )}

              {/* Product Cards */}
              {msg.products && msg.products.length > 0 && (
                <div className="mr-11 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <div className="mr-11 max-w-[600px]">
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
                <div className="mr-11 max-w-[560px]">
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
                <div className="mr-11 max-w-[450px]">
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
                <div className="mr-11 max-w-[400px]">
                  <AddressConfirmation address={msg.addressConfirmation} onConfirm={onAddressConfirm} onEdit={() => {}} />
                </div>
              )}

              {/* Payment Options */}
              {msg.paymentOptions && (
                <div className="mr-11 max-w-[400px]">
                  <PaymentSelector
                    options={msg.paymentOptions}
                    selectedPayment={selectedPayment}
                    onSelect={handlePaymentSelection}
                  />
                </div>
              )}

              {/* Order Summary Card */}
              {msg.orderSummary && (
                <div className="mr-11 max-w-[480px]">
                  <CartSummaryCard orderSummary={msg.orderSummary} cartItems={cartItems} />
                </div>
              )}

              {/* Quick Reply Buttons */}
              {msg.quickReplies && onQuickReply && (
                <div className="mr-11">
                  <QuickReplyButtons replies={msg.quickReplies} onSelect={onQuickReply} />
                </div>
              )}

              {/* CTA Button */}
              {msg.ctaButton && onFinalizePurchase && (
                <div className="mr-11 max-w-[300px]">
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
            <div className="flex gap-3 animate-fade-in">
              <PetabadMark size="avatar" />
              <div className="rounded-[16px_16px_16px_4px] px-4 py-3" style={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(0 0% 0% / 0.06)' }}>
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
      <div className="border-t" style={{ background: 'hsl(0 0% 100%)', borderColor: 'hsl(0 0% 0% / 0.06)' }}>
        <form onSubmit={handleSubmit} className="max-w-[820px] mx-auto p-4">
          <div
            className="flex items-end gap-3 p-3 rounded-xl"
            style={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(0 0% 0% / 0.08)' }}
          >
            <div className="relative flex-1">
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
                className="w-full min-h-[56px] max-h-[160px] bg-transparent border-none focus:outline-none focus:ring-0 text-right resize-none py-3 px-2"
                style={{ lineHeight: '1.6' }}
                dir="rtl"
              />
              {!inputValue && (
                <div
                  className="absolute inset-0 flex items-start pointer-events-none px-2 py-3"
                  dir="rtl"
                >
                  <TypingText
                    key={placeholderIndex}
                    text={placeholderTexts[placeholderIndex]}
                    className="text-muted-foreground/50 text-base text-right w-full leading-snug"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pb-1">
              <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110" style={{ background: 'hsl(0 0% 98%)', border: '1px solid hsl(0 0% 0% / 0.06)' }} title="ارسال فایل">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              </button>
              <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110" style={{ background: 'hsl(0 0% 98%)', border: '1px solid hsl(0 0% 0% / 0.06)' }} title="پیام صوتی">
                <Mic className="w-4 h-4 text-muted-foreground" />
              </button>
              <Button type="submit" disabled={!inputValue.trim() || isProcessing} className="h-10 w-10 rounded-xl">
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
