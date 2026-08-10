import { useState } from "react";
import { SectionTabs } from "../shared/SectionTabs";
import { SectionHeader } from "../shared/SectionHeader";
import { Switch } from "../shared/Switch";
import { useDashboard } from "../context/DashboardContext";
import { themes, loadingAnimations, quickMessages as defaultQM } from "../data/mockDashboard";
import { toast } from "sonner";
import { X, Check, Upload, Palette, Type, MessageSquare, Loader2, Sparkles } from "lucide-react";

/* ---------- small building blocks ---------- */

const Block = ({
  icon, title, hint, children, className = "",
}: { icon?: any; title: string; hint?: string; children: any; className?: string }) => (
  <section className={`sd-card p-5 ${className}`}>
    <header className="flex items-start gap-2.5 mb-4">
      {icon && (
        <span
          className="w-8 h-8 rounded-xl inline-flex items-center justify-center shrink-0"
          style={{ background: "hsl(var(--sd-surface-2))", color: "hsl(var(--sd-ink-2))" }}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <h3 className="text-[13.5px] font-semibold leading-tight">{title}</h3>
        {hint && <p className="text-[11.5px] text-[hsl(var(--sd-muted))] mt-1">{hint}</p>}
      </div>
    </header>
    {children}
  </section>
);

const Field = ({ label, children }: { label: string; children: any }) => (
  <div>
    <label className="block text-[11.5px] text-[hsl(var(--sd-muted))] mb-1.5">{label}</label>
    {children}
  </div>
);

const FieldWithToggle = ({ label, value, active, onChange, onToggle, placeholder }: any) => (
  <div
    className="rounded-xl border p-3.5 transition-colors"
    style={{
      borderColor: active ? "hsl(var(--sd-stroke-strong))" : "hsl(var(--sd-stroke))",
      background: active ? "hsl(var(--sd-surface))" : "hsl(var(--sd-surface-2) / .5)",
    }}
  >
    <div className="flex items-center justify-between gap-3 mb-2">
      <span className="text-[12.5px] font-medium">{label}</span>
      <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--sd-muted))] shrink-0">
        <span>{active ? "فعال" : "غیرفعال"}</span>
        <Switch checked={active} onChange={onToggle} />
      </div>
    </div>
    <input
      className="sd-input"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={!active}
    />
  </div>
);

const LoadingPreview = ({ id }: { id: string }) => (
  <div className="h-9 flex items-center justify-center gap-1">
    {id === "dots" && [0, 1, 2].map(i => (
      <span key={i} className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(var(--sd-primary))", animationDelay: `${i * 0.15}s` }} />
    ))}
    {id === "wave" && [0, 1, 2, 3].map(i => (
      <span key={i} className="w-1 rounded-full animate-pulse" style={{ height: 20, background: "hsl(var(--sd-primary))", animationDelay: `${i * 0.1}s` }} />
    ))}
    {id === "paws" && [0, 1, 2].map(i => (
      <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>🐾</span>
    ))}
    {id === "bar" && (
      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--sd-surface-2))" }}>
        <div className="h-full animate-pulse" style={{ width: "60%", background: "hsl(var(--sd-primary))" }} />
      </div>
    )}
  </div>
);

/* ---------- section ---------- */

export const VisualCustomization = () => {
  const [tab, setTab] = useState("identity");
  const { content, updateContent } = useDashboard();
  const [qm, setQM] = useState<string[]>(defaultQM);
  const [newQM, setNewQM] = useState("");

  const activeTheme = themes.find(t => t.id === content.themeId) ?? themes[0];

  return (
    <div>
      <SectionHeader
        eyebrow="شخصی‌سازی بصری"
        title="ظاهر و صدای فروشگاه"
        subtitle="هویت بصری و متن‌های گفتگو را از دو جای مشخص مدیریت کن"
      />

      <SectionTabs
        tabs={[
          { id: "identity", label: "برند و تم" },
          { id: "voice", label: "پیام‌ها و بارگذاری" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ---------------- BRAND + THEME ---------------- */}
      {tab === "identity" && (
        <div className="space-y-4 sd-anim-in">
          {/* live preview strip */}
          <div className="sd-card p-4 flex items-center gap-3.5 flex-wrap">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 border"
              style={{ background: "hsl(var(--sd-surface-2))", borderColor: "hsl(var(--sd-stroke))" }}
            >
              پ
            </div>
            <div className="min-w-0 flex-1">
              <div className="sd-eyebrow">پیش‌نمایش هویت</div>
              <div className="text-[14.5px] font-semibold mt-1 truncate">{content.agentName}</div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-[11.5px] text-[hsl(var(--sd-muted))]">تم {activeTheme?.name}</span>
              <span className="flex gap-1">
                {activeTheme?.colors.map(c => (
                  <span key={c} className="w-5 h-5 rounded-full border" style={{ background: c, borderColor: "hsl(var(--sd-stroke-strong))" }} />
                ))}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Block icon={<Type className="w-4 h-4" />} title="برند" hint="لوگو و متن فوتر فروشگاه">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold border shrink-0"
                    style={{ background: "hsl(var(--sd-surface-2))", borderColor: "hsl(var(--sd-stroke))" }}
                  >
                    پ
                  </div>
                  <button className="sd-btn-ghost inline-flex items-center gap-2" onClick={() => toast("آپلود لوگو (نمایشی)")}>
                    <Upload className="w-3.5 h-3.5" />
                    آپلود لوگو
                  </button>
                </div>
                <Field label="محتوای فوتر">
                  <input className="sd-input" value={content.footerContents} onChange={e => updateContent({ footerContents: e.target.value })} />
                </Field>
              </div>
            </Block>

            <Block icon={<Palette className="w-4 h-4" />} title="تم رنگی" hint="پالت فروشگاه در تجربه گفتگو">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {themes.map(t => {
                  const active = content.themeId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => updateContent({ themeId: t.id })}
                      className="rounded-xl border p-3.5 text-right transition-colors"
                      style={{
                        borderColor: active ? "hsl(var(--sd-ink))" : "hsl(var(--sd-stroke))",
                        background: "hsl(var(--sd-surface))",
                        boxShadow: active ? "inset 0 0 0 1px hsl(var(--sd-ink))" : "none",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[12.5px] font-semibold truncate">{t.name}</span>
                        {active && (
                          <span className="w-[18px] h-[18px] rounded-full inline-flex items-center justify-center shrink-0" style={{ background: "hsl(var(--sd-ink))" }}>
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {t.colors.map(c => (
                          <span key={c} className="flex-1 h-7 rounded-lg border" style={{ background: c, borderColor: "hsl(var(--sd-stroke))" }} />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Block>
          </div>
        </div>
      )}

      {/* ---------------- MESSAGES + LOADING ---------------- */}
      {tab === "voice" && (
        <div className="space-y-4 sd-anim-in">
          <Block icon={<MessageSquare className="w-4 h-4" />} title="شعارها و سربرگ" hint="هر مورد را جداگانه فعال یا غیرفعال کن">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
              <FieldWithToggle
                label="شعار صفحه اصلی" value={content.homeTagline} active={content.homeTaglineActive}
                onChange={(v: string) => updateContent({ homeTagline: v })}
                onToggle={() => updateContent({ homeTaglineActive: !content.homeTaglineActive })}
              />
              <FieldWithToggle
                label="شعار حالت گفتگو" value={content.chatTagline} active={content.chatTaglineActive}
                onChange={(v: string) => updateContent({ chatTagline: v })}
                onToggle={() => updateContent({ chatTaglineActive: !content.chatTaglineActive })}
              />
              <FieldWithToggle
                label="پیام سربرگ گفتگو" value={content.headerMessage} active={content.headerMessageActive}
                onChange={(v: string) => updateContent({ headerMessage: v })}
                onToggle={() => updateContent({ headerMessageActive: !content.headerMessageActive })}
              />
            </div>
          </Block>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Block icon={<Sparkles className="w-4 h-4" />} title="خوش‌آمد و پلیس‌هولدرها" hint="اولین چیزی که مشتری می‌بیند">
              <div className="space-y-3">
                <Field label="پیام خوش‌آمد اولین گفتگو">
                  <textarea rows={3} className="sd-input" value={content.welcomeMessage} onChange={e => updateContent({ welcomeMessage: e.target.value })} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="پلیس‌هولدر صفحه اصلی">
                    <input className="sd-input" value={content.homePlaceholder} onChange={e => updateContent({ homePlaceholder: e.target.value })} />
                  </Field>
                  <Field label="پلیس‌هولدر حالت گفتگو">
                    <input className="sd-input" value={content.chatPlaceholder} onChange={e => updateContent({ chatPlaceholder: e.target.value })} />
                  </Field>
                </div>
              </div>
            </Block>

            <Block icon={<MessageSquare className="w-4 h-4" />} title="پیام‌های سریع" hint="زیر چت‌باکس صفحه اصلی نمایش داده می‌شوند">
              <div className="flex flex-wrap gap-2 mb-3">
                {qm.length === 0 && (
                  <span className="text-[11.5px] text-[hsl(var(--sd-muted))]">هنوز پیام سریعی اضافه نشده.</span>
                )}
                {qm.map(m => (
                  <span key={m} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border"
                    style={{ borderColor: "hsl(var(--sd-stroke))", background: "hsl(var(--sd-surface-2) / .6)" }}>
                    {m}
                    <button onClick={() => setQM(qm.filter(x => x !== m))} className="text-[hsl(var(--sd-muted))] hover:text-[hsl(var(--sd-danger))]" aria-label="حذف">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input className="sd-input" value={newQM} onChange={e => setNewQM(e.target.value)} placeholder="پیام سریع جدید…"
                  onKeyDown={e => { if (e.key === "Enter" && newQM.trim()) { setQM([...qm, newQM.trim()]); setNewQM(""); } }} />
                <button className="sd-btn-primary shrink-0" onClick={() => { if (newQM.trim()) { setQM([...qm, newQM.trim()]); setNewQM(""); } }}>افزودن</button>
              </div>
            </Block>
          </div>

          <Block icon={<Loader2 className="w-4 h-4" />} title="حالت بارگذاری" hint="متن و انیمیشن زمان فکر کردن ایجنت">
            <div className="space-y-4">
              <Field label="متن پلیس‌هولدر هنگام بارگذاری">
                <input className="sd-input" value={content.loadingText} onChange={e => updateContent({ loadingText: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {loadingAnimations.map(a => {
                  const active = content.loadingId === a.id;
                  return (
                    <button key={a.id} onClick={() => updateContent({ loadingId: a.id })}
                      className="rounded-xl border p-4 flex flex-col items-center gap-2 transition-colors"
                      style={{
                        borderColor: active ? "hsl(var(--sd-ink))" : "hsl(var(--sd-stroke))",
                        background: "hsl(var(--sd-surface))",
                        boxShadow: active ? "inset 0 0 0 1px hsl(var(--sd-ink))" : "none",
                      }}>
                      <LoadingPreview id={a.id} />
                      <span className="text-[12px] font-medium">{a.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Block>
        </div>
      )}

      <div className="mt-6 flex justify-start">
        <button className="sd-btn-primary" onClick={() => toast.success("تغییرات ذخیره شد")}>ذخیره تغییرات</button>
      </div>
    </div>
  );
};
