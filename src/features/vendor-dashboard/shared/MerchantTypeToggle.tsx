export type MerchantType = "individual" | "company";

interface Props {
  value: MerchantType;
  onChange: (v: MerchantType) => void;
}

export const MerchantTypeToggle = ({ value, onChange }: Props) => {
  const options: { key: MerchantType; label: string }[] = [
    { key: "individual", label: "حقیقی" },
    { key: "company", label: "حقوقی" },
  ];
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">نوع همکاری</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const active = opt.key === value;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`border rounded-xl py-2.5 text-sm transition-colors ${
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
};
