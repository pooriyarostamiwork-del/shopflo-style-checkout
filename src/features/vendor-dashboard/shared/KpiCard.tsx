import { Button } from "@/components/ui/button";
import { DeltaChip } from "./DeltaChip";

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  delta?: number;
  ctaLabel?: string;
  onCtaClick?: () => void;
  animateKey?: string | number;
}

export const KpiCard = ({ label, value, sublabel, delta, ctaLabel, onCtaClick, animateKey }: KpiCardProps) => (
  <div className="bg-[hsl(var(--vd-surface))] border border-[hsl(var(--vd-stroke))] rounded-3xl p-4">
    <div className="flex items-start justify-between gap-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      {typeof delta === "number" && <DeltaChip value={delta} />}
    </div>
    <div
      key={animateKey}
      className="text-xl font-semibold text-foreground tracking-tight mt-1.5 vd-anim-in vd-num"
    >
      {value}
    </div>
    {sublabel && <div className="text-[11px] text-muted-foreground mt-1 vd-num">{sublabel}</div>}
    {ctaLabel && (
      <Button size="sm" className="w-full mt-3 rounded-full" onClick={onCtaClick}>
        {ctaLabel}
      </Button>
    )}
  </div>
);
