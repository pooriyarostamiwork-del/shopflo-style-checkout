import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, TrendingDown, Clock, Star, ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type AbandonReason = "price" | "delivery" | "quality";

const SmartAbandonmentAI = () => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [abandonReason, setAbandonReason] = useState<AbandonReason | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const recommendations = {
    price: [
      { name: "Budget Wireless Earbuds", price: 1999, rating: 4.2, delivery: "2 days", img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=100" },
      { name: "Affordable Over-Ear", price: 2499, rating: 4.0, delivery: "3 days", img: "https://images.unsplash.com/photo-1545127398-14699f92334b?w=100" },
      { name: "Value Headphones", price: 2999, rating: 4.3, delivery: "2 days", img: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=100" },
    ],
    delivery: [
      { name: "Same-Day Headphones", price: 4999, rating: 4.5, delivery: "Today", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100" },
      { name: "Express Wireless", price: 5499, rating: 4.6, delivery: "6 hours", img: "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=100" },
      { name: "Quick Ship Audio", price: 4799, rating: 4.4, delivery: "12 hours", img: "https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=100" },
    ],
    quality: [
      { name: "Premium ANC Pro", price: 8999, rating: 4.9, delivery: "2 days", img: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=100" },
      { name: "Studio Grade Headset", price: 9999, rating: 4.8, delivery: "3 days", img: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=100" },
      { name: "Audiophile Edition", price: 7999, rating: 4.9, delivery: "2 days", img: "https://images.unsplash.com/photo-1528148343865-51218c4a13e6?w=100" },
    ],
  };

  const handleAbandon = (reason: AbandonReason) => {
    setShowCheckout(false);
    setAbandonReason(reason);
    setTimeout(() => setShowRecommendations(true), 1000);
  };

  const reasonConfig = {
    price: { icon: TrendingDown, title: "Looking for a better deal?", subtitle: "Here are cheaper alternatives from other stores" },
    delivery: { icon: Clock, title: "Need it faster?", subtitle: "These stores can deliver sooner" },
    quality: { icon: Star, title: "Want better quality?", subtitle: "These highly-rated alternatives might be better" },
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
            <h1 className="text-3xl font-bold mb-2">Smart Abandonment AI</h1>
            <p className="text-muted-foreground">AI understands why you didn't buy and adjusts recommendations</p>
          </div>

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
                <p className="text-sm text-muted-foreground mt-1">Delivery: 5-7 days</p>
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

      {/* Checkout Modal with Abandon Options */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Complete Your Order</h2>
              <button
                onClick={() => setShowCheckout(false)}
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

              <div className="space-y-2 mb-6">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Simulate why you're abandoning:
                </p>
                <Button
                  onClick={() => handleAbandon("price")}
                  variant="outline"
                  className="w-full"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Too Expensive
                </Button>
                <Button
                  onClick={() => handleAbandon("delivery")}
                  variant="outline"
                  className="w-full"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Delivery Too Slow
                </Button>
                <Button
                  onClick={() => handleAbandon("quality")}
                  variant="outline"
                  className="w-full"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Want Better Quality
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations Modal */}
      {showRecommendations && abandonReason && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = reasonConfig[abandonReason].icon;
                    return <Icon className="w-6 h-6 text-primary" />;
                  })()}
                  <h2 className="text-xl font-bold">{reasonConfig[abandonReason].title}</h2>
                </div>
                <button
                  onClick={() => setShowRecommendations(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-muted-foreground ml-9">{reasonConfig[abandonReason].subtitle}</p>
              
              <div className="mt-3 ml-9 inline-block px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                Reason detected: {abandonReason === "price" ? "Price concern" : abandonReason === "delivery" ? "Delivery too long" : "Quality concern"}
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid gap-4">
                {recommendations[abandonReason].map((product, idx) => (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={product.img}
                      alt={product.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{product.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1 text-yellow-500 text-sm">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-semibold">{product.rating}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{product.delivery}</span>
                      </div>
                      <p className="text-xl font-bold text-primary">₹{product.price}</p>
                    </div>
                    <Button size="sm">
                      Checkout in 1 Click
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg text-sm text-center text-muted-foreground">
                Cross-network smart recommendations powered by abandonment AI
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartAbandonmentAI;
