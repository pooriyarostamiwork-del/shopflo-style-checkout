import { Plan } from "../data/mockDashboard";

export const PlanTag = ({ plan, size = "md" }: { plan: Plan; size?: "sm" | "md" }) => {
  const isPro = plan === "pro";
  const isSm = size === "sm";

  const dot = (
    <span
      className="inline-block rounded-full"
      style={{
        width: isSm ? 5 : 6,
        height: isSm ? 5 : 6,
        background: isPro ? "hsl(var(--sd-primary))" : "hsl(var(--sd-ink-2))",
        boxShadow: isPro ? "0 0 0 3px hsl(var(--sd-primary) / .18)" : "none",
      }}
    />
  );

  return (
    <div
      className={`inline-flex items-center gap-2 whitespace-nowrap font-semibold ${
        isSm ? "px-2 py-[3px] text-[10.5px]" : "px-2.5 py-[5px] text-[11.5px]"
      }`}
      style={{
        background: "hsl(var(--sd-surface))",
        color: "hsl(var(--sd-ink))",
        border: "1px solid hsl(var(--sd-stroke-strong))",
        borderRadius: 8,
        letterSpacing: "0.02em",
      }}
    >
      {dot}
      <span className="tracking-[0.06em] uppercase text-[10.5px]" style={{ color: "hsl(var(--sd-muted))" }}>
        Shift
      </span>
      <span className="w-px h-3" style={{ background: "hsl(var(--sd-stroke))" }} />
      <span>{isPro ? "Pro" : "Lite"}</span>
    </div>
  );
};
