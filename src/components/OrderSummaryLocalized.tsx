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
