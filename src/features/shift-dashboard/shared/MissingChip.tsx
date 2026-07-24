import { ArrowLeft, Sparkles } from "lucide-react";

export const MissingChip = ({ text, cta = "ارتقا به Pro" }: { text: string; cta?: string }) => (
  <div className="sd-anim-in flex items-center justify-between gap-3 px-4 py-3 rounded-2xl"
    style={{
      background: "hsl(var(--sd-primary-soft))",
      border: "1px solid hsl(var(--sd-primary) / .25)",
    }}>
    <div className="flex items-center gap-2.5 text-[13px] min-w-0">
      <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "hsl(var(--sd-primary))", color: "white" }}>
        <Sparkles className="w-3.5 h-3.5" />
      </span>
      <span className="text-[hsl(var(--sd-ink))]">{text}</span>
    </div>
    <button className="inline-flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-full shrink-0"
      style={{ background: "hsl(var(--sd-primary))", color: "white" }}>
      {cta} <ArrowLeft className="w-3.5 h-3.5" />
    </button>
  </div>
);
