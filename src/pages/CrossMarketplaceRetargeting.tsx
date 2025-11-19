import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ShoppingBag, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const CrossMarketplaceRetargeting = () => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [abandoned, setAbandoned] = useState(false);
  const [showRetarget, setShowRetarget] = useState(false);

  const handleAbandon = () => {
    setShowCheckout(false);
    setTimeout(() => setAbandoned(true), 500);
    setTimeout(() => setShowRetarget(true), 2000);
  };

  const handleComplete = () => {
    setShowRetarget(false);
    setAbandoned(false);
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
            <h1 className="text-3xl font-bold mb-2">Cross-Marketplace Retargeting</h1>
            <p className="text-muted-foreground">Smart offers that follow users across stores</p>
          </div>

          {!abandoned ? (
            <div className="bg-card rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-6 mb-6">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200"
                  alt="Wireless Headphones"
                  className="w-32 h-32 rounded-xl object-cover bg-muted"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">Premium Wireless Headphones</h3>
                  <p className="text-muted-foreground mb-2">Active Noise Cancellation, 30hr Battery</p>
                  <p className="text-2xl font-bold text-primary">₹4,999</p>
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
          ) : (
            <div className="bg-card rounded-2xl shadow-lg p-8 text-center">
              <div className="max-w-md mx-auto">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-bold mb-2">Browsing Other Stores...</h2>
                <p className="text-muted-foreground mb-4">
                  Simulating user navigation to a different marketplace
                </p>
                <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm animate-pulse">
                  Smart retargeting AI activated
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Initial Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Complete Your Order</h2>
              <button
                onClick={handleAbandon}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex gap-4 mb-6">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100"
                  alt="Headphones"
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold">Premium Wireless Headphones</h3>
                  <p className="text-2xl font-bold text-primary mt-1">₹4,999</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary focus:outline-none"
                />
              </div>

              <Button onClick={handleAbandon} className="w-full" size="lg">
                Proceed to Payment
              </Button>
              
              <p className="text-center text-xs text-muted-foreground mt-4">
                🔒 Secure checkout — 256-bit encrypted
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Retargeting Popup */}
      {showRetarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <h2 className="text-xl font-bold">Still Want Your Headphones?</h2>
              </div>
              <button
                onClick={() => setShowRetarget(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Identified via shared login cookie
                </p>
                <p className="font-semibold text-lg">Complete your order now for 12% OFF</p>
              </div>

              <div className="flex gap-4 mb-6">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100"
                  alt="Headphones"
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Premium Wireless Headphones</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-lg line-through text-muted-foreground">₹4,999</p>
                    <p className="text-2xl font-bold text-primary">₹4,399</p>
                  </div>
                  <div className="inline-block px-2 py-1 bg-green-500/10 text-green-600 text-xs rounded mt-1">
                    Save ₹600
                  </div>
                </div>
              </div>

              <Button onClick={handleComplete} className="w-full mb-3" size="lg">
                Complete Order with Discount
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">We'll match any price you're seeing</p>
                <div className="flex justify-center gap-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6 opacity-50" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 opacity-50" />
                </div>
              </div>

              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-center text-muted-foreground">
                Cross-marketplace retargeting — No ad platforms needed
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossMarketplaceRetargeting;
