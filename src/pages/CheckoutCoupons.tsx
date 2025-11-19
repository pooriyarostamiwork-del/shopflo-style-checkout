import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Percent, Gift, Truck, TrendingUp, Check, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const CheckoutCoupons = () => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartTotal, setCartTotal] = useState(1500);
  const [quantity, setQuantity] = useState(1);

  const percentOff = cartTotal >= 1000 ? 10 : 0;
  const freeShippingThreshold = 2000;
  const freebieThreshold = 3000;
  
  const tierDiscounts = [
    { threshold: 2000, discount: 400 },
    { threshold: 3000, discount: 700 },
    { threshold: 4000, discount: 1100 },
  ];

  const activeTier = tierDiscounts.filter(t => cartTotal >= t.threshold).pop();
  const nextTier = tierDiscounts.find(t => cartTotal < t.threshold);

  const shippingProgress = Math.min((cartTotal / freeShippingThreshold) * 100, 100);
  const freebieProgress = Math.min((cartTotal / freebieThreshold) * 100, 100);

  const finalDiscount = (percentOff > 0 ? (cartTotal * percentOff) / 100 : 0) + (activeTier?.discount || 0);
  const finalTotal = cartTotal - finalDiscount;

  const handleUpdateQuantity = (change: number) => {
    const newQty = Math.max(1, quantity + change);
    setQuantity(newQty);
    setCartTotal(1500 * newQty);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header cartItemCount={0} />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Demos
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Advanced Multi-Type Coupons</h1>
            <p className="text-muted-foreground">Real-time coupon evaluation and savings optimization</p>
          </div>

          <div className="bg-card rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-6 mb-6">
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"
                alt="Premium Watch"
                className="w-32 h-32 rounded-xl object-cover bg-muted"
              />
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">Luxury Chronograph Watch</h3>
                <p className="text-muted-foreground mb-2">Swiss Movement, Sapphire Crystal</p>
                <p className="text-2xl font-bold text-primary">₹1,500 each</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <Button
                onClick={() => handleUpdateQuantity(-1)}
                variant="outline"
                size="sm"
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
              <Button
                onClick={() => handleUpdateQuantity(1)}
                variant="outline"
                size="sm"
              >
                +
              </Button>
            </div>
            <Button
              onClick={() => setShowCheckout(true)}
              className="w-full"
              size="lg"
            >
              Checkout Now
            </Button>
          </div>
        </div>
      </main>

      <Footer />

      {/* Checkout Modal with Multi-Type Coupons */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
              <h2 className="text-xl font-bold">Complete Your Order</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Percentage Based Coupon */}
              {percentOff > 0 ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-600">{percentOff}% off unlocked!</p>
                      <p className="text-sm text-muted-foreground">On orders over ₹1,000</p>
                    </div>
                    <span className="text-lg font-bold text-green-600">-₹{(cartTotal * percentOff) / 100}</span>
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Percent className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Get 10% off</span>
                  </div>
                  <div className="mb-2">
                    <Progress value={(cartTotal / 1000) * 100} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add ₹{1000 - cartTotal} more to unlock 10% discount
                  </p>
                </div>
              )}

              {/* Free Shipping Threshold */}
              {shippingProgress >= 100 ? (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-600">Free delivery unlocked!</p>
                      <p className="text-sm text-muted-foreground">Shipping on us</p>
                    </div>
                    <span className="text-lg font-bold text-blue-600">FREE</span>
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Truck className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Free Delivery</span>
                  </div>
                  <div className="mb-2">
                    <Progress value={shippingProgress} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add ₹{freeShippingThreshold - cartTotal} more for free delivery
                  </p>
                </div>
              )}

              {/* Freebie Unlock */}
              {freebieProgress >= 100 ? (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-purple-600">Free gift unlocked! 🎁</p>
                      <p className="text-sm text-muted-foreground">Premium Watch Box (₹499 value)</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Gift className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Free Premium Watch Box</span>
                  </div>
                  <div className="mb-2">
                    <Progress value={freebieProgress} className="h-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add ₹{freebieThreshold - cartTotal} more to unlock free gift (₹499 value)
                  </p>
                </div>
              )}

              {/* Buy More Save More */}
              <div className="border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Buy More, Save More</span>
                </div>
                <div className="space-y-2">
                  {tierDiscounts.map((tier, idx) => {
                    const isActive = activeTier?.threshold === tier.threshold;
                    const isPassed = cartTotal >= tier.threshold;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                          isActive
                            ? "bg-primary/20 border-2 border-primary animate-fade-in"
                            : isPassed
                            ? "bg-muted/50"
                            : "bg-muted/20"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isPassed && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                          <span className={`text-sm ${isActive ? "font-bold" : ""}`}>
                            Spend ₹{tier.threshold}
                          </span>
                        </div>
                        <span className={`font-bold ${isActive ? "text-primary text-lg" : ""}`}>
                          ₹{tier.discount} OFF
                        </span>
                      </div>
                    );
                  })}
                </div>
                {nextTier && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Add ₹{nextTier.threshold - cartTotal} more to save ₹{nextTier.discount}
                  </p>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹{cartTotal}</span>
                </div>
                {finalDiscount > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-green-600">Best savings applied</span>
                    <span className="font-semibold text-green-600">-₹{finalDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold">
                    {shippingProgress >= 100 ? "FREE" : "₹99"}
                  </span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{finalTotal + (shippingProgress >= 100 ? 0 : 99)}
                    </span>
                  </div>
                </div>
              </div>

              <Button className="w-full mb-3" size="lg">
                Complete Order
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Real-time coupon evaluation — Best available savings applied automatically
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutCoupons;
