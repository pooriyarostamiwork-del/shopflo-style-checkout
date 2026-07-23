import { intents, fa } from "../data/mockDashboard";

export const IntentCloud = () => {
  const max = Math.max(...intents.map(i => i.weight));
  return (
    <div className="flex flex-wrap gap-2">
      {intents.map(i => {
        const scale = 0.55 + (i.weight / max) * 0.85;
        const opacity = 0.5 + (i.weight / max) * 0.5;
        return (
          <span
            key={i.label}
            className="rounded-full px-3 py-1.5 border sd-card-hover transition"
            style={{
              fontSize: `${12 * scale + 4}px`,
              background: "hsl(var(--sd-primary-soft))",
              color: "hsl(var(--sd-primary-ink))",
              borderColor: "hsl(var(--sd-primary) / .25)",
              opacity,
            }}
            title={`${fa(i.weight)} گفتگو`}
          >
            {i.label}
          </span>
        );
      })}
    </div>
  );
};
