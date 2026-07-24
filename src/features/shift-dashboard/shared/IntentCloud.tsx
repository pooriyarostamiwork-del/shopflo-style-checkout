import { intents, fa } from "../data/mockDashboard";

export const IntentCloud = () => {
  const max = Math.max(...intents.map(i => i.weight));
  return (
    <div className="flex flex-wrap gap-2">
      {intents.map(i => {
        const ratio = i.weight / max;
        const isTop = ratio >= 0.75;
        const isMid = ratio >= 0.45 && ratio < 0.75;
        return (
          <span
            key={i.label}
            className="rounded-full border transition inline-flex items-center gap-2"
            style={{
              padding: isTop ? "8px 14px" : isMid ? "6px 12px" : "5px 10px",
              fontSize: isTop ? "13.5px" : isMid ? "12.5px" : "11.5px",
              fontWeight: isTop ? 600 : 500,
              background: isTop ? "hsl(var(--sd-ink))" : "hsl(var(--sd-surface))",
              color: isTop ? "white" : "hsl(var(--sd-ink-2))",
              borderColor: isTop ? "hsl(var(--sd-ink))" : "hsl(var(--sd-stroke))",
            }}
            title={`${fa(i.weight)} گفتگو`}
          >
            {i.label}
            <span className="sd-num text-[10px]" style={{ opacity: .65 }}>{fa(i.weight)}</span>
          </span>
        );
      })}
    </div>
  );
};
