import { useState } from "react";
import { SectionTabs } from "../shared/SectionTabs";
import { Switch } from "../shared/Switch";
import { useDashboard } from "../context/DashboardContext";
import { themes, loadingAnimations, quickMessages as defaultQM } from "../data/mockDashboard";
import { toast } from "sonner";
import { X } from "lucide-react";

const FieldWithToggle = ({ label, value, active, onChange, onToggle, placeholder }: any) => (
  <div className="sd-card p-4">
    <div className="flex items-center justify-between mb-2">
      <label className="text-[13px] font-semibold">{label}</label>
      <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--sd-muted))]">
        <span>{active ? "فعال" : "غیرفعال"}</span>
        <Switch checked={active} onChange={onToggle} />
      </div>
    </div>
    <input className="sd-input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={!active} />
  </div>
);

export const VisualCustomization = () => {
  const [tab, setTab] = useState("branding");
  const { content, updateContent } = useDashboard();
  const [qm, setQM] = useState<string[]>(defaultQM);
  const [newQM, setNewQM] = useState("");

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold">شخصی‌سازی بصری</h1>
        <p className="text-sm text-[hsl(var(--sd-muted))]">برندینگ، پیام‌ها، تم و انیمیشن بارگذاری</p>
      </div>

      <SectionTabs
        tabs={[
          { id: "branding", label: "برند" },
          { id: "messages", label: "پیام‌ها" },
          { id: "theme", label: "تم" },
          { id: "loading", label: "بارگذاری" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "branding" && (
        <div className="space-y-4">
          <div className="sd-card p-4">
            <div className="text-[13px] font-semibold mb-2">لوگو</div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{ background: "hsl(var(--sd-primary-soft))", color: "hsl(var(--sd-primary))" }}>
                پ
              </div>
              <button className="sd-btn-ghost" onClick={() => toast("آپلود لوگو (نمایشی)")}>آپلود لوگو</button>
            </div>
          </div>

          <div className="sd-card p-4">
            <div className="text-[13px] font-semibold mb-2">محتوای فوتر</div>
            <input className="sd-input" value={content.footerContents} onChange={e => updateContent({ footerContents: e.target.value })} />
          </div>
        </div>
      )}

      {tab === "messages" && (
        <div className="space-y-3">
          <FieldWithToggle label="شعار صفحه اصلی" value={content.homeTagline} active={content.homeTaglineActive}
            onChange={(v: string) => updateContent({ homeTagline: v })} onToggle={() => updateContent({ homeTaglineActive: !content.homeTaglineActive })} />
          <FieldWithToggle label="شعار حالت گفتگو" value={content.chatTagline} active={content.chatTaglineActive}
            onChange={(v: string) => updateContent({ chatTagline: v })} onToggle={() => updateContent({ chatTaglineActive: !content.chatTaglineActive })} />
          <FieldWithToggle label="پیام سربرگ گفتگو" value={content.headerMessage} active={content.headerMessageActive}
            onChange={(v: string) => updateContent({ headerMessage: v })} onToggle={() => updateContent({ headerMessageActive: !content.headerMessageActive })} />

          <div className="sd-card p-4">
            <label className="text-[13px] font-semibold">پیام خوش‌آمد اولین گفتگو</label>
            <textarea rows={3} className="sd-input mt-2" value={content.welcomeMessage} onChange={e => updateContent({ welcomeMessage: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="sd-card p-4">
              <label className="text-[13px] font-semibold">پلیس‌هولدر چت‌باکس صفحه اصلی</label>
              <input className="sd-input mt-2" value={content.homePlaceholder} onChange={e => updateContent({ homePlaceholder: e.target.value })} />
            </div>
            <div className="sd-card p-4">
              <label className="text-[13px] font-semibold">پلیس‌هولدر چت‌باکس حالت گفتگو</label>
              <input className="sd-input mt-2" value={content.chatPlaceholder} onChange={e => updateContent({ chatPlaceholder: e.target.value })} />
            </div>
          </div>

          <div className="sd-card p-4">
            <div className="text-[13px] font-semibold mb-2">پیام‌های سریع (زیر چت‌باکس صفحه اصلی)</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {qm.map(m => (
                <span key={m} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border" style={{ borderColor: "hsl(var(--sd-stroke))" }}>
                  {m}
                  <button onClick={() => setQM(qm.filter(x => x !== m))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="sd-input" value={newQM} onChange={e => setNewQM(e.target.value)} placeholder="پیام سریع جدید…" />
              <button className="sd-btn-primary shrink-0" onClick={() => { if (newQM.trim()) { setQM([...qm, newQM.trim()]); setNewQM(""); } }}>افزودن</button>
            </div>
          </div>
        </div>
      )}

      {tab === "theme" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {themes.map(t => (
            <button key={t.id} onClick={() => updateContent({ themeId: t.id })}
              className={`sd-card sd-card-hover p-4 text-right`}
              style={{ borderColor: content.themeId === t.id ? "hsl(var(--sd-primary))" : undefined,
                background: content.themeId === t.id ? "hsl(var(--sd-primary-soft))" : undefined }}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-[13px]">{t.name}</div>
                {content.themeId === t.id && <span className="sd-chip sd-chip-up">انتخاب‌شده</span>}
              </div>
              <div className="flex gap-1.5">
                {t.colors.map(c => <span key={c} className="w-8 h-8 rounded-lg border" style={{ background: c, borderColor: "hsl(var(--sd-stroke))" }} />)}
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === "loading" && (
        <div className="space-y-4">
          <div className="sd-card p-4">
            <label className="text-[13px] font-semibold">متن پلیس‌هولدر هنگام بارگذاری</label>
            <input className="sd-input mt-2" value={content.loadingText} onChange={e => updateContent({ loadingText: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {loadingAnimations.map(a => (
              <button key={a.id} onClick={() => updateContent({ loadingId: a.id })}
                className="sd-card sd-card-hover p-4 flex flex-col items-center gap-3"
                style={{ borderColor: content.loadingId === a.id ? "hsl(var(--sd-primary))" : undefined,
                  background: content.loadingId === a.id ? "hsl(var(--sd-primary-soft))" : undefined }}>
                <div className="h-10 flex items-center gap-1">
                  {a.id === "dots" && [0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full sd-breathe" style={{ background: "hsl(var(--sd-primary))", animationDelay: `${i*0.15}s` }} />)}
                  {a.id === "wave" && [0,1,2,3].map(i => <span key={i} className="w-1 rounded-full sd-breathe" style={{ height: 20, background: "hsl(var(--sd-primary))", animationDelay: `${i*0.1}s` }} />)}
                  {a.id === "paws" && "🐾".repeat(3).split("").map((p,i) => <span key={i} className="sd-breathe" style={{ animationDelay: `${i*0.2}s` }}>🐾</span>)}
                  {a.id === "bar" && <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--sd-surface-2))" }}>
                    <div className="h-full sd-breathe" style={{ width: "60%", background: "hsl(var(--sd-primary))" }} />
                  </div>}
                </div>
                <div className="text-[12px] font-semibold">{a.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-start">
        <button className="sd-btn-primary" onClick={() => toast.success("تغییرات ذخیره شد")}>ذخیره تغییرات</button>
      </div>
    </div>
  );
};
