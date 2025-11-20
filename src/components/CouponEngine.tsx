import { useState, useEffect } from "react";
import { Gift, TrendingUp, Truck } from "lucide-react";
import { Progress } from "./ui/progress";
import { CouponTier } from "@/types/checkout";

interface CouponEngineProps {
  currentTotal: number;
  tiers: CouponTier[];
}

export const CouponEngine = ({ currentTotal, tiers }: CouponEngineProps) => {
  const [animatedTotal, setAnimatedTotal] = useState(currentTotal);

  useEffect(() => {
    const duration = 300;
    const steps = 20;
    const increment = (currentTotal - animatedTotal) / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setAnimatedTotal(currentTotal);
        clearInterval(timer);
      } else {
        setAnimatedTotal(prev => prev + increment);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [currentTotal]);

  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);
  
  const activeIndex = sortedTiers.findIndex(tier => animatedTotal < tier.threshold);
  const currentTierIndex = activeIndex === -1 ? sortedTiers.length - 1 : Math.max(0, activeIndex - 1);
  const nextTier = activeIndex === -1 ? null : sortedTiers[activeIndex];
  const currentTier = sortedTiers[currentTierIndex];

  const progress = nextTier 
    ? ((animatedTotal - (currentTier?.threshold || 0)) / (nextTier.threshold - (currentTier?.threshold || 0))) * 100
    : 100;

  const getIcon = (type: string) => {
    switch (type) {
      case "shipping": return <Truck className="w-4 h-4" />;
      case "gift": return <Gift className="w-4 h-4" />;
      case "discount": return <TrendingUp className="w-4 h-4" />;
      default: return null;
    }
  };

  const getProgressColor = () => {
    if (progress < 40) return "bg-red-500";
    if (progress < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          💰 Unlock More Savings
        </h3>
        {nextTier && (
          <span className="text-xs font-medium text-primary">
            ₹{Math.round(nextTier.threshold - animatedTotal)} more to unlock
          </span>
        )}
      </div>

      {nextTier && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress to next reward</span>
            <span className="font-semibold text-foreground">{Math.round(progress)}%</span>
          </div>
          
          <div className="relative">
            <Progress value={progress} className="h-2" />
            <div 
              className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-sm font-medium text-foreground">
            Add ₹{Math.round(nextTier.threshold - animatedTotal)} more to unlock: <span className="text-primary">{nextTier.reward}</span>
          </p>
        </div>
      )}

      <div className="space-y-2">
        {sortedTiers.map((tier, index) => {
          const isActive = index <= currentTierIndex;
          const isCurrent = index === currentTierIndex && nextTier;
          
          return (
            <div
              key={index}
              className={`
                flex items-center gap-3 p-2 rounded-lg transition-all duration-300
                ${isActive ? 'bg-primary/10 border-2 border-primary' : 'bg-background/50 border border-border'}
                ${isCurrent ? 'animate-pulse-glow' : ''}
              `}
            >
              <div className={`
                p-2 rounded-lg
                ${isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}
              `}>
                {getIcon(tier.type)}
              </div>
              
              <div className="flex-1">
                <p className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {tier.reward}
                </p>
                <p className="text-xs text-muted-foreground">
                  Spend ₹{tier.threshold}
                  {tier.value && tier.type === "discount" && ` • Save ${tier.value}%`}
                </p>
              </div>

              {isActive && (
                <div className="text-green-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!nextTier && (
        <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-semibold text-green-700">
            🎉 All rewards unlocked! You're getting the best deal.
          </p>
        </div>
      )}
    </div>
  );
};
