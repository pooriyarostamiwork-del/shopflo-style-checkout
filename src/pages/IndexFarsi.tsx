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
      price: 2499000,
      originalPrice: 3999000,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
      quantity: 1,
      inStock: true,
    },
    {
      id: 2,
      name: "Smart Fitness Watch",
      nameFa: "ساعت هوشمند ورزشی",
      price: 4999000,
      originalPrice: 7999000,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
      quantity: 2,
      inStock: true,
    },
    {
      id: 3,
      name: "Leather Laptop Bag",
      nameFa: "کیف چرمی لپ‌تاپ",
      price: 1999000,
      originalPrice: 2999000,
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
