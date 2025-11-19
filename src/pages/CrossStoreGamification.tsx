import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Trophy, Zap, Wallet, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const CrossStoreGamification = () => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [points, setPoints] = useState(127);
  const [level, setLevel] = useState(3);
  const [cashback, setCashback] = useState(450);
  const [showRetarget, setShowRetarget] = useState(false);

  const earnablePoints = 23;
  const nextLevelPoints = 200;
  const progressPercent = (points / nextLevelPoints) * 100;

  const handleAbandon = () => {
    setShowCheckout(false);
    setTimeout(() => setShowRetarget(true), 1000);
  };

  const handleComplete = () => {
    setPoints(points + earnablePoints);
    setCashback(cashback + 200);
    setShowRetarget(false);
    setShowCheckout(false);
    if (points + earnablePoints >= nextLevelPoints) {
      setLevel(level + 1);
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
            <h1 className="text-3xl font-bold mb-2">Cross-Store Gamification & Loyalty</h1>
            <p className="text-muted-foreground">Earn points and cashback across all stores</p>
          </div>

          {/* User Stats Dashboard */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-6 border border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-6 h-6 text-primary" />
                <span className="text-sm text-muted-foreground">Level</span>
              </div>
              <p className="text-3xl font-bold text-primary">{level}</p>
              <p className="text-xs text-muted-foreground mt-1">ShopFlo Elite</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-xl p-6 border border-amber-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-6 h-6 text-amber-600" />
                <span className="text-sm text-muted-foreground">Points</span>
              </div>
              <p className="text-3xl font-bold text-amber-600">{points}</p>
              <div className="mt-2">
                <Progress value={progressPercent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{nextLevelPoints - points} to Level {level + 1}</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-xl p-6 border border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="w-6 h-6 text-green-600" />
                <span className="text-sm text-muted-foreground">Cashback</span>
              </div>
              <p className="text-3xl font-bold text-green-600">₹{cashback}</p>
              <p className="text-xs text-muted-foreground mt-1">Universal wallet</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-lg p-8">
            <div className="flex items-center gap-6 mb-6">
              <img
                src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200"
                alt="Smart Watch"
                className="w-32 h-32 rounded-xl object-cover bg-muted"
              />
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-1">Premium Smart Watch</h3>
                <p className="text-muted-foreground mb-2">AMOLED Display, 7-Day Battery</p>
                <p className="text-2xl font-bold text-primary">₹12,999</p>
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

      {/* Checkout Modal with Points Preview */}
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
              {/* Points Earning Banner */}
              <div className="bg-gradient-to-r from-amber-500/20 to-primary/20 border border-primary/20 rounded-xl p-4 mb-6 animate-pulse-glow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold">Earn {earnablePoints} points</span>
                  </div>
                  <span className="text-sm text-muted-foreground">with this purchase</span>
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                <img
                  src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100"
                  alt="Smart Watch"
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold">Premium Smart Watch</h3>
                  <p className="text-2xl font-bold text-primary mt-1">₹12,999</p>
                </div>
              </div>

              <Button onClick={handleAbandon} className="w-full mb-3" size="lg">
                Proceed to Payment
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Points work across all partner stores
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Retargeting with Loyalty Benefits */}
      {showRetarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Welcome Back! 👋</h2>
              <button
                onClick={() => setShowRetarget(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Loyalty Status */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">You still have {points} points</p>
                    <p className="text-sm text-muted-foreground">Level {level} Elite Member</p>
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <p className="text-sm font-semibold text-green-600">
                    Complete checkout and unlock ₹200 universal cashback!
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                <img
                  src="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=100"
                  alt="Smart Watch"
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Premium Smart Watch</h3>
                  <p className="text-2xl font-bold text-primary">₹12,999</p>
                  <div className="flex gap-2 mt-2">
                    <div className="inline-block px-2 py-1 bg-amber-500/10 text-amber-600 text-xs rounded">
                      +{earnablePoints} pts
                    </div>
                    <div className="inline-block px-2 py-1 bg-green-500/10 text-green-600 text-xs rounded">
                      +₹200 cashback
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleComplete} className="w-full mb-3" size="lg">
                Complete Order & Earn Rewards
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Every checkout, every store — your wallet grows
                </p>
              </div>

              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-center space-y-1">
                <p className="text-muted-foreground">Network effects increase exponentially</p>
                <p className="text-muted-foreground">Merchants plug into collective conversion lift</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossStoreGamification;
