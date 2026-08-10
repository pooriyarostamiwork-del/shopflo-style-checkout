import { ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export const SectionHeader = ({ eyebrow, title, subtitle, actions }: Props) => (
  <div
    className="sd-anim-in flex items-end justify-between gap-4 mb-6 pb-5 flex-wrap border-b"
    style={{ borderColor: "hsl(var(--sd-stroke))" }}
  >
    <div className="min-w-0">
      <div className="sd-eyebrow">{eyebrow}</div>
      <h1 className="sd-headline mt-1.5">{title}</h1>
      {subtitle && <p className="sd-sublead">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

