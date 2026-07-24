interface Tab { id: string; label: string; }
export const SectionTabs = ({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (id: string) => void }) => (
  <div className="sd-tab-group mb-5">
    {tabs.map(t => (
      <button key={t.id} className={`sd-tab ${active === t.id ? "active" : ""}`} onClick={() => onChange(t.id)}>
        {t.label}
      </button>
    ))}
  </div>
);
