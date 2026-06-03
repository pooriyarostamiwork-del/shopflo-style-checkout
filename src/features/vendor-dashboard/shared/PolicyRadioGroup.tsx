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
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt.key === value;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`border rounded-full px-3 py-1.5 text-xs transition-colors ${
                active
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card text-foreground"
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
