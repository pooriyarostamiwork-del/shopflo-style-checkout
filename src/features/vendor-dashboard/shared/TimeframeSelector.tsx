export type Timeframe = "day" | "week" | "month";

interface Props {
  value: Timeframe;
  onChange: (v: Timeframe) => void;
}

const options: { key: Timeframe; label: string }[] = [
  { key: "day", label: "۱ روز" },
  { key: "week", label: "۱ هفته" },
  { key: "month", label: "۱ ماه" },
];

export const TimeframeSelector = ({ value, onChange }: Props) => {
  const idx = options.findIndex((o) => o.key === value);
  return (
    <div className="relative inline-flex border border-[hsl(var(--vd-stroke))] rounded-full p-1 bg-[hsl(var(--vd-surface))]">
      <div
        className="absolute top-1 bottom-1 rounded-full bg-[hsl(var(--vd-accent))] transition-all duration-300 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          right: `calc(${idx} * ((100% - 0.5rem) / ${options.length}) + 0.25rem)`,
        }}
      />
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`relative z-10 px-3 py-1 text-xs rounded-full transition-colors ${
              active ? "text-white" : "text-muted-foreground"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
