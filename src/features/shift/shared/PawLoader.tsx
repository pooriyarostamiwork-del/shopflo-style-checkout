/**
 * Walking paw prints loader for the petplayground store.
 * CSS-only, no extra deps.
 */
export const PawLoader = ({ label = "در حال جستجو…" }: { label?: string }) => {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-6"
      dir="rtl"
      role="status"
      aria-label={label}
    >
      <style>{`
        @keyframes paw-fade {
          0%, 100% { opacity: 0; transform: translateY(2px) rotate(var(--r, 0deg)); }
          30%, 70% { opacity: 1; transform: translateY(0) rotate(var(--r, 0deg)); }
        }
        .paw-step {
          font-size: 1.25rem;
          line-height: 1;
          animation: paw-fade 1.4s ease-in-out infinite;
          color: hsl(var(--primary));
        }
      `}</style>
      <div className="flex items-end gap-2">
        <span className="paw-step" style={{ animationDelay: "0s", ["--r" as any]: "-12deg" }}>🐾</span>
        <span className="paw-step" style={{ animationDelay: "0.2s", ["--r" as any]: "8deg" }}>🐾</span>
        <span className="paw-step" style={{ animationDelay: "0.4s", ["--r" as any]: "-6deg" }}>🐾</span>
        <span className="paw-step" style={{ animationDelay: "0.6s", ["--r" as any]: "10deg" }}>🐾</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
};
