interface SectionTitleProps {
  children: React.ReactNode;
  eyebrow?: string;
  className?: string;
}

export const SectionTitle = ({ children, eyebrow, className = "" }: SectionTitleProps) => (
  <div className={`mb-3 ${className}`}>
    {eyebrow && (
      <div className="text-[11px] tracking-wide text-muted-foreground mb-1">{eyebrow}</div>
    )}
    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
      <span className="w-1 h-4 rounded-full bg-[hsl(var(--vd-accent))]" />
      {children}
    </h2>
  </div>
);
