import { useEffect, useState } from "react";
import { Users, TrendingUp, CreditCard, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveCheckoutPresenceProps {
  currentShoppers: number;
  recentIncrease: number;
  atPayment: number;
  interactingWithUpsells: number;
}

export const LiveCheckoutPresence = ({
  currentShoppers,
  recentIncrease,
  atPayment,
  interactingWithUpsells,
}: LiveCheckoutPresenceProps) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-cyan-accent/5 to-transparent opacity-50" />
      
      {/* Pulse effect */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-radial from-primary/20 to-transparent opacity-0 transition-opacity duration-1000",
          pulse && "opacity-100"
        )}
      />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Live Checkout Presence</h3>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>

        {/* Main counter */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <div className="text-4xl font-bold">{currentShoppers}</div>
              <p className="text-sm text-muted-foreground">shoppers in checkout now</p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[hsl(var(--success))]">
              <TrendingUp className="h-4 w-4" />
              <span className="text-lg font-semibold">+{recentIncrease}</span>
            </div>
            <p className="text-xs text-muted-foreground">in last minute</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[hsl(var(--neon-blue))]">
              <CreditCard className="h-4 w-4" />
              <span className="text-lg font-semibold">{atPayment}</span>
            </div>
            <p className="text-xs text-muted-foreground">at payment</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[hsl(var(--warning))]">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-lg font-semibold">{interactingWithUpsells}</span>
            </div>
            <p className="text-xs text-muted-foreground">with upsells</p>
          </div>
        </div>

        {/* Particle field */}
        <div className="h-12 relative">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-primary/30 animate-pulse"
              style={{
                left: `${(i * 12) + 5}%`,
                bottom: `${Math.random() * 40}%`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
