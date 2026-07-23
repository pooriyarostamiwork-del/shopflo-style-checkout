interface Tab { id: string; label: string; }
export const SectionTabs = ({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (id: string) => void }) => (
  <div className="inline-flex gap-1 p-1 rounded-xl mb-4" style={{ background: "hsl(var(--sd-surface-2))", border: "1px solid hsl(var(--sd-stroke))" }}>
    {tabs.map(t => (
      <button key={t.id} className={`sd-tab ${active === t.id ? "active" : ""}`} onClick={() => onChange(t.id)}>
        {t.label}
      </button>
    ))}
  </div>
);
