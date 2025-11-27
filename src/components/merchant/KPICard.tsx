import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  sparkline?: number[];
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const KPICard = ({
  title,
  value,
  change,
  trend,
  sparkline,
  subtitle,
  icon,
  className,
}: KPICardProps) => {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-[hsl(var(--success))]';
    if (trend === 'down') return 'text-[hsl(var(--danger))]';
    return 'text-muted-foreground';
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-6",
        "transition-all duration-300 hover:shadow-lg hover:shadow-primary/10",
        "animate-fade-in",
        className
      )}
    >
      {/* Pulse animation on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && <div className="text-primary">{icon}</div>}
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          </div>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
              {trend === 'up' && <ArrowUp className="h-3 w-3" />}
              {trend === 'down' && <ArrowDown className="h-3 w-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-3xl font-bold">{value}</div>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>

        {sparkline && sparkline.length > 0 && (
          <div className="mt-4 h-12 flex items-end gap-1">
            {sparkline.map((point, idx) => {
              const maxPoint = Math.max(...sparkline);
              const height = (point / maxPoint) * 100;
              return (
                <div
                  key={idx}
                  className="flex-1 bg-primary/20 rounded-t transition-all duration-300 hover:bg-primary/40"
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
