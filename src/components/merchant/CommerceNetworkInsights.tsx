import { TrendingUp, Users, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  type: 'benchmark' | 'related' | 'trending';
  text: string;
  icon: string;
}

interface CommerceNetworkInsightsProps {
  insights: Insight[];
}

export const CommerceNetworkInsights = ({ insights }: CommerceNetworkInsightsProps) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'trendingUp':
        return <TrendingUp className="h-5 w-5" />;
      case 'users':
        return <Users className="h-5 w-5" />;
      case 'star':
        return <Star className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'benchmark':
        return 'text-[hsl(var(--success))]';
      case 'related':
        return 'text-[hsl(var(--neon-blue))]';
      case 'trending':
        return 'text-[hsl(var(--warning))]';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-6 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
      {/* Subtle animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Commerce Network Insights</h3>
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>

        <div className="space-y-4">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border bg-card/50",
                "transition-all duration-300 hover:bg-card hover:border-primary/30"
              )}
            >
              <div className={cn("mt-0.5", getIconColor(insight.type))}>
                {getIcon(insight.icon)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm leading-relaxed">{insight.text}</p>
                {insight.type === 'benchmark' && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[hsl(var(--success))] rounded-full transition-all duration-500"
                        style={{ width: '73%' }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[hsl(var(--success))]">+19%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Network visualization hint */}
        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Powered by Flowcart Commerce Network Intelligence
          </p>
        </div>
      </div>
    </div>
  );
};
