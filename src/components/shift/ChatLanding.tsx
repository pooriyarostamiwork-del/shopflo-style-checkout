import { useState, useRef, useEffect } from "react";
import { ArrowUp, Zap, Paperclip, Mic, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage, Product, CartItem, DeliveryAddress } from "@/features/shift/data/shiftData";
import { CategorySelector } from "./CategorySelector";
import { ProductCarousels } from "./ProductCarousels";
import { ProductDetailsModal } from "./ProductDetailsModal";
import { Footer } from "./Footer";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";
import shiftLogotype from "@/features/shift/assets/shift-logotype.svg";

// Rotating placeholder texts
const placeholderTexts = [
  "«هدفون نویز کنسلینگ زیر ۵ میلیون»",
  "«بهترین تخفیف‌های امروز چیه؟»",
  "«خودت برام خرید کن»",
];

// Bento background cards for soft commerce context
const BentoCard = ({
  type,
  className = "",
  style = {}
}: {
  type: 'product' | 'discount' | 'cart';
  className?: string;
  style?: React.CSSProperties;
}) => {
  const baseStyle: React.CSSProperties = {
    background: 'hsl(0 0% 100% / 0.04)',
    border: '1px solid hsl(0 0% 100% / 0.08)',
    borderRadius: '20px',
    backdropFilter: 'blur(28px)',
    opacity: 0.29,
    ...style,
  };

  if (type === 'product') {
    return (
      <div className={`absolute ${className}`} style={{ ...baseStyle, width: '140px', height: '180px' }}>
        <div className="w-full h-24 rounded-t-[16px] bg-gradient-to-br from-primary/5 to-primary/10" />
        <div className="p-3 space-y-2">
          <div className="h-3 bg-foreground/20 rounded w-3/4" />
          <div className="h-2 bg-foreground/10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (type === 'discount') {
    return (
      <div className={`absolute ${className}`} style={{ ...baseStyle, width: '100px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="text-xs text-foreground/30">٪۱۰ تخفیف</span>
      </div>
    );
  }

  return (
    <div className={`absolute ${className}`} style={{ ...baseStyle, width: '160px', height: '48px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px' }}>
      <div className="w-8 h-8 rounded-lg bg-foreground/10" />
      <div className="flex-1 space-y-1">
        <div className="h-2 bg-foreground/15 rounded w-1/2" />
        <div className="h-2 bg-foreground/10 rounded w-3/4" />
      </div>
    </div>
  );
};

interface ChatLandingProps {
  onSendMessage: (message: string, forceNew?: boolean) => void;
  onAddToCart: (product: Product) => void;
  onStartChat: () => void;
  onCheckout: () => void;
  onSignIn: () => void;
  cartItems: CartItem[];
  isCartOpen: boolean;
  isProcessing: boolean;
  setInputValue?: (value: string) => void;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  isAuthenticated?: boolean;
  userFirstName?: string;
}

export const ChatLanding = ({
  onSendMessage,
  onAddToCart,
  onStartChat,
  onCheckout,
  onSignIn,
  cartItems,
  isCartOpen,
  isProcessing,
  setInputValue: externalSetInputValue,
  inputRef: externalInputRef,
  isAuthenticated = false,
  userFirstName,
}: ChatLandingProps) => {
  const [inputValue, setInputValueInternal] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const setInputValue = externalSetInputValue || setInputValueInternal;
  const { getLogoSettings } = useHomepageSettings();
  const firstPageLogo = getLogoSettings('firstPage');

  const isIdle = !isFocused && !inputValue;

  // Rotate placeholders every 3.5 seconds
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
      onSendMessage(inputValue.trim(), true);
      setInputValue("");
    }
  };

  const handleAskAbout = (productName: string) => {
    const message = `درباره ${productName} بیشتر توضیح بده`;
    onSendMessage(message, true);
    setQuickViewProduct(null);
  };

  const handleSupportClick = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      setInputValue('نیاز به پشتیبانی دارم');
    }
  };

  const quickActions = [
    { label: 'هدفون بی‌سیم می‌خوام', action: 'هدفون بی‌سیم خوب با ارسال سریع می‌خوام' },
    { label: 'مقایسه محصولات', action: 'این محصولات رو با هم مقایسه کن' },
    { label: 'خودت خرید رو انجام بده', action: 'خودت خرید رو انجام بده' },
  ];

  return (
    <div
      className="flex-1 flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-y-auto"
      dir="rtl"
    >
      {/* Fixed Top Bar */}
      <div
        className="sticky top-0 z-20 p-4 flex items-center justify-between transition-all duration-300"
        style={{
          background: 'hsl(0 0% 100%)',
          borderBottom: '1px solid hsl(0 0% 0% / 0.06)',
          marginLeft: isCartOpen ? '340px' : '0',
        }}
      >
        <CategorySelector activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs" style={{ background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.12)' }}>
            <span className="text-foreground/80">تا صد میلیون خیال جمع — فروشگاه شیفت هست، پول کم؟ کم‌کم!</span>
            <span className="text-primary font-semibold cursor-pointer hover:underline">دریافت وام فلوپی</span>
          </div>
          <button
            onClick={onSignIn}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:border-primary/20"
            style={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(0 0% 0% / 0.08)' }}
          >
            <User className="w-4 h-4" />
            {isAuthenticated && userFirstName ? (
              <span>😊 {userFirstName} جان خوش اومدی، ورود به فضای خرید</span>
            ) : (
              <span>ورود / ثبت‌نام</span>
            )}
          </button>
        </div>
      </div>

      {/* Hero Section - Centered Chat */}
      <div className="relative flex flex-col items-center justify-center min-h-[50vh] py-12 px-6">
        <BentoCard type="product" className="top-8 right-[10%] animate-float-slow" style={{ animationDelay: '0s', animationDuration: '25s' }} />
        <BentoCard type="discount" className="top-24 left-[12%] animate-float-slow" style={{ animationDelay: '2s', animationDuration: '22s', transform: 'rotate(-2deg)' }} />
        <BentoCard type="cart" className="bottom-16 right-[8%] animate-float-slow" style={{ animationDelay: '4s', animationDuration: '28s', transform: 'rotate(1deg)' }} />
        <BentoCard type="product" className="bottom-24 left-[10%] animate-float-slow" style={{ animationDelay: '6s', animationDuration: '24s', transform: 'rotate(2deg)' }} />

        {/* Logo & Welcome */}
        <div className="relative z-10 flex flex-col items-center gap-6 mb-8">
          {firstPageLogo.imageUrl ? (
            <img src={firstPageLogo.imageUrl} alt="فروشگاه شیفت" className="w-20 h-20 rounded-2xl object-cover" />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.08))',
                border: '1px solid hsl(0 0% 0% / 0.06)',
              }}
            >
              <Zap className="w-10 h-10 text-primary" />
            </div>
          )}
          <div className="flex flex-col items-center gap-3">
            <img src={shiftLogotype} alt="Shift" style={{ height: '40px', width: 'auto' }} draggable={false} />
            <p className="text-muted-foreground">{firstPageLogo.subtitle || 'دستیار خرید هوشمند شما'}</p>
          </div>
        </div>

        {/* Centered Glass Chatbox */}
        <div className="relative z-10 w-full max-w-[720px] mx-auto">
          <form onSubmit={handleSubmit}>
            <div
              className={`relative rounded-xl overflow-hidden transition-all duration-300 ${isIdle ? 'animate-breathing' : ''}`}
              style={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(0 0% 0% / 0.08)' }}
            >
              <div className="relative flex items-end gap-3 p-4">
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
                  {!inputValue && (
                    <div className="absolute inset-0 flex items-center pointer-events-none px-3 py-4 overflow-hidden" dir="rtl">
                      <span
                        key={placeholderIndex}
                        className="text-muted-foreground/50 text-base text-right w-full animate-typing-rtl"
                      >
                        {placeholderTexts[placeholderIndex]}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110" style={{ background: 'hsl(0 0% 98%)', border: '1px solid hsl(0 0% 0% / 0.06)' }} title="ارسال فایل">
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button type="button" className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110" style={{ background: 'hsl(0 0% 98%)', border: '1px solid hsl(0 0% 0% / 0.06)' }} title="پیام صوتی">
                    <Mic className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <Button type="submit" disabled={!inputValue.trim()} className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 transition-all duration-300">
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
                className="text-sm px-4 py-2 rounded-xl transition-all duration-200 hover:border-primary/20"
                style={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(0 0% 0% / 0.08)' }}
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

      {/* Footer */}
      <Footer onSupportClick={handleSupportClick} onSignInClick={onSignIn} />

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
