import { Button } from "./ui/button";

interface OrderSummaryProps {
  subtotal: number;
  discount: number;
  shipping: number;
  onCheckout: () => void;
}

export const OrderSummary = ({ subtotal, discount, shipping, onCheckout }: OrderSummaryProps) => {
  const total = subtotal - discount + shipping;

  return (
    <div className="bg-card rounded-xl p-6 shadow-lg border border-border h-fit sticky top-6">
      <h2 className="text-xl font-bold mb-4 text-foreground">Order Summary</h2>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-secondary">
            <span>Discount</span>
            <span>-₹{discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span>
          <span>{shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}</span>
        </div>
        <div className="border-t border-border pt-3"></div>
        <div className="flex justify-between text-lg font-bold text-foreground">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      <Button 
        variant="checkout" 
        className="w-full h-14 text-lg rounded-xl"
        onClick={onCheckout}
      >
        Checkout Now →
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-3">
        🔒 Secure checkout powered by Shopflo
      </p>
    </div>
  );
};
