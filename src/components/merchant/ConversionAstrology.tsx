import { TrendingUp, Zap, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversionAstrologyProps {
  predictedOrders: number;
  predictedOrdersChange: number;
  predictedRevenue: number;
  predictedUpsellIncrease: [number, number];
}

export const ConversionAstrology = ({
  predictedOrders,
  predictedOrdersChange,
  predictedRevenue,
  predictedUpsellIncrease,
}: ConversionAstrologyProps) => {
  const formatCurrency = (value: number) => {
    return `₹${(value / 100000).toFixed(1)}M`;
  };

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-accent/10 animate-pulse" />
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Conversion Astrology</h3>
          <Zap className="h-5 w-5 text-[hsl(var(--neon-blue))]" />
        </div>

        <div className="space-y-4">
          {/* Predicted orders */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <TrendingUp className="h-5 w-5 text-[hsl(var(--success))]" />
              <span className="text-3xl font-bold">{predictedOrders}</span>
              <span className="text-sm text-muted-foreground">orders</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Trending toward{" "}
              <span className="text-[hsl(var(--success))] font-medium">
                +{predictedOrdersChange}%
              </span>{" "}
              by end of day
            </p>
          </div>

          {/* Predicted revenue */}
          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex items-baseline gap-2">
              <DollarSign className="h-5 w-5 text-[hsl(var(--neon-blue))]" />
              <span className="text-2xl font-bold">{formatCurrency(predictedRevenue)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Predicted revenue by midnight
            </p>
          </div>

          {/* Upsell prediction */}
          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex items-baseline gap-2">
              <div className="text-lg font-semibold text-[hsl(var(--warning))]">
                +{predictedUpsellIncrease[0]}–{predictedUpsellIncrease[1]}%
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Upsell acceptance predicted increase
            </p>
          </div>
        </div>

        {/* Glowing dot indicator */}
        <div className="pt-4 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[hsl(var(--neon-blue))]" style={{ boxShadow: '0 0 20px hsl(var(--neon-blue))' }} />
          <span className="text-xs text-muted-foreground">AI-powered forecast updates hourly</span>
        </div>
      </div>
    </div>
  );
};
