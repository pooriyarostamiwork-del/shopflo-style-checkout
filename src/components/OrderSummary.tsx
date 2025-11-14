import { useState } from "react";
import { Button } from "./ui/button";
import { CreditCard, Smartphone, Wallet } from "lucide-react";

interface OrderSummaryProps {
  subtotal: number;
  discount: number;
  shipping: number;
  onCheckout: () => void;
}

export const OrderSummary = ({ subtotal, discount, shipping, onCheckout }: OrderSummaryProps) => {
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const total = subtotal - discount + shipping;

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      setPromoApplied(true);
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-lg border border-border h-fit sticky top-6">
      <h2 className="text-xl font-bold mb-6 text-foreground">Order Summary</h2>
      
      {/* Promo Code Section */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 px-4 py-2 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyPromo}
            className="rounded-xl hover:bg-primary hover:text-white transition-colors"
          >
            Apply
          </Button>
        </div>
        {promoApplied && (
          <p className="text-xs text-green-600 mt-2 animate-fade-in">
            ✓ Promo applied: {promoCode}
          </p>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-₹{discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Shipping</span>
          <span className="text-green-600 font-medium">
            {shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Taxes</span>
          <span>₹0.00</span>
        </div>
        <div className="border-t border-border pt-3"></div>
        <div className="flex justify-between text-lg font-bold text-foreground">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        All taxes included. Free shipping over ₹499.
      </p>

      <Button 
        variant="checkout" 
        className="w-full h-14 text-lg rounded-xl mb-3"
        onClick={onCheckout}
      >
        Checkout Now →
      </Button>

      <button className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center hover:underline">
        Continue Shopping
      </button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        🔒 Secure checkout powered by Shopflo
      </p>

      {/* Trust Badges / Payment Icons */}
      <div className="flex justify-center items-center gap-3 mt-6 pt-6 border-t border-border">
        <div className="flex items-center gap-1 text-muted-foreground opacity-60">
          <CreditCard className="w-5 h-5" />
          <span className="text-xs">Visa</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground opacity-60">
          <CreditCard className="w-5 h-5" />
          <span className="text-xs">Mastercard</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground opacity-60">
          <Smartphone className="w-5 h-5" />
          <span className="text-xs">Razorpay</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground opacity-60">
          <Wallet className="w-5 h-5" />
          <span className="text-xs">PayPal</span>
        </div>
      </div>
    </div>
  );
};
