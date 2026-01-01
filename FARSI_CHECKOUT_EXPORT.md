# Farsi Checkout Complete Code Export

This file contains all the code needed for the Farsi (Persian) RTL checkout experience.

---

## Table of Contents

1. [App.tsx Routes](#apptsx-routes)
2. [Pages](#pages)
   - [IndexFarsi.tsx](#indexfarsitsx)
3. [Components](#components)
   - [LanguageLayout.tsx](#languagelayouttsx)
   - [HeaderLocalized.tsx](#headerlocalizedtsx)
   - [FooterLocalized.tsx](#footerlocalizedtsx)
   - [CartItemLocalized.tsx](#cartitemlocalizedtsx)
   - [OrderSummaryLocalized.tsx](#ordersummarylocalizedtsx)
   - [CheckoutModalLocalized.tsx](#checkoutmodallocalizedtsx)
   - [SuccessScreenLocalized.tsx](#successscreenlocalizedtsx)
   - [AddressSelectorLocalized.tsx](#addressselectorlocalizedtsx)
   - [CouponSelectorLocalized.tsx](#couponselectorlocalizedtsx)
   - [AutoReorderOptionsLocalized.tsx](#autoreorderoptionslocalizedtsx)
   - [EnhancedUpsellCarouselLocalized.tsx](#enhancedupsellcarousellocalizedtsx)
4. [i18n System](#i18n-system)
   - [LanguageContext.tsx](#languagecontexttsx)
   - [index.ts](#indexts)
   - [translations/fa.json](#translationsfajson)
   - [translations/en.json](#translationsenjson)

---

## App.tsx Routes

Add these routes to your App.tsx:

```tsx
import IndexFarsi from "./pages/IndexFarsi";
import { FarsiLayout, EnglishLayout } from "./components/LanguageLayout";

// In your Routes:
<Route path="/farsi" element={<FarsiLayout><IndexFarsi /></FarsiLayout>} />
<Route path="/farsi/agenticcheckout" element={<FarsiLayout><AgenticCheckout /></FarsiLayout>} />
<Route path="/farsi/merchant" element={<FarsiLayout><MerchantDashboard /></FarsiLayout>} />
```

---

## Pages

### IndexFarsi.tsx

```tsx
import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { CartItemLocalized, CartProduct } from "@/components/CartItemLocalized";
import { OrderSummaryLocalized } from "@/components/OrderSummaryLocalized";
import { CheckoutModalLocalized } from "@/components/CheckoutModalLocalized";
import { SuccessScreenLocalized } from "@/components/SuccessScreenLocalized";
import { HeaderLocalized } from "@/components/HeaderLocalized";
import { FooterLocalized } from "@/components/FooterLocalized";
import { RecommendedProducts } from "@/components/RecommendedProducts";
import { ModeSelector } from "@/components/ModeSelector";
import { CheckoutMode } from "@/types/checkout";
import { checkoutModes, upsellProducts, couponTiers } from "@/data/checkoutModes";
import { useLanguage, toPersianNumber } from "@/i18n";

const IndexFarsi = () => {
  const { t, isRTL } = useLanguage();
  const [selectedMode, setSelectedMode] = useState<CheckoutMode>("cross-market-retargeting");
  const [cartItems, setCartItems] = useState<CartProduct[]>([
    {
      id: 1,
      name: "Premium Wireless Headphones",
      nameFa: "هدفون بی‌سیم پریمیوم",
      price: 2499,
      originalPrice: 3999,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
      quantity: 1,
      inStock: true,
    },
    {
      id: 2,
      name: "Smart Fitness Watch",
      nameFa: "ساعت هوشمند ورزشی",
      price: 4999,
      originalPrice: 7999,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
      quantity: 2,
      inStock: true,
    },
    {
      id: 3,
      name: "Leather Laptop Bag",
      nameFa: "کیف چرمی لپ‌تاپ",
      price: 1999,
      originalPrice: 2999,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop",
      quantity: 1,
      inStock: true,
    },
  ]);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const updateQuantity = (id: number, quantity: number) => {
    setCartItems(items =>
      items.map(item => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = cartItems.reduce(
    (sum, item) =>
      sum + ((item.originalPrice || item.price) - item.price) * item.quantity,
    0
  );
  const shipping = 0;
  const total = subtotal - discount + shipping;

  const handleCheckoutSuccess = () => {
    setIsCheckoutOpen(false);
    setIsSuccessOpen(true);
  };

  const handleSuccessClose = () => {
    setIsSuccessOpen(false);
    setCartItems([]);
  };

  const orderId = `SF${Math.floor(Math.random() * 100000)}`;
  const currentModeConfig = checkoutModes.find(m => m.id === selectedMode);

  const displayItemCount = isRTL ? toPersianNumber(cartItems.length) : cartItems.length;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <HeaderLocalized cartItemCount={cartItems.length} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Mode Selector */}
        <ModeSelector 
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
        />

        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t.cart.emptyTitle}</h2>
            <p className="text-muted-foreground">{t.cart.emptySubtitle}</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-5 lg:order-2">
              <h2 className="text-3xl font-bold mb-6 text-foreground text-right">
                {t.cart.title} ({displayItemCount} {t.cart.items})
              </h2>
              {cartItems.map(item => (
                <CartItemLocalized
                  key={item.id}
                  product={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}

              {/* Recommended Products */}
              <RecommendedProducts />
            </div>

            {/* Order Summary */}
            <div className="lg:order-1">
              <OrderSummaryLocalized
                subtotal={subtotal}
                discount={discount}
                shipping={shipping}
                onCheckout={() => setIsCheckoutOpen(true)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <FooterLocalized />

      {/* Checkout Modal */}
      <CheckoutModalLocalized
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        total={total}
        onSuccess={handleCheckoutSuccess}
        mode={selectedMode}
        modeConfig={currentModeConfig}
        cartItems={cartItems}
        upsellProducts={upsellProducts}
        couponTiers={couponTiers}
      />

      {/* Success Screen */}
      <SuccessScreenLocalized
        isOpen={isSuccessOpen}
        onClose={handleSuccessClose}
        orderId={orderId}
      />
    </div>
  );
};

export default IndexFarsi;
```

---

## Components

### LanguageLayout.tsx

```tsx
import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LanguageProvider } from '@/i18n';

interface FarsiLayoutProps {
  children: ReactNode;
}

export const FarsiLayout = ({ children }: FarsiLayoutProps) => {
  const location = useLocation();

  useEffect(() => {
    // Set RTL direction for the entire document
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'fa');
    document.body.classList.add('rtl');
    
    return () => {
      // Cleanup when navigating away from Farsi pages
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
      document.body.classList.remove('rtl');
    };
  }, []);

  return (
    <LanguageProvider defaultLanguage="fa">
      {children}
    </LanguageProvider>
  );
};

interface EnglishLayoutProps {
  children: ReactNode;
}

export const EnglishLayout = ({ children }: EnglishLayoutProps) => {
  useEffect(() => {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', 'en');
    document.body.classList.remove('rtl');
  }, []);

  return (
    <LanguageProvider defaultLanguage="en">
      {children}
    </LanguageProvider>
  );
};
```

### HeaderLocalized.tsx

```tsx
import { useState } from "react";
import { Search, User, ShoppingCart, Menu, X, Globe } from "lucide-react";
import { Button } from "./ui/button";
import { useLanguage, formatCurrency } from "@/i18n";
import { Link, useLocation } from "react-router-dom";

interface HeaderProps {
  cartItemCount: number;
}

export const HeaderLocalized = ({ cartItemCount }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, isRTL, language } = useLanguage();
  const location = useLocation();

  const navItems = [
    { key: 'home', label: t.common.home },
    { key: 'newArrivals', label: t.common.newArrivals },
    { key: 'electronics', label: t.common.electronics },
    { key: 'accessories', label: t.common.accessories },
    { key: 'lifestyle', label: t.common.lifestyle },
    { key: 'sale', label: t.common.sale },
  ];

  const switchUrl = isRTL ? '/' : '/farsi';

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        {/* Desktop Header */}
        <div className={`flex items-center justify-between py-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Logo */}
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">{isRTL ? 'ش' : 'S'}</span>
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <h1 className="text-xl font-bold text-foreground">{t.header.brandName}</h1>
              <p className="text-xs text-muted-foreground">{t.header.tagline}</p>
            </div>
          </div>

          {/* Navigation (Desktop) */}
          <nav className={`hidden lg:flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {navItems.map((item) => (
              <a
                key={item.key}
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors relative group"
              >
                {item.label}
                <span className={`absolute bottom-0 ${isRTL ? 'right-0' : 'left-0'} w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full`} />
              </a>
            ))}
          </nav>

          {/* Right: Search, Language, User, Cart */}
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Search Bar (Desktop) */}
            <div className={`hidden md:flex items-center gap-2 bg-muted px-4 py-2 rounded-xl border border-border ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t.common.search}
                className={`bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-48 ${isRTL ? 'text-right' : ''}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Language Switcher */}
            <Link to={switchUrl}>
              <Button variant="ghost" size="icon" className="rounded-full" title={isRTL ? 'Switch to English' : 'تغییر به فارسی'}>
                <Globe className="w-5 h-5 text-muted-foreground" />
              </Button>
            </Link>

            {/* User Icon */}
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5 text-muted-foreground" />
            </Button>

            {/* Cart Icon */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </Button>
              {cartItemCount > 0 && (
                <span className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse-glow`}>
                  {cartItemCount}
                </span>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden pb-4 animate-fade-in">
            {/* Mobile Search */}
            <div className={`flex items-center gap-2 bg-muted px-4 py-2 rounded-xl border border-border mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t.common.search}
                className={`bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1 ${isRTL ? 'text-right' : ''}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            {/* Mobile Navigation */}
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href="#"
                  className={`text-sm text-muted-foreground hover:text-primary transition-colors py-2 ${isRTL ? 'text-right' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
```

### FooterLocalized.tsx

```tsx
import { Instagram, Twitter, Linkedin } from "lucide-react";
import { useLanguage } from "@/i18n";

export const FooterLocalized = () => {
  const { t, isRTL } = useLanguage();

  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${isRTL ? 'md:grid-flow-dense' : ''}`}>
          {/* Column 1: ShopFlow */}
          <div className={isRTL ? 'md:col-start-3' : ''}>
            <h3 className={`font-semibold text-foreground mb-4 ${isRTL ? 'text-right' : ''}`}>
              {t.header.brandName}
            </h3>
            <ul className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.about}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.careers}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.contact}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.blog}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Support */}
          <div className={isRTL ? 'md:col-start-2' : ''}>
            <h3 className={`font-semibold text-foreground mb-4 ${isRTL ? 'text-right' : ''}`}>
              {t.footer.support}
            </h3>
            <ul className={`space-y-2 ${isRTL ? 'text-right' : ''}`}>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.help}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.returns}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.shippingInfo}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t.footer.privacyPolicy}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Follow Us */}
          <div className={isRTL ? 'md:col-start-1' : ''}>
            <h3 className={`font-semibold text-foreground mb-4 ${isRTL ? 'text-right' : ''}`}>
              {t.footer.followUs}
            </h3>
            <div className={`flex gap-4 ${isRTL ? 'justify-end' : ''}`}>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            {t.footer.copyright}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {t.footer.demoNote}
          </p>
        </div>
      </div>
    </footer>
  );
};
```

### CartItemLocalized.tsx

```tsx
import { Minus, Plus, X, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useLanguage, formatCurrency, toPersianNumber } from "@/i18n";

export interface CartProduct {
  id: number;
  name: string;
  nameFa?: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  inStock?: boolean;
}

interface CartItemLocalizedProps {
  product: CartProduct;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

export const CartItemLocalized = ({ product, onUpdateQuantity, onRemove }: CartItemLocalizedProps) => {
  const { t, isRTL, language } = useLanguage();
  
  const discount = product.originalPrice
    ? ((product.originalPrice - product.price) / product.originalPrice) * 100
    : 0;

  const itemSubtotal = product.price * product.quantity;
  const inStock = product.inStock !== false;

  const displayName = isRTL && product.nameFa ? product.nameFa : product.name;
  const displayQuantity = isRTL ? toPersianNumber(product.quantity) : product.quantity;
  const displayDiscount = isRTL ? toPersianNumber(discount.toFixed(0)) : discount.toFixed(0);

  return (
    <div className={`bg-card rounded-xl p-5 shadow-sm border border-border flex gap-5 hover:shadow-md hover:scale-[1.01] transition-all duration-300 animate-fade-in ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
        <img src={product.image} alt={displayName} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1">
        <div className={`flex justify-between items-start mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
            <h3 className="font-semibold text-foreground mb-1">{displayName}</h3>
            
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              {inStock ? (
                <span className="text-xs text-green-600 font-medium">✓ {t.cart.inStock}</span>
              ) : (
                <span className="text-xs text-destructive font-medium">{t.cart.outOfStock}</span>
              )}
            </div>

            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(product.price, language)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCurrency(product.originalPrice, language)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {displayDiscount}% {t.common.off}
                  </Badge>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(product.price, language)} × {displayQuantity} = {formatCurrency(itemSubtotal, language)}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(product.id)}
            className="text-muted-foreground hover:text-destructive rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className={`flex items-center gap-4 mt-3 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
          <button
            className={`flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            onClick={() => console.log("Move to wishlist")}
          >
            <Heart className="w-3.5 h-3.5" />
            {t.cart.moveToWishlist}
          </button>
        </div>

        <div className={`flex items-center justify-between mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 bg-muted rounded-xl p-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-background transition-all"
              onClick={() => onUpdateQuantity(product.id, Math.max(1, product.quantity - 1))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-10 text-center font-semibold text-foreground">{displayQuantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-background transition-all"
              onClick={() => onUpdateQuantity(product.id, product.quantity + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### OrderSummaryLocalized.tsx

```tsx
import { useState } from "react";
import { Button } from "./ui/button";
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { useLanguage, formatCurrency, toPersianNumber } from "@/i18n";

interface OrderSummaryLocalizedProps {
  subtotal: number;
  discount: number;
  shipping: number;
  onCheckout: () => void;
}

export const OrderSummaryLocalized = ({ subtotal, discount, shipping, onCheckout }: OrderSummaryLocalizedProps) => {
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const { t, isRTL, language } = useLanguage();
  const total = subtotal - discount + shipping;

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      setPromoApplied(true);
    }
  };

  return (
    <div className={`bg-card rounded-xl p-6 shadow-lg border border-border h-fit sticky top-6 ${isRTL ? 'text-right' : ''}`}>
      <h2 className="text-xl font-bold mb-6 text-foreground">{t.orderSummary.title}</h2>
      
      {/* Promo Code Section */}
      <div className="mb-6">
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <input
            type="text"
            placeholder={t.orderSummary.enterPromo}
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            dir={isRTL ? 'rtl' : 'ltr'}
            className={`flex-1 px-4 py-2 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${isRTL ? 'text-right' : ''}`}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyPromo}
            className="rounded-xl hover:bg-primary hover:text-white transition-colors"
          >
            {t.common.apply}
          </Button>
        </div>
        {promoApplied && (
          <p className={`text-xs text-green-600 mt-2 animate-fade-in ${isRTL ? 'text-right' : ''}`}>
            ✓ {t.orderSummary.promoApplied}: {promoCode}
          </p>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className={`flex justify-between text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span>{t.orderSummary.subtotal}</span>
          <span>{formatCurrency(subtotal, language)}</span>
        </div>
        {discount > 0 && (
          <div className={`flex justify-between text-sm text-green-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span>{t.orderSummary.discount}</span>
            <span>-{formatCurrency(discount, language)}</span>
          </div>
        )}
        <div className={`flex justify-between text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span>{t.orderSummary.shipping}</span>
          <span className="text-green-600 font-medium">
            {shipping === 0 ? t.common.free : formatCurrency(shipping, language)}
          </span>
        </div>
        <div className={`flex justify-between text-sm text-muted-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span>{t.orderSummary.taxes}</span>
          <span>{formatCurrency(0, language)}</span>
        </div>
        <div className="border-t border-border pt-3"></div>
        <div className={`flex justify-between text-lg font-bold text-foreground ${isRTL ? 'flex-row-reverse' : ''}`}>
          <span>{t.orderSummary.total}</span>
          <span>{formatCurrency(total, language)}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        {t.orderSummary.taxesIncluded}
      </p>

      <Button 
        variant="checkout" 
        className="w-full h-14 text-lg rounded-xl mb-3"
        onClick={onCheckout}
      >
        {t.orderSummary.checkoutNow}
      </Button>

      <button className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center hover:underline">
        {t.cart.continueShopping}
      </button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        🔒 {t.orderSummary.secureCheckout}
      </p>

      {/* Trust Badges / Payment Icons */}
      <div className={`flex justify-center items-center gap-3 mt-6 pt-6 border-t border-border ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-1 text-muted-foreground opacity-60 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <CreditCard className="w-5 h-5" />
          <span className="text-xs">Visa</span>
        </div>
        <div className={`flex items-center gap-1 text-muted-foreground opacity-60 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <CreditCard className="w-5 h-5" />
          <span className="text-xs">Mastercard</span>
        </div>
        <div className={`flex items-center gap-1 text-muted-foreground opacity-60 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Smartphone className="w-5 h-5" />
          <span className="text-xs">{isRTL ? 'زرین‌پال' : 'Razorpay'}</span>
        </div>
        <div className={`flex items-center gap-1 text-muted-foreground opacity-60 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Wallet className="w-5 h-5" />
          <span className="text-xs">PayPal</span>
        </div>
      </div>
    </div>
  );
};
```

### SuccessScreenLocalized.tsx

```tsx
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { CheckCircle2, Package } from "lucide-react";
import { useLanguage, toPersianNumber, formatCurrency } from "@/i18n";

interface SuccessScreenLocalizedProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export const SuccessScreenLocalized = ({ isOpen, onClose, orderId }: SuccessScreenLocalizedProps) => {
  const { t, isRTL, language } = useLanguage();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatOrderId = (id: string) => {
    if (isRTL) {
      return id.replace(/[0-9]/g, (d) => toPersianNumber(d));
    }
    return id;
  };

  const getDeliveryDate = () => {
    if (isRTL) {
      return "۲۷-۲۹ آذر ۱۴۰۴";
    }
    return "Nov 18-20, 2025";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-md" />
      
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
                borderRadius: Math.random() > 0.5 ? "50%" : "0",
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${Math.random() * 2 + 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className={`relative bg-background rounded-3xl shadow-2xl w-full max-w-md mx-4 p-8 text-center ${isRTL ? 'font-vazirmatn' : ''}`}>
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <CheckCircle2 className="w-24 h-24 text-secondary" strokeWidth={1.5} />
            <div className="absolute inset-0 bg-secondary/20 rounded-full blur-2xl" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-foreground">
          {t.success.title} 🎉
        </h1>
        
        <p className="text-muted-foreground mb-2">
          {isRTL ? "سفارش شما با موفقیت ثبت شد" : "Your order has been successfully placed"}
        </p>

        <p className="text-sm font-medium text-primary mb-6">
          {t.success.subtitle} {isRTL ? toPersianNumber("2.1") : "2.1"} {t.success.seconds} — {t.success.fasterThan}
        </p>

        <div className="bg-muted/30 rounded-xl p-4 mb-6 border border-border">
          <div className={`flex items-center justify-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Package className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">{t.success.orderId}</span>
          </div>
          <p className="text-xl font-bold font-mono" dir="ltr">{formatOrderId(orderId)}</p>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium mb-1">{t.success.deliveryDate}</p>
          <p className="text-lg font-bold text-foreground">{getDeliveryDate()}</p>
        </div>

        <Button 
          variant="gradient" 
          className="w-full h-12 text-base rounded-xl"
          onClick={onClose}
        >
          {t.success.continueShopping}
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          {isRTL 
            ? "ایمیل تأییدیه با جزئیات پیگیری برای شما ارسال شد"
            : "We've sent a confirmation email with tracking details"
          }
        </p>
      </div>
    </div>
  );
};
```

### AddressSelectorLocalized.tsx

```tsx
import { useState } from "react";
import { Plus, Check, MapPin, Edit2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useLanguage, toPersianNumber, formatCurrency } from "@/i18n";

export interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface AddressSelectorLocalizedProps {
  addresses: Address[];
  selectedAddress: Address | null;
  onSelectAddress: (address: Address) => void;
  onAddAddress: (address: Address) => void;
  onEditAddress: (address: Address) => void;
  onSetDefault: (id: string) => void;
}

export const AddressSelectorLocalized = ({
  addresses,
  selectedAddress,
  onSelectAddress,
  onAddAddress,
  onEditAddress,
  onSetDefault
}: AddressSelectorLocalizedProps) => {
  const { t, isRTL, language } = useLanguage();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<Partial<Address>>({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false
  });

  const handleSaveAddress = () => {
    if (editingAddress) {
      onEditAddress({ ...editingAddress, ...formData } as Address);
      setEditingAddress(null);
    } else {
      const newAddress: Address = {
        id: Date.now().toString(),
        ...formData as Omit<Address, 'id'>
      };
      onAddAddress(newAddress);
      setIsAddingNew(false);
    }
    setFormData({
      name: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false
    });
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData(address);
    setIsAddingNew(true);
  };

  const formatPhone = (phone: string) => {
    if (isRTL) {
      return toPersianNumber(phone);
    }
    return phone;
  };

  const AddressForm = () => (
    <div className={`space-y-4 mt-4 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`grid grid-cols-2 gap-4 ${isRTL ? 'direction-rtl' : ''}`}>
        <div>
          <Label htmlFor="name">{t.checkout.address.name}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={isRTL ? "نام و نام خانوادگی" : "John Doe"}
            className={`h-10 mt-1 ${isRTL ? 'text-right' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
        <div>
          <Label htmlFor="phone">{t.checkout.address.phone}</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder={isRTL ? "۰۹۱۲۳۴۵۶۷۸۹" : "98765 43210"}
            className={`h-10 mt-1 ${isRTL ? 'text-right' : ''}`}
            dir="ltr"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="line1">{t.checkout.address.street}</Label>
        <Input
          id="line1"
          value={formData.line1}
          onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
          placeholder={isRTL ? "خیابان، پلاک، واحد" : "House No., Building Name"}
          className={`h-10 mt-1 ${isRTL ? 'text-right' : ''}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>

      <div>
        <Label htmlFor="line2">{isRTL ? "آدرس تکمیلی" : "Address Line 2"}</Label>
        <Input
          id="line2"
          value={formData.line2}
          onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
          placeholder={isRTL ? "محله، منطقه" : "Road, Area, Locality"}
          className={`h-10 mt-1 ${isRTL ? 'text-right' : ''}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
      </div>

      <div className={`grid grid-cols-3 gap-4 ${isRTL ? 'direction-rtl' : ''}`}>
        <div>
          <Label htmlFor="city">{t.checkout.address.city}</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder={isRTL ? "تهران" : "Bangalore"}
            className={`h-10 mt-1 ${isRTL ? 'text-right' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
        <div>
          <Label htmlFor="state">{t.checkout.address.state}</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder={isRTL ? "تهران" : "Karnataka"}
            className={`h-10 mt-1 ${isRTL ? 'text-right' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>
        <div>
          <Label htmlFor="pincode">{t.checkout.address.pincode}</Label>
          <Input
            id="pincode"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            placeholder={isRTL ? "۱۲۳۴۵۶۷۸۹۰" : "560034"}
            maxLength={10}
            className={`h-10 mt-1 ${isRTL ? 'text-right' : ''}`}
            dir="ltr"
          />
        </div>
      </div>

      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <input
          type="checkbox"
          id="default"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
        />
        <Label htmlFor="default" className="font-normal">{t.checkout.address.setDefault}</Label>
      </div>

      <div className={`flex gap-2 pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            setIsAddingNew(false);
            setEditingAddress(null);
            setFormData({
              name: "",
              phone: "",
              line1: "",
              line2: "",
              city: "",
              state: "",
              pincode: "",
              isDefault: false
            });
          }}
        >
          {t.common.cancel}
        </Button>
        <Button
          className="flex-1"
          onClick={handleSaveAddress}
          disabled={!formData.name || !formData.phone || !formData.line1 || !formData.city || !formData.state || !formData.pincode}
        >
          {t.checkout.address.save}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`space-y-3 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Label className="text-base font-semibold">{t.checkout.address.title}</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAddingNew(!isAddingNew)}
          className={`text-primary ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus className={`w-4 h-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
          {t.checkout.address.addNew}
        </Button>
      </div>

      {isAddingNew && <AddressForm />}

      <div className="space-y-2">
        {addresses.map((address) => {
          const isSelected = selectedAddress?.id === address.id;
          
          return (
            <div
              key={address.id}
              className={`
                p-4 rounded-lg border cursor-pointer transition-all
                ${isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }
              `}
              onClick={() => onSelectAddress(address)}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-start gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`
                    mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${isSelected ? 'border-primary bg-primary' : 'border-border'}
                  `}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  
                  <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 mb-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <p className="font-semibold text-foreground">{address.name}</p>
                      {address.isDefault && (
                        <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent-foreground rounded-full">
                          {t.checkout.address.default}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1" dir="ltr">
                      {isRTL ? toPersianNumber(address.phone) : `+91 ${address.phone}`}
                    </p>
                    
                    {isSelected && (
                      <div className={`text-sm text-muted-foreground mt-2 ${isRTL ? 'text-right' : ''}`}>
                        <p>{address.line1}</p>
                        <p>{address.line2}</p>
                        <p>
                          {address.city}، {address.state} - {isRTL ? toPersianNumber(address.pincode) : address.pincode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`flex gap-1 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(address);
                    }}
                    className="p-1.5 hover:bg-muted rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  {!address.isDefault && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetDefault(address.id);
                      }}
                      className="p-1.5 hover:bg-muted rounded text-xs text-muted-foreground"
                      title={t.checkout.address.setDefault}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

### CouponSelectorLocalized.tsx

```tsx
import { useState } from "react";
import { Tag, ChevronRight, ChevronLeft, Check, Gift, Truck, Percent } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { CouponTier } from "@/types/checkout";
import { Progress } from "./ui/progress";
import { useLanguage, formatCurrency, toPersianNumber } from "@/i18n";

interface CouponSelectorLocalizedProps {
  currentTotal: number;
  tiers: CouponTier[];
  selectedCoupon: CouponTier | null;
  onSelectCoupon: (tier: CouponTier | null) => void;
}

export const CouponSelectorLocalized = ({
  currentTotal,
  tiers,
  selectedCoupon,
  onSelectCoupon
}: CouponSelectorLocalizedProps) => {
  const { t, isRTL, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);
  
  const availableCoupons = sortedTiers.filter(tier => currentTotal >= tier.threshold);
  const unavailableCoupons = sortedTiers.filter(tier => currentTotal < tier.threshold);

  const getIcon = (type: string) => {
    switch (type) {
      case "shipping":
        return <Truck className="w-4 h-4" />;
      case "gift":
        return <Gift className="w-4 h-4" />;
      case "discount":
        return <Percent className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const getProgress = (threshold: number) => {
    return Math.min((currentTotal / threshold) * 100, 100);
  };

  const getAmountNeeded = (threshold: number) => {
    return threshold - currentTotal;
  };

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={`w-full h-12 justify-between text-left font-normal border-dashed ${isRTL ? 'flex-row-reverse text-right' : ''}`}
        >
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Tag className="w-4 h-4 text-primary" />
            <span className="text-foreground">
              {selectedCoupon 
                ? `${t.checkout.coupons.applied}: ${selectedCoupon.reward}`
                : `${t.checkout.coupons.title} (${isRTL ? toPersianNumber(availableCoupons.length) : availableCoupons.length})`
              }
            </span>
          </div>
          <ChevronIcon className="w-4 h-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className={`text-xl font-bold ${isRTL ? 'text-right' : ''}`}>
            {t.checkout.coupons.title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Available Coupons */}
          {availableCoupons.length > 0 && (
            <div className="space-y-3">
              <h3 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wide ${isRTL ? 'text-right' : ''}`}>
                {t.checkout.coupons.unlocked}
              </h3>
              {availableCoupons.map((tier, index) => {
                const isSelected = selectedCoupon?.threshold === tier.threshold;
                
                return (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-xl border-2 transition-all cursor-pointer
                      ${isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                      }
                    `}
                    onClick={() => {
                      onSelectCoupon(isSelected ? null : tier);
                      setIsOpen(false);
                    }}
                  >
                    <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-start gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`
                          mt-0.5 p-2 rounded-lg
                          ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                        `}>
                          {getIcon(tier.type)}
                        </div>
                        
                        <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                          <h4 className="font-semibold text-foreground mb-1">
                            {tier.reward}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {isRTL 
                              ? `سفارش‌های بالای ${formatCurrency(tier.threshold, language)}`
                              : `On orders above ${formatCurrency(tier.threshold, language)}`
                            }
                          </p>
                          {tier.value && (
                            <p className="text-xs text-primary font-medium mt-1">
                              {t.checkout.coupons.savingsOf} {formatCurrency(tier.value, language)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected ? 'border-primary bg-primary' : 'border-border'}
                      `}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Unavailable Coupons with Progress */}
          {unavailableCoupons.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className={`text-sm font-semibold text-muted-foreground uppercase tracking-wide ${isRTL ? 'text-right' : ''}`}>
                {t.checkout.coupons.addMore}
              </h3>
              {unavailableCoupons.map((tier, index) => {
                const progress = getProgress(tier.threshold);
                const amountNeeded = getAmountNeeded(tier.threshold);
                
                return (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-border bg-muted/20"
                  >
                    <div className={`flex items-start gap-3 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="mt-0.5 p-2 rounded-lg bg-muted text-muted-foreground opacity-60">
                        {getIcon(tier.type)}
                      </div>
                      
                      <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                        <h4 className="font-semibold text-foreground mb-1 opacity-60">
                          {tier.reward}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {isRTL 
                            ? `سفارش‌های بالای ${formatCurrency(tier.threshold, language)}`
                            : `On orders above ${formatCurrency(tier.threshold, language)}`
                          }
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className={`text-xs text-primary font-medium ${isRTL ? 'text-right' : ''}`}>
                        {isRTL 
                          ? `${formatCurrency(amountNeeded, language)} دیگر برای فعال‌سازی`
                          : `Add ${formatCurrency(amountNeeded, language)} more to unlock this offer`
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {availableCoupons.length === 0 && unavailableCoupons.length === 0 && (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">
                {isRTL ? "کوپنی موجود نیست" : "No coupons available"}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
```

### AutoReorderOptionsLocalized.tsx

```tsx
import { useState } from "react";
import { Bell, Calendar, TrendingDown } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useLanguage, formatCurrency, toPersianNumber } from "@/i18n";

interface AutoReorderOptionsLocalizedProps {
  onOptionsChange?: (options: {
    priceDropAlert: boolean;
    priceDropThreshold?: number;
    autoReorderMonthly: boolean;
    priceDecreaseNotify: boolean;
  }) => void;
}

export const AutoReorderOptionsLocalized = ({ onOptionsChange }: AutoReorderOptionsLocalizedProps) => {
  const { t, isRTL, language } = useLanguage();
  const [priceDropAlert, setPriceDropAlert] = useState(false);
  const [priceDropThreshold, setPriceDropThreshold] = useState("");
  const [autoReorderMonthly, setAutoReorderMonthly] = useState(false);
  const [priceDecreaseNotify, setPriceDecreaseNotify] = useState(false);

  const handleChange = (
    field: string,
    value: boolean | string
  ) => {
    const updates: any = {
      priceDropAlert,
      priceDropThreshold: priceDropThreshold ? parseFloat(priceDropThreshold) : undefined,
      autoReorderMonthly,
      priceDecreaseNotify
    };
    
    if (field === 'priceDropAlert') {
      setPriceDropAlert(value as boolean);
      updates.priceDropAlert = value;
    } else if (field === 'priceDropThreshold') {
      setPriceDropThreshold(value as string);
      updates.priceDropThreshold = value ? parseFloat(value as string) : undefined;
    } else if (field === 'autoReorderMonthly') {
      setAutoReorderMonthly(value as boolean);
      updates.autoReorderMonthly = value;
    } else if (field === 'priceDecreaseNotify') {
      setPriceDecreaseNotify(value as boolean);
      updates.priceDecreaseNotify = value;
    }

    onOptionsChange?.(updates);
  };

  return (
    <div className={`border-t border-border pt-4 mt-4 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <h3 className="text-sm font-semibold text-foreground mb-3">{t.checkout.autoReorder.title}</h3>
      
      <div className="space-y-3">
        {/* Price Drop Alert */}
        <div className={`flex items-start gap-3 p-3 bg-muted/20 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="priceDrop"
              checked={priceDropAlert}
              onChange={(e) => handleChange('priceDropAlert', e.target.checked)}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="priceDrop" className={`flex items-center gap-2 font-medium cursor-pointer ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <TrendingDown className="w-4 h-4 text-primary" />
              {t.checkout.autoReorder.priceDropBelow}
            </Label>
            {priceDropAlert && (
              <div className={`mt-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                <span className="text-lg">{isRTL ? 'تومان' : '₹'}</span>
                <Input
                  type="number"
                  value={priceDropThreshold}
                  onChange={(e) => handleChange('priceDropThreshold', e.target.value)}
                  placeholder={isRTL ? "قیمت را وارد کنید" : "Enter price"}
                  className={`h-9 w-32 ${isRTL ? 'text-right' : ''}`}
                  dir="ltr"
                />
              </div>
            )}
          </div>
        </div>

        {/* Monthly Auto-Reorder */}
        <div className={`flex items-start gap-3 p-3 bg-muted/20 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="monthly"
              checked={autoReorderMonthly}
              onChange={(e) => handleChange('autoReorderMonthly', e.target.checked)}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="monthly" className={`flex items-center gap-2 font-medium cursor-pointer ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <Calendar className="w-4 h-4 text-primary" />
              {t.checkout.autoReorder.monthlyReorder}
            </Label>
            <p className={`text-xs text-muted-foreground mt-1 ${isRTL ? 'text-right' : ''}`}>
              {isRTL 
                ? "این سفارش را هر ماه به صورت خودکار ثبت می‌کنیم"
                : "We'll automatically place this order every month"
              }
            </p>
          </div>
        </div>

        {/* Price Decrease Notification */}
        <div className={`flex items-start gap-3 p-3 bg-muted/20 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="notify"
              checked={priceDecreaseNotify}
              onChange={(e) => handleChange('priceDecreaseNotify', e.target.checked)}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="notify" className={`flex items-center gap-2 font-medium cursor-pointer ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <Bell className="w-4 h-4 text-primary" />
              {t.checkout.autoReorder.notifyPriceDrop}
            </Label>
            <p className={`text-xs text-muted-foreground mt-1 ${isRTL ? 'text-right' : ''}`}>
              {isRTL 
                ? "هنگام کاهش قیمت به شما اطلاع می‌دهیم"
                : "Get alerts when prices drop"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### EnhancedUpsellCarouselLocalized.tsx

```tsx
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "./ui/button";
import { UpsellProduct } from "@/types/checkout";
import { Progress } from "./ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useLanguage, formatCurrency, toPersianNumber } from "@/i18n";

interface ProductVariant {
  id: string;
  name: string;
  priceModifier: number;
}

interface UpsellProductWithVariants extends UpsellProduct {
  variants?: {
    type: string;
    options: ProductVariant[];
  }[];
}

interface EnhancedUpsellCarouselLocalizedProps {
  products: UpsellProductWithVariants[];
  onAddProduct: (product: UpsellProduct, variant?: string) => void;
  addedProductIds: string[];
  currentTotal: number;
  nextTierThreshold?: number;
  nextTierReward?: string;
}

export const EnhancedUpsellCarouselLocalized = ({ 
  products, 
  onAddProduct,
  addedProductIds,
  currentTotal,
  nextTierThreshold,
  nextTierReward
}: EnhancedUpsellCarouselLocalizedProps) => {
  const { t, isRTL, language } = useLanguage();
  const [addingId, setAddingId] = useState<number | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<number, Record<string, string>>>({});

  const handleAdd = (product: UpsellProductWithVariants) => {
    setAddingId(product.id);
    
    let finalPrice = product.price;
    const productVariants = selectedVariants[product.id] || {};
    
    if (product.variants) {
      product.variants.forEach(variantType => {
        const selectedVariantId = productVariants[variantType.type];
        if (selectedVariantId) {
          const variant = variantType.options.find(v => v.id === selectedVariantId);
          if (variant) {
            finalPrice += variant.priceModifier;
          }
        }
      });
    }

    const variantLabel = Object.entries(productVariants)
      .map(([type, id]) => {
        const variantType = product.variants?.find(v => v.type === type);
        const variant = variantType?.options.find(v => v.id === id);
        return variant?.name;
      })
      .filter(Boolean)
      .join(", ");

    setTimeout(() => {
      onAddProduct({ ...product, price: finalPrice }, variantLabel);
      setAddingId(null);
    }, 300);
  };

  const handleVariantChange = (productId: number, variantType: string, variantId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [variantType]: variantId
      }
    }));
  };

  const getProductId = (product: UpsellProduct, variant?: string) => {
    return variant ? `${product.id}-${variant}` : product.id.toString();
  };

  const progress = nextTierThreshold ? Math.min((currentTotal / nextTierThreshold) * 100, 100) : 0;
  const amountNeeded = nextTierThreshold ? Math.max(nextTierThreshold - currentTotal, 0) : 0;

  const getVariantPlaceholder = (type: string) => {
    if (isRTL) {
      switch (type) {
        case "size": return "انتخاب سایز";
        case "color": return "انتخاب رنگ";
        case "pack": return "انتخاب بسته";
        default: return `انتخاب ${type}`;
      }
    }
    return `Select ${type}`;
  };

  return (
    <div className={`border-t border-border pt-4 mt-4 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h3 className="text-base font-semibold text-foreground">
          🛍️ {t.checkout.upsells.title}
        </h3>
        {nextTierThreshold && amountNeeded > 0 && (
          <span className="text-xs text-primary font-medium">
            {isRTL 
              ? `${formatCurrency(amountNeeded, language)} دیگر برای جوایز`
              : `Add ${formatCurrency(amountNeeded, language)} to unlock perks`
            }
          </span>
        )}
      </div>

      {/* Gamified Progress Bar */}
      {nextTierThreshold && amountNeeded > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
          <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <p className="text-sm font-medium text-foreground">
              {isRTL 
                ? `${formatCurrency(amountNeeded, language)} دیگر برای فعال‌سازی:`
                : `Spend ${formatCurrency(amountNeeded, language)} more to unlock:`
              }
            </p>
          </div>
          <Progress value={progress} className="h-2 mb-2" />
          <div className="space-y-1">
            <p className={`text-xs text-primary font-medium flex items-center gap-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <Check className="w-3 h-3" />
              {nextTierReward}
            </p>
          </div>
        </div>
      )}
      
      <div className={`flex gap-3 overflow-x-auto pb-2 scrollbar-hide ${isRTL ? 'flex-row-reverse' : ''}`}>
        {products.map((product) => {
          const productVariants = selectedVariants[product.id] || {};
          const variantLabel = Object.entries(productVariants)
            .map(([type, id]) => {
              const variantType = product.variants?.find(v => v.type === type);
              return variantType?.options.find(v => v.id === id)?.name;
            })
            .filter(Boolean)
            .join(", ");
          
          const productIdKey = getProductId(product, variantLabel);
          const isAdded = addedProductIds.includes(productIdKey);
          const isAdding = addingId === product.id;
          
          let displayPrice = product.price;
          if (product.variants) {
            product.variants.forEach(variantType => {
              const selectedVariantId = productVariants[variantType.type];
              if (selectedVariantId) {
                const variant = variantType.options.find(v => v.id === selectedVariantId);
                if (variant) {
                  displayPrice += variant.priceModifier;
                }
              }
            });
          }
          
          return (
            <div
              key={product.id}
              className={`
                min-w-[180px] bg-background border rounded-xl p-3 
                transition-all duration-300 hover:shadow-md hover:-translate-y-1
                ${isAdded ? 'border-accent bg-accent/10' : 'border-border'}
                ${isAdding ? 'animate-scale-in' : ''}
              `}
            >
              <div className="aspect-square bg-muted/30 rounded-lg mb-2 overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <h4 className={`text-sm font-medium text-foreground mb-1 line-clamp-2 min-h-[2.5rem] ${isRTL ? 'text-right' : ''}`}>
                {product.name}
              </h4>

              {/* Variant Selectors */}
              {product.variants && product.variants.map((variantType) => (
                <div key={variantType.type} className="mb-2">
                  <Select
                    value={productVariants[variantType.type] || ""}
                    onValueChange={(value) => handleVariantChange(product.id, variantType.type, value)}
                  >
                    <SelectTrigger className={`h-8 text-xs ${isRTL ? 'text-right' : ''}`}>
                      <SelectValue placeholder={getVariantPlaceholder(variantType.type)} />
                    </SelectTrigger>
                    <SelectContent>
                      {variantType.options.map((option) => (
                        <SelectItem key={option.id} value={option.id} className="text-xs">
                          {option.name}
                          {option.priceModifier !== 0 && (
                            <span className="text-muted-foreground mx-1">
                              ({option.priceModifier > 0 ? '+' : ''}{formatCurrency(option.priceModifier, language)})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              <p className={`text-base font-bold text-foreground mb-2 ${isRTL ? 'text-right' : ''}`}>
                {formatCurrency(displayPrice, language)}
              </p>
              
              <Button
                size="sm"
                variant={isAdded ? "secondary" : "default"}
                className={`w-full h-8 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}
                onClick={() => !isAdded && handleAdd(product)}
                disabled={isAdded || (product.variants && product.variants.some(v => !productVariants[v.type]))}
              >
                {isAdded ? (
                  <>
                    <Check className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {isRTL ? "اضافه شد" : "Added"}
                  </>
                ) : (
                  <>
                    <Plus className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t.checkout.upsells.addToOrder}
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
```

### CheckoutModalLocalized.tsx

**Note:** This is a large file (828 lines). The complete code is in the project at `src/components/CheckoutModalLocalized.tsx`.

---

## i18n System

### LanguageContext.tsx

```tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from './translations/en.json';
import fa from './translations/fa.json';

type Language = 'en' | 'fa';
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
  dir: 'ltr' | 'rtl';
}

const translations: Record<Language, Translations> = { en, fa };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export const LanguageProvider = ({ children, defaultLanguage = 'en' }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  
  const isRTL = language === 'fa';
  const dir = isRTL ? 'rtl' : 'ltr';
  const t = translations[language];

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
    document.body.classList.toggle('rtl', isRTL);
  }, [language, dir, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Helper to format numbers in Persian
export const toPersianNumber = (num: number | string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

// Format currency based on language
export const formatCurrency = (amount: number, language: Language): string => {
  if (language === 'fa') {
    return `${toPersianNumber(amount.toLocaleString())} تومان`;
  }
  return `₹${amount.toFixed(2)}`;
};
```

### index.ts

```tsx
export { LanguageProvider, useLanguage, toPersianNumber, formatCurrency } from './LanguageContext';
```

### translations/fa.json

```json
{
  "common": {
    "home": "خانه",
    "newArrivals": "محصولات جدید",
    "electronics": "الکترونیک",
    "accessories": "لوازم جانبی",
    "lifestyle": "سبک زندگی",
    "sale": "حراج",
    "search": "جستجوی محصولات…",
    "currency": "تومان",
    "free": "رایگان",
    "off": "تخفیف",
    "apply": "اعمال",
    "save": "ذخیره",
    "cancel": "انصراف",
    "confirm": "تأیید",
    "close": "بستن",
    "back": "بازگشت",
    "next": "بعدی",
    "loading": "در حال بارگذاری...",
    "poweredBy": "قدرت گرفته از فلوکارت"
  },
  "header": {
    "brandName": "شاپ‌فلو",
    "tagline": "فروشگاه مورد اعتماد شما"
  },
  "cart": {
    "title": "سبد خرید",
    "items": "کالا",
    "emptyTitle": "سبد خرید شما خالی است",
    "emptySubtitle": "محصولاتی را برای شروع اضافه کنید!",
    "inStock": "موجود",
    "outOfStock": "ناموجود",
    "moveToWishlist": "انتقال به لیست علاقه‌مندی",
    "continueShopping": "ادامه خرید"
  },
  "orderSummary": {
    "title": "خلاصه سفارش",
    "enterPromo": "کد تخفیف را وارد کنید",
    "promoApplied": "کد تخفیف اعمال شد",
    "subtotal": "جمع جزء",
    "discount": "تخفیف",
    "shipping": "هزینه ارسال",
    "taxes": "مالیات",
    "total": "مجموع",
    "taxesIncluded": "شامل تمام مالیات‌ها. ارسال رایگان برای خرید بالای ۴۹۹ تومان.",
    "checkoutNow": "← پرداخت نهایی",
    "secureCheckout": "پرداخت امن با شاپفلو"
  },
  "checkout": {
    "thankYou": "از خرید شما متشکریم!",
    "greeting": "سلام",
    "readyToComplete": "آماده تکمیل سفارش هستید؟",
    "step": "مرحله",
    "steps": {
      "address": "آدرس و تحویل",
      "payment": "روش پرداخت",
      "review": "بررسی سفارش"
    },
    "banners": {
      "address": "تحویل امن با فلوکارت",
      "payment": "فقط یک کلیک تا تکمیل",
      "coupon": "پس‌انداز هوشمند فعال شد",
      "review": "تقریباً تمام! سفارش خود را بررسی کنید"
    },
    "address": {
      "title": "آدرس تحویل",
      "addNew": "افزودن آدرس جدید",
      "edit": "ویرایش",
      "default": "پیش‌فرض",
      "setDefault": "تنظیم به عنوان پیش‌فرض",
      "name": "نام کامل",
      "phone": "شماره تلفن",
      "street": "آدرس خیابان",
      "city": "شهر",
      "state": "استان",
      "pincode": "کد پستی",
      "save": "ذخیره آدرس"
    },
    "delivery": {
      "title": "روش تحویل",
      "standard": "تحویل عادی",
      "standardTime": "۵-۷ روز کاری",
      "express": "تحویل سریع",
      "expressTime": "۱-۲ روز کاری"
    },
    "payment": {
      "title": "روش پرداخت",
      "upi": "درگاه پرداخت",
      "upiDesc": "پرداخت با اپلیکیشن بانکی",
      "card": "کارت بانکی",
      "cardDesc": "ویزا، مسترکارت، شتاب",
      "cod": "پرداخت درب منزل",
      "codDesc": "پرداخت هنگام تحویل"
    },
    "review": {
      "title": "بررسی سفارش",
      "saveDetails": "ذخیره اطلاعات من برای پرداخت سریع‌تر",
      "placeOrder": "ثبت سفارش",
      "processing": "در حال پردازش سفارش…",
      "secondsToComplete": "ثانیه تا تکمیل"
    },
    "coupons": {
      "title": "کوپن‌های موجود",
      "applied": "اعمال شده",
      "addMore": "برای فعال‌سازی بیشتر خرید کنید",
      "unlocked": "فعال شد!",
      "savingsOf": "پس‌انداز"
    },
    "upsells": {
      "title": "شاید این‌ها را هم دوست داشته باشید",
      "addToOrder": "افزودن به سفارش",
      "spendMore": "برای فعال‌سازی بیشتر خرید کنید",
      "freeDelivery": "ارسال رایگان",
      "cartDiscount": "تخفیف سبد"
    },
    "autoReorder": {
      "title": "گزینه‌های سفارش خودکار",
      "priceDropBelow": "خرید خودکار وقتی قیمت کمتر از",
      "monthlyReorder": "خرید خودکار ماهانه",
      "notifyPriceDrop": "اطلاع‌رسانی کاهش قیمت"
    }
  },
  "success": {
    "title": "سفارش تأیید شد",
    "subtitle": "تکمیل شده در",
    "seconds": "ثانیه",
    "fasterThan": "۵ برابر سریع‌تر از پرداخت معمولی",
    "orderId": "شماره سفارش",
    "deliveryDate": "تاریخ تحویل",
    "continueShopping": "ادامه خرید"
  },
  "footer": {
    "about": "درباره ما",
    "careers": "فرصت‌های شغلی",
    "contact": "تماس با ما",
    "blog": "وبلاگ",
    "support": "پشتیبانی",
    "help": "راهنما",
    "returns": "بازگشت کالا",
    "shippingInfo": "اطلاعات ارسال",
    "privacyPolicy": "حریم خصوصی",
    "followUs": "ما را دنبال کنید",
    "copyright": "© ۱۴۰۴ شاپ‌فلو. تمامی حقوق محفوظ است.",
    "demoNote": "الهام گرفته از شاپفلو — ساخته شده فقط برای نمایش."
  },
  "recommended": {
    "title": "پیشنهادی برای شما",
    "addToCart": "افزودن به سبد"
  },
  "modeSelector": {
    "title": "انتخاب حالت پرداخت",
    "description": "یک تجربه پرداخت را برای نمایش انتخاب کنید"
  },
  "agentic": {
    "title": "دستیار خرید هوشمند",
    "placeholder": "توضیح دهید چه می‌خواهید...",
    "filters": "فیلترها",
    "buy": "خرید",
    "promoted": "تبلیغاتی"
  },
  "merchant": {
    "dashboard": "داشبورد فروشنده",
    "todaysOrders": "سفارش‌های امروز",
    "conversionRate": "نرخ تبدیل",
    "upsellRevenue": "درآمد فروش مکمل",
    "couponUsage": "استفاده از کوپن",
    "aov": "میانگین ارزش سفارش"
  }
}
```

### translations/en.json

```json
{
  "common": {
    "home": "Home",
    "newArrivals": "New Arrivals",
    "electronics": "Electronics",
    "accessories": "Accessories",
    "lifestyle": "Lifestyle",
    "sale": "Sale",
    "search": "Search for products…",
    "currency": "₹",
    "free": "FREE",
    "off": "OFF",
    "apply": "Apply",
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "close": "Close",
    "back": "Back",
    "next": "Next",
    "loading": "Loading...",
    "poweredBy": "Powered by Flowcart"
  },
  "header": {
    "brandName": "ShopFlow",
    "tagline": "Your trusted store"
  },
  "cart": {
    "title": "Shopping Cart",
    "items": "items",
    "emptyTitle": "Your cart is empty",
    "emptySubtitle": "Add some products to get started!",
    "inStock": "In stock",
    "outOfStock": "Out of stock",
    "moveToWishlist": "Move to Wishlist",
    "continueShopping": "Continue Shopping"
  },
  "orderSummary": {
    "title": "Order Summary",
    "enterPromo": "Enter promo code",
    "promoApplied": "Promo applied",
    "subtotal": "Subtotal",
    "discount": "Discount",
    "shipping": "Shipping",
    "taxes": "Taxes",
    "total": "Total",
    "taxesIncluded": "All taxes included. Free shipping over ₹499.",
    "checkoutNow": "Checkout Now →",
    "secureCheckout": "Secure checkout powered by Shopflo"
  },
  "checkout": {
    "thankYou": "Thank you for shopping with us!",
    "greeting": "Hi",
    "readyToComplete": "ready to complete your order?",
    "step": "STEP",
    "steps": {
      "address": "Address & Delivery",
      "payment": "Payment Method",
      "review": "Review Order"
    },
    "banners": {
      "address": "Secure delivery powered by Flowcart",
      "payment": "One tap and you're done",
      "coupon": "Smart savings unlocked",
      "review": "Almost there! Review your order"
    },
    "address": {
      "title": "Delivery Address",
      "addNew": "Add New Address",
      "edit": "Edit",
      "default": "Default",
      "setDefault": "Set as Default",
      "name": "Full Name",
      "phone": "Phone Number",
      "street": "Street Address",
      "city": "City",
      "state": "State",
      "pincode": "PIN Code",
      "save": "Save Address"
    },
    "delivery": {
      "title": "Delivery Method",
      "standard": "Standard Delivery",
      "standardTime": "5-7 business days",
      "express": "Express Delivery",
      "expressTime": "1-2 business days"
    },
    "payment": {
      "title": "Payment Method",
      "upi": "UPI",
      "upiDesc": "Pay using UPI apps",
      "card": "Debit/Credit Card",
      "cardDesc": "Visa, Mastercard, RuPay",
      "cod": "Cash on Delivery",
      "codDesc": "Pay when delivered"
    },
    "review": {
      "title": "Review Order",
      "saveDetails": "Save my details for faster checkout next time",
      "placeOrder": "Place Order",
      "processing": "Processing order…",
      "secondsToComplete": "seconds to completion"
    },
    "coupons": {
      "title": "Available Coupons",
      "applied": "Applied",
      "addMore": "Add more to unlock",
      "unlocked": "Unlocked!",
      "savingsOf": "Savings of"
    },
    "upsells": {
      "title": "You might also like",
      "addToOrder": "Add to Order",
      "spendMore": "Spend more to unlock",
      "freeDelivery": "Free delivery",
      "cartDiscount": "cart discount"
    },
    "autoReorder": {
      "title": "Auto-reorder Options",
      "priceDropBelow": "Auto-buy when price drops below",
      "monthlyReorder": "Auto-buy monthly",
      "notifyPriceDrop": "Notify me if price decreases"
    }
  },
  "success": {
    "title": "Order Confirmed",
    "subtitle": "Completed in",
    "seconds": "seconds",
    "fasterThan": "5× faster than normal checkout",
    "orderId": "Order ID",
    "deliveryDate": "Expected Delivery",
    "continueShopping": "Continue Shopping"
  },
  "footer": {
    "about": "About",
    "careers": "Careers",
    "contact": "Contact",
    "blog": "Blog",
    "support": "Support",
    "help": "Help",
    "returns": "Returns",
    "shippingInfo": "Shipping Info",
    "privacyPolicy": "Privacy Policy",
    "followUs": "Follow Us",
    "copyright": "© 2025 ShopFlow. All rights reserved.",
    "demoNote": "Demo inspired by Shopflo — built for presentation purposes only."
  },
  "recommended": {
    "title": "Recommended for You",
    "addToCart": "Add to Cart"
  },
  "modeSelector": {
    "title": "Select Checkout Mode",
    "description": "Choose a checkout experience to demo"
  },
  "agentic": {
    "title": "AI Shopping Assistant",
    "placeholder": "Describe what you're looking for...",
    "filters": "Filters",
    "buy": "Buy",
    "promoted": "Promoted"
  },
  "merchant": {
    "dashboard": "Merchant Dashboard",
    "todaysOrders": "Today's Orders",
    "conversionRate": "Conversion Rate",
    "upsellRevenue": "Upsell Revenue",
    "couponUsage": "Coupon Usage",
    "aov": "Average Order Value"
  }
}
```

---

## Additional Dependencies

Make sure you have these dependencies installed:

- `react-router-dom` - For routing
- `lucide-react` - For icons
- Shadcn UI components (`Button`, `Input`, `Label`, `RadioGroup`, `Checkbox`, `Sheet`, `Select`, `Progress`, etc.)

---

## Notes

1. The `CheckoutModalLocalized.tsx` file is 828 lines long. View the full file in the project.
2. You'll need the shared dependencies like `@/types/checkout`, `@/data/checkoutModes` for full functionality.
3. Add the font "Vazirmatn" for proper Persian text rendering (optional but recommended).

---

**Generated for export on** January 1, 2026
