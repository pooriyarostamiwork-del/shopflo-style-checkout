import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Check, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const CheckoutUpsellCarousel = () => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartTotal, setCartTotal] = useState(5999);
  const [addedUpsells, setAddedUpsells] = useState<number[]>([]);

  const upsells = [
    { id: 1, name: "Laptop Sleeve", price: 699, discount: 100, img: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=150" },
    { id: 2, name: "Wireless Mouse", price: 899, discount: 150, img: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=150" },
    { id: 3, name: "USB-C Cable 2M", price: 399, discount: 50, img: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=150" },
    { id: 4, name: "Laptop Stand", price: 1299, discount: 200, img: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=150" },
  ];

  const freeShippingThreshold = 7000;
  const currentProgress = (cartTotal / freeShippingThreshold) * 100;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartTotal);

  const handleAddUpsell = (upsell: typeof upsells[0]) => {
    if (!addedUpsells.includes(upsell.id)) {
      setAddedUpsells([...addedUpsells, upsell.id]);
      setCartTotal(cartTotal + upsell.price - upsell.discount);
    }
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
            <h1 className="text-3xl font-bold mb-2">Upselling Carousel in Checkout</h1>
            <p className="text-muted-foreground">Increase AOV with smart product recommendations</p>
          </div>

          <div className="bg-card rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-6 mb-6">
              <img
                src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200"
                alt="Laptop"
                className="w-32 h-32 rounded-xl object-cover bg-muted"
              />
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">MacBook Pro 14"</h3>
                <p className="text-muted-foreground mb-2">M3 Chip, 16GB RAM, 512GB SSD</p>
                <p className="text-2xl font-bold text-primary">₹5,999</p>
              </div>
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

      {/* Checkout Modal with Upsell Carousel */}
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
            
            <div className="p-6">
              {/* Free Shipping Progress */}
              {remainingForFreeShipping > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">Add ₹{remainingForFreeShipping} more for free delivery!</span>
                    <span className="text-xs text-muted-foreground">{Math.round(currentProgress)}%</span>
                  </div>
                  <Progress value={currentProgress} className="h-2" />
                </div>
              )}

              {remainingForFreeShipping <= 0 && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-600">Free delivery unlocked! 🎉</span>
                  </div>
                </div>
              )}

              {/* Main Product */}
              <div className="flex gap-4 mb-6 pb-6 border-b border-border">
                <img
                  src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100"
                  alt="Laptop"
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">MacBook Pro 14"</h3>
                  <p className="text-2xl font-bold text-primary mt-1">₹5,999</p>
                </div>
              </div>

              {/* Upsell Carousel */}
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Complete your setup</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
                  {upsells.map((upsell) => {
                    const isAdded = addedUpsells.includes(upsell.id);
                    return (
                      <div
                        key={upsell.id}
                        className="flex-shrink-0 w-52 bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all"
                      >
                        <img
                          src={upsell.img}
                          alt={upsell.name}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                        <h4 className="font-semibold text-sm mb-2">{upsell.name}</h4>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg font-bold text-primary">
                            ₹{upsell.price - upsell.discount}
                          </span>
                          <span className="text-sm line-through text-muted-foreground">
                            ₹{upsell.price}
                          </span>
                        </div>
                        <div className="inline-block px-2 py-1 bg-green-500/10 text-green-600 text-xs rounded mb-3">
                          Save ₹{upsell.discount}
                        </div>
                        <Button
                          onClick={() => handleAddUpsell(upsell)}
                          disabled={isAdded}
                          size="sm"
                          className="w-full"
                          variant={isAdded ? "secondary" : "default"}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Added!
                            </>
                          ) : (
                            "+ Add"
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-muted/50 rounded-xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold">
                    {remainingForFreeShipping > 0 ? "₹99" : "FREE"}
                  </span>
                </div>
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      ₹{cartTotal + (remainingForFreeShipping > 0 ? 99 : 0)}
                    </span>
                  </div>
                </div>
              </div>

              <Button className="w-full mb-3" size="lg">
                Complete Order
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Designed to maximize AOV while maintaining profitability
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutUpsellCarousel;
