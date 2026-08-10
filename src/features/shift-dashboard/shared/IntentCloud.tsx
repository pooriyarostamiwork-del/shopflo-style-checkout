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
            className="sd-badge-group"
            data-tone={isTop ? "ink" : isMid ? "neutral" : "muted"}
            title={`${fa(i.weight)} گفتگو`}
          >
            <span className="sd-badge-dot" aria-hidden />
            <span className="sd-badge-label">{i.label}</span>
            <span className="sd-badge-trail sd-num">{fa(i.weight)}</span>
          </span>
        );
      })}
    </div>
  );
};
