import { ArrowLeft, Sparkles } from "lucide-react";

export const MissingChip = ({ text, cta = "ارتقا به Pro" }: { text: string; cta?: string }) => (
  <div className="sd-card sd-anim-in p-3 flex items-center justify-between gap-3"
    style={{ background: "linear-gradient(90deg, hsl(var(--sd-primary-soft)), hsl(var(--sd-surface)))",
      borderColor: "hsl(var(--sd-primary)/.25)" }}>
    <div className="flex items-center gap-2 text-[13px]">
      <Sparkles className="w-4 h-4" style={{ color: "hsl(var(--sd-primary))" }} />
      <span className="text-[hsl(var(--sd-ink))]">{text}</span>
    </div>
    <button className="sd-btn-primary flex items-center gap-1">
      {cta} <ArrowLeft className="w-3.5 h-3.5" />
    </button>
  </div>
);
