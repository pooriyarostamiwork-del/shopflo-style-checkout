import { useState, useRef, useEffect } from "react";
import { ArrowUp, Zap, Paperclip, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage, Product } from "@/data/gptCommerceData";
import { ProductCard } from "./ProductCard";
import { CategorySelector } from "./CategorySelector";
import { CouponChips } from "./CouponChips";
import { ProductCarousels } from "./ProductCarousels";
import { ProductQuickViewModal } from "./ProductQuickViewModal";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onAddToCart: (product: Product) => void;
  onCompare: (product: Product) => void;
  cartItems: Product[];
  isProcessing: boolean;
  onCheckout: () => void;
  hasStartedChat: boolean;
  onStartChat: () => void;
  isCartOpen: boolean;
}

// Rotating placeholder texts
const placeholderTexts = [
  "«هدفون نویز کنسلینگ زیر ۵ میلیون»",
  "«بهترین تخفیف‌های امروز چیه؟»",
  "«خودت برام خرید کن»",
];

export const ChatInterface = ({
  messages,
  onSendMessage,
  onAddToCart,
  onCompare,
  cartItems,
  isProcessing,
  onCheckout,
  hasStartedChat,
  onStartChat,
  isCartOpen,
}: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [appliedCoupons, setAppliedCoupons] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Rotate placeholders every 3.5 seconds when idle
  useEffect(() => {
    if (isFocused || inputValue) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isFocused, inputValue]);

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
      if (!hasStartedChat) {
        onStartChat();
      }
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleApplyCoupon = (couponId: string) => {
    setAppliedCoupons((prev) => [...prev, couponId]);
  };

  const handleAskAbout = (productName: string) => {
    const message = `درباره ${productName} بیشتر توضیح بده`;
    if (!hasStartedChat) {
      onStartChat();
    }
    onSendMessage(message);
    setQuickViewProduct(null);
  };

  const quickActions = [
    { label: 'هدفون بی‌سیم می‌خوام', action: 'هدفون بی‌سیم خوب با ارسال سریع می‌خوام' },
    { label: 'مقایسه محصولات', action: 'این محصولات رو با هم مقایسه کن' },
    { label: 'خودت خرید رو انجام بده', action: 'خودت خرید رو انجام بده' },
  ];

  const isIdle = !isFocused && !inputValue;

  // Initial centered state before first query
  if (!hasStartedChat) {
    return (
      <div 
        className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-y-auto" 
        dir="rtl"
      >
        {/* Fixed Top Bar */}
        <div 
          className="sticky top-0 z-20 p-4 flex items-center justify-between backdrop-blur-xl"
          style={{
            background: 'hsl(0 0% 100% / 0.8)',
            borderBottom: '1px solid hsl(0 0% 0% / 0.05)',
          }}
        >
          <CategorySelector activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          <CouponChips onApplyCoupon={handleApplyCoupon} appliedCoupons={appliedCoupons} />
        </div>

        {/* Hero Section - Centered Chat */}
        <div className="flex flex-col items-center justify-center min-h-[50vh] py-12 px-6">
          {/* Logo & Welcome */}
          <div className="flex flex-col items-center gap-6 mb-8">
            <div 
              className="w-20 h-20 rounded-2xl flex items-center justify-center backdrop-blur-xl"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.1))',
                boxShadow: '0 8px 32px hsl(var(--primary) / 0.2), inset 0 1px 0 hsl(0 0% 100% / 0.3)',
                border: '1px solid hsl(0 0% 100% / 0.2)'
              }}
            >
              <Zap className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Flowcart</h1>
              <p className="text-muted-foreground">دستیار خرید هوشمند شما</p>
            </div>
          </div>

          {/* Centered Glass Chatbox */}
          <div className="w-full max-w-[720px] mx-auto">
            <form onSubmit={handleSubmit}>
              <div 
                className={`relative rounded-[20px] backdrop-blur-xl overflow-hidden transition-all duration-300 ${isIdle ? 'animate-breathing animate-glow-pulse' : ''}`}
                style={{
                  background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.9), hsl(0 0% 100% / 0.7))',
                  boxShadow: isFocused 
                    ? '0 8px 40px rgba(0, 0, 0, 0.12), 0 0 80px hsl(var(--primary) / 0.15), inset 0 1px 0 hsl(0 0% 100% / 0.5)'
                    : '0 8px 40px rgba(0, 0, 0, 0.08), 0 0 60px hsl(var(--primary) / 0.1), inset 0 1px 0 hsl(0 0% 100% / 0.5)',
                  border: '1px solid hsl(0 0% 100% / 0.3)'
                }}
              >
                <div className="relative flex items-end gap-3 p-4">
                  {/* Textarea with auto-expand */}
                  <div className="relative flex-1">
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                      placeholder=""
                      className="w-full min-h-[56px] max-h-[160px] bg-transparent border-none focus:outline-none focus:ring-0 text-right text-base resize-none leading-relaxed py-4 px-3"
                      style={{ lineHeight: '1.6' }}
                      dir="rtl"
                    />
                    {/* Animated placeholder - RTL aligned */}
                    {!inputValue && (
                      <div className="absolute inset-0 flex items-center pointer-events-none px-3 py-4" dir="rtl">
                        <span 
                          key={placeholderIndex}
                          className="text-muted-foreground/60 text-base animate-fade-in text-right w-full"
                          style={{ animationDuration: '300ms' }}
                        >
                          {placeholderTexts[placeholderIndex]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Input Actions */}
                  <div className="flex items-center gap-2 pb-2">
                    {/* File Upload */}
                    <button
                      type="button"
                      className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-200 hover:scale-110"
                      style={{
                        background: 'hsl(0 0% 100% / 0.6)',
                        border: '1px solid hsl(0 0% 0% / 0.08)',
                      }}
                      title="ارسال فایل"
                    >
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                    </button>
                    
                    {/* Voice Message */}
                    <button
                      type="button"
                      className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-200 hover:scale-110"
                      style={{
                        background: 'hsl(0 0% 100% / 0.6)',
                        border: '1px solid hsl(0 0% 0% / 0.08)',
                      }}
                      title="پیام صوتی"
                    >
                      <Mic className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {/* Send Button */}
                    <Button
                      type="submit"
                      disabled={!inputValue.trim()}
                      className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 transition-all duration-300"
                      style={{
                        boxShadow: inputValue.trim() ? '0 4px 20px hsl(var(--primary) / 0.4)' : 'none'
                      }}
                    >
                      <ArrowUp className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </form>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (action.action.includes('خرید')) {
                      onCheckout();
                    } else {
                      setInputValue(action.action);
                    }
                  }}
                  className="text-sm px-4 py-2 rounded-full backdrop-blur-xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'hsl(0 0% 100% / 0.6)',
                    border: '1px solid hsl(0 0% 100% / 0.3)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable Commerce Area */}
        <ProductCarousels 
          onAddToCart={onAddToCart} 
          onQuickView={setQuickViewProduct}
          onAskAbout={handleAskAbout}
          cartItems={cartItems} 
        />

        {/* Quick View Modal */}
        <ProductQuickViewModal
          product={quickViewProduct}
          isOpen={!!quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={onAddToCart}
          onAskAbout={handleAskAbout}
          isInCart={cartItems.some(item => item.id === quickViewProduct?.id)}
        />
      </div>
    );
  }

  // Active chat state
  return (
    <div 
      className="flex-1 flex flex-col h-screen bg-gradient-to-br from-background via-background to-primary/5" 
      dir="rtl"
      style={{
        marginLeft: isCartOpen ? '340px' : '0',
        transition: 'margin-left 0.5s ease-out'
      }}
    >
      {/* Fixed Top Bar */}
      <div 
        className="sticky top-0 z-20 p-4 flex items-center justify-between backdrop-blur-xl"
        style={{
          background: 'hsl(0 0% 100% / 0.8)',
          borderBottom: '1px solid hsl(0 0% 0% / 0.05)',
        }}
      >
        <CategorySelector activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        {appliedCoupons.length < 4 && (
          <CouponChips onApplyCoupon={handleApplyCoupon} appliedCoupons={appliedCoupons} />
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[820px] mx-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-4 animate-fade-in">
              {/* Message Bubble */}
              <div
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 backdrop-blur-xl"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                      boxShadow: '0 4px 16px hsl(var(--primary) / 0.3)'
                    }}
                  >
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] px-4 py-3 backdrop-blur-xl ${
                    msg.role === 'user'
                      ? 'rounded-[16px_16px_4px_16px]'
                      : 'rounded-[16px_16px_16px_4px]'
                  }`}
                  style={{
                    background: msg.role === 'user' 
                      ? 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.1))'
                      : 'hsl(0 0% 100% / 0.7)',
                    border: '1px solid hsl(0 0% 100% / 0.3)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05), inset 0 1px 0 hsl(0 0% 100% / 0.3)'
                  }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {msg.content}
                  </p>
                </div>
              </div>

              {/* Product Cards - Bento Grid */}
              {msg.products && msg.products.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mr-11">
                  {msg.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={onAddToCart}
                      onCompare={onCompare}
                      isInCart={cartItems.some(item => item.id === product.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex gap-3 animate-fade-in">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                  boxShadow: '0 4px 16px hsl(var(--primary) / 0.3)'
                }}
              >
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div 
                className="rounded-[16px_16px_16px_4px] px-4 py-3 backdrop-blur-xl"
                style={{
                  background: 'hsl(0 0% 100% / 0.7)',
                  border: '1px solid hsl(0 0% 100% / 0.3)'
                }}
              >
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

      {/* Bottom Input Area - Glass Effect */}
      <div 
        className="border-t backdrop-blur-xl"
        style={{
          background: 'hsl(0 0% 100% / 0.9)',
          borderColor: 'hsl(0 0% 100% / 0.3)'
        }}
      >
        <form onSubmit={handleSubmit} className="max-w-[820px] mx-auto p-4">
          <div 
            className="flex items-end gap-3 p-3 rounded-2xl backdrop-blur-xl"
            style={{
              background: 'hsl(0 0% 100% / 0.5)',
              border: '1px solid hsl(0 0% 100% / 0.3)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05), inset 0 1px 0 hsl(0 0% 100% / 0.5)'
            }}
          >
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
              placeholder="چی می‌خوای بخری؟ بگو تا پیدا کنم..."
              disabled={isProcessing}
              className="flex-1 min-h-[48px] max-h-[160px] bg-transparent border-none focus:outline-none focus:ring-0 text-right resize-none py-3 px-2"
              style={{ lineHeight: '1.6' }}
              dir="rtl"
            />
            
            <div className="flex items-center gap-2 pb-1">
              <button
                type="button"
                className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-200 hover:scale-110"
                style={{
                  background: 'hsl(0 0% 100% / 0.6)',
                  border: '1px solid hsl(0 0% 0% / 0.08)',
                }}
                title="ارسال فایل"
              >
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              </button>
              
              <button
                type="button"
                className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-200 hover:scale-110"
                style={{
                  background: 'hsl(0 0% 100% / 0.6)',
                  border: '1px solid hsl(0 0% 0% / 0.08)',
                }}
                title="پیام صوتی"
              >
                <Mic className="w-4 h-4 text-muted-foreground" />
              </button>

              <Button
                type="submit"
                disabled={!inputValue.trim() || isProcessing}
                className="h-10 w-10 rounded-xl"
                style={{
                  boxShadow: inputValue.trim() ? '0 4px 16px hsl(var(--primary) / 0.3)' : 'none'
                }}
              >
                <ArrowUp className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={onAddToCart}
        onAskAbout={handleAskAbout}
        isInCart={cartItems.some(item => item.id === quickViewProduct?.id)}
      />
    </div>
  );
};
