import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, ShoppingCart, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const FloatingCartCrossStore = () => {
  const [showStoreB, setShowStoreB] = useState(false);
  const [showFloatingCart, setShowFloatingCart] = useState(false);
  const [cartExpanded, setCartExpanded] = useState(false);

  const cartItems = [
    { name: "Laptop Stand", price: 1299, img: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100" },
    { name: "Wireless Mouse", price: 899, img: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=100" },
    { name: "USB-C Hub", price: 1499, img: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=100" },
  ];

  const handleNavigateToStoreB = () => {
    setShowStoreB(true);
    setTimeout(() => setShowFloatingCart(true), 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header cartItemCount={cartItems.length} />
      
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
            <h1 className="text-3xl font-bold mb-2">Floating Cart Across Stores</h1>
            <p className="text-muted-foreground">Your cart follows you everywhere</p>
          </div>

          {!showStoreB ? (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                <p className="font-semibold">Store A — Tech Accessories</p>
              </div>

              {cartItems.map((item, idx) => (
                <div key={idx} className="bg-card rounded-xl shadow-md p-4 flex items-center gap-4">
                  <img src={item.img} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-xl font-bold text-primary">₹{item.price}</p>
                  </div>
                </div>
              ))}

              <Button
                onClick={handleNavigateToStoreB}
                className="w-full mt-6"
                size="lg"
              >
                Simulate Navigation to Store B
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl shadow-lg p-8 text-center">
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-bold mb-4">Now Browsing Store B</h2>
                <p className="text-muted-foreground mb-6">
                  Your cart from Store A is following you...
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-4 h-32"></div>
                  <div className="bg-muted rounded-lg p-4 h-32"></div>
                  <div className="bg-muted rounded-lg p-4 h-32"></div>
                  <div className="bg-muted rounded-lg p-4 h-32"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Floating Cart Widget */}
      {showFloatingCart && (
        <>
          {!cartExpanded ? (
            <button
              onClick={() => setCartExpanded(true)}
              className="fixed bottom-8 right-8 w-16 h-16 bg-primary rounded-full shadow-2xl flex items-center justify-center text-white animate-pulse-glow hover:scale-110 transition-transform z-50"
            >
              <ShoppingCart className="w-7 h-7" />
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                {cartItems.length}
              </span>
            </button>
          ) : (
            <div className="fixed bottom-8 right-8 w-96 bg-card rounded-2xl shadow-2xl animate-scale-in z-50">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Cart from Store A</h3>
                  <p className="text-xs text-muted-foreground">Following you across stores</p>
                </div>
                <button
                  onClick={() => setCartExpanded(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 max-h-80 overflow-y-auto">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                  <p className="text-sm font-semibold">
                    Complete checkout here and get free delivery! 🎉
                  </p>
                </div>

                <div className="space-y-3">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <img src={item.img} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{item.name}</p>
                        <p className="text-primary font-bold">₹{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between mb-3">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary">
                      ₹{cartItems.reduce((sum, item) => sum + item.price, 0)}
                    </span>
                  </div>
                  <Button className="w-full" size="lg">
                    Checkout in 1 Click
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Shared tracking + multi-store payment
                  </p>
                </div>
              </div>

              <div className="p-3 bg-muted/50 border-t border-border text-xs text-center text-muted-foreground">
                Platform becomes the cart of the web
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FloatingCartCrossStore;
