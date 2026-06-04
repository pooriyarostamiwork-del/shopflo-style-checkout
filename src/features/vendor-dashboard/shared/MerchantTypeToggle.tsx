import { User, Building2 } from "lucide-react";

export type MerchantType = "individual" | "company";

interface Props {
  value: MerchantType;
  onChange: (v: MerchantType) => void;
}

export const MerchantTypeToggle = ({ value, onChange }: Props) => {
  const options: { key: MerchantType; label: string; Icon: typeof User }[] = [
    { key: "individual", label: "حقیقی", Icon: User },
    { key: "company", label: "حقوقی", Icon: Building2 },
  ];
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">نوع همکاری</label>
      <div className="relative grid grid-cols-2 bg-[hsl(var(--vd-surface-2))] border border-[hsl(var(--vd-stroke))] rounded-full p-1">
        <div
          className="absolute top-1 bottom-1 rounded-full bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] transition-all duration-300"
          style={{
            width: "calc(50% - 0.25rem)",
            right: value === "individual" ? "0.25rem" : "calc(50%)",
          }}
        />
        {options.map(({ key, label, Icon }) => {
          const active = key === value;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`relative z-10 flex items-center justify-center gap-2 py-2 text-sm rounded-full transition-colors ${
                active ? "text-[hsl(var(--vd-accent))] font-medium" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
