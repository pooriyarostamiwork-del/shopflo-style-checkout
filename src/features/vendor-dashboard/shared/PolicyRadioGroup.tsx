interface Option<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}

export function PolicyRadioGroup<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt.key === value;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`rounded-full px-4 py-2 text-xs transition-all border ${
                active
                  ? "border-[hsl(var(--vd-accent))] bg-[hsl(var(--vd-accent-soft))] text-[hsl(var(--vd-accent))] font-medium"
                  : "border-[hsl(var(--vd-stroke))] bg-[hsl(var(--vd-surface))] text-foreground"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
