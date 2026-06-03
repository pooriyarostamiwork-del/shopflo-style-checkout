export type Timeframe = "day" | "week" | "month";

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (v: Timeframe) => void;
}

const options: { key: Timeframe; label: string }[] = [
  { key: "day", label: "۱ روز" },
  { key: "week", label: "۱ هفته" },
  { key: "month", label: "۱ ماه" },
];

export const TimeframeSelector = ({ value, onChange }: TimeframeSelectorProps) => (
  <div className="inline-flex border border-border rounded-full p-1 bg-card">
    {options.map((opt) => {
      const active = opt.key === value;
      return (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);
