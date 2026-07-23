import { Plan } from "../data/mockDashboard";
import { Sparkles, Zap } from "lucide-react";

export const PlanTag = ({ plan }: { plan: Plan }) => {
  const isPro = plan === "pro";
  return (
    <div
      className="sd-pulse inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
      style={{
        background: isPro ? "hsl(var(--sd-primary))" : "hsl(var(--sd-surface))",
        color: isPro ? "white" : "hsl(var(--sd-ink))",
        border: isPro ? "none" : "1px solid hsl(var(--sd-stroke))",
      }}
    >
      {isPro ? <Sparkles className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
      {isPro ? "Shift Pro" : "Shift Lite"}
    </div>
  );
};
