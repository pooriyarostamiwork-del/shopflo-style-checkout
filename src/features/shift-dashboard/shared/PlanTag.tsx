import { Plan } from "../data/mockDashboard";
import { Sparkles, Zap } from "lucide-react";

export const PlanTag = ({ plan, size = "md" }: { plan: Plan; size?: "sm" | "md" }) => {
  const isPro = plan === "pro";
  const isSm = size === "sm";
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${
        isSm ? "px-2 py-[3px] text-[10.5px]" : "px-2.5 py-1 text-[11px]"
      }`}
      style={{
        background: isPro
          ? "linear-gradient(135deg, hsl(var(--sd-ink)) 0%, hsl(var(--sd-ink-2)) 100%)"
          : "hsl(var(--sd-surface))",
        color: isPro ? "white" : "hsl(var(--sd-ink))",
        border: isPro
          ? "1px solid hsl(var(--sd-ink))"
          : "1px solid hsl(var(--sd-stroke-strong))",
        letterSpacing: "0.01em",
      }}
    >
      {isPro ? (
        <Sparkles className={isSm ? "w-2.5 h-2.5" : "w-3 h-3"} />
      ) : (
        <Zap className={isSm ? "w-2.5 h-2.5" : "w-3 h-3"} />
      )}
      {isPro ? "Shift Pro" : "Shift Lite"}
    </div>
  );
};
