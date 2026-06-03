import { Button } from "@/components/ui/button";

interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export const KpiCard = ({ label, value, sublabel, ctaLabel, onCtaClick }: KpiCardProps) => (
  <div className="bg-card border border-border rounded-2xl p-4">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className="text-lg font-semibold text-foreground" style={{ unicodeBidi: "isolate" }}>
      {value}
    </div>
    {sublabel && (
      <div className="text-xs text-muted-foreground mt-1" style={{ unicodeBidi: "isolate" }}>
        {sublabel}
      </div>
    )}
    {ctaLabel && (
      <Button size="sm" className="w-full mt-3" onClick={onCtaClick}>
        {ctaLabel}
      </Button>
    )}
  </div>
);
