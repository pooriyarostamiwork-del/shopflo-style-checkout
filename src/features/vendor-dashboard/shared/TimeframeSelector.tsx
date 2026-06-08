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

export const TimeframeSelector = ({ value, onChange }: Props) => (
  <div className="inline-flex gap-1 border border-[hsl(var(--vd-stroke))] rounded-full p-1 bg-[hsl(var(--vd-surface))]">
    {options.map((opt) => {
      const active = opt.key === value;
      return (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            active
              ? "bg-[hsl(var(--vd-accent))] text-white"
              : "text-muted-foreground hover:bg-[hsl(var(--vd-surface-2))]"
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);
