interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionTitle = ({ children, className = "" }: SectionTitleProps) => (
  <h2 className={`text-sm font-semibold text-foreground mt-2 mb-2 ${className}`}>{children}</h2>
);
