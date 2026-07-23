import { useState } from "react";
import { SectionTabs } from "../shared/SectionTabs";
import { aiPlans, conversationTiers, currentAIPlan, aiPlanHistory, shiftPlans, faToman, fa, faNum, faPct } from "../data/mockDashboard";
import { useDashboard } from "../context/DashboardContext";
import { toast } from "sonner";
import { Sparkles, ArrowUpRight } from "lucide-react";

export const PlansBilling = () => {
  const [tab, setTab] = useState("ai");
  const { plan } = useDashboard();

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold">پلن‌ها، صورتحساب و مصرف هوش مصنوعی</h1>
      </div>

      <SectionTabs
        tabs={[
          { id: "ai", label: "گفتگوهای هوش مصنوعی" },
          { id: "billing", label: "صورتحساب و پلن Shift" },
          { id: "history", label: "تاریخچه" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "ai" && <AITab />}
      {tab === "billing" && <BillingTab plan={plan} />}
      {tab === "history" && <HistoryTab />}
    </div>
  );
};

const AITab = () => {
  const [selectedTiers, setSelectedTiers] = useState<Record<string, number>>(
    Object.fromEntries(aiPlans.map(p => [p.id, 0]))
  );

  return (
    <div className="space-y-5">
      {/* Current status */}
      <div className="sd-card p-5" style={{ background: "linear-gradient(120deg, hsl(var(--sd-primary-soft)), hsl(var(--sd-surface)) 70%)" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-[11px] text-[hsl(var(--sd-muted))]">پلن فعلی</div>
            <div className="mt-1 text-lg font-bold">{aiPlans.find(p => p.id === currentAIPlan.id)?.name}</div>
            <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-1 sd-num">خرید: {currentAIPlan.purchaseDate}</div>
          </div>
          <div>
            <div className="text-[11px] text-[hsl(var(--sd-muted))]">گفتگوهای باقیمانده</div>
            <div className="mt-1 text-lg font-bold sd-num">{faNum(currentAIPlan.remaining)} / {faNum(currentAIPlan.total)}</div>
            <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--sd-surface-2))" }}>
              <div style={{ width: `${(currentAIPlan.remaining / currentAIPlan.total) * 100}%`, background: "hsl(var(--sd-primary))", height: "100%" }} />
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[hsl(var(--sd-muted))]">پلن در صف</div>
            <div className="mt-1 text-lg font-bold">{aiPlans.find(p => p.id === currentAIPlan.queued)?.name}</div>
            <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-1">پس از اتمام پلن فعلی فعال می‌شود</div>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {aiPlans.map(p => {
          const tierIdx = selectedTiers[p.id];
          const tier = conversationTiers[tierIdx];
          const convs = tier.conversations * (p.baseConversations / conversationTiers[0].conversations);
          const price = Math.round(p.basePrice * (tier.conversations / conversationTiers[0].conversations) * (1 - tier.discount / 100));
          return (
            <div key={p.id} className={`sd-card sd-card-hover p-4 flex flex-col relative ${p.popular ? "" : ""}`}
              style={{ borderColor: p.popular ? "hsl(var(--sd-primary))" : undefined }}>
              {p.popular && (
                <div className="absolute -top-2 right-4 sd-chip" style={{ background: "hsl(var(--sd-primary))", color: "white", borderColor: "hsl(var(--sd-primary))" }}>
                  <Sparkles className="w-3 h-3" /> محبوب
                </div>
              )}
              <div className="text-[11px] text-[hsl(var(--sd-muted))]">{p.model}</div>
              <div className="text-lg font-bold mt-1">{p.name}</div>
              <div className="mt-3 text-2xl font-bold sd-num">{faToman(price)}</div>
              <div className="text-[11px] text-[hsl(var(--sd-muted))] mt-1 sd-num">
                {faNum(Math.round(convs))} گفتگو {tier.discount > 0 && <span style={{ color: "hsl(var(--sd-success))" }}> — {faPct(tier.discount)} تخفیف</span>}
              </div>

              <div className="mt-3">
                <div className="text-[11px] text-[hsl(var(--sd-muted))] mb-1.5">حجم گفتگو</div>
                <div className="flex gap-1">
                  {conversationTiers.map((t, i) => (
                    <button key={i} onClick={() => setSelectedTiers(s => ({ ...s, [p.id]: i }))}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] border sd-num`}
                      style={{
                        borderColor: tierIdx === i ? "hsl(var(--sd-primary))" : "hsl(var(--sd-stroke))",
                        background: tierIdx === i ? "hsl(var(--sd-primary-soft))" : "transparent",
                        color: tierIdx === i ? "hsl(var(--sd-primary-ink))" : "hsl(var(--sd-ink-2))",
                      }}>
                      ×{fa(t.conversations / 1000)}k
                    </button>
                  ))}
                </div>
              </div>

              <ul className="mt-4 space-y-1.5 text-[12px] text-[hsl(var(--sd-ink-2))] flex-1">
                {p.features.map(f => <li key={f} className="flex items-center gap-1.5">✓ {f}</li>)}
              </ul>
              <button className="mt-4 sd-btn-primary" onClick={() => toast.success(`${p.name} انتخاب شد`)}>خرید پلن</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BillingTab = ({ plan }: { plan: string }) => (
  <div className="space-y-4">
    <div className="sd-card p-5 flex items-center justify-between gap-4">
      <div>
        <div className="text-[11px] text-[hsl(var(--sd-muted))]">پلن فعلی Shift</div>
        <div className="mt-1 text-2xl font-bold">{shiftPlans.current.name}</div>
        <div className="text-[12px] text-[hsl(var(--sd-muted))] mt-1 sd-num">
          {faToman(shiftPlans.current.price)} / {shiftPlans.current.cycle} — تمدید بعدی: {shiftPlans.current.nextRenewal}
        </div>
      </div>
      {plan === "lite" && (
        <button className="sd-btn-primary inline-flex items-center gap-1">
          ارتقا به Shift Pro <ArrowUpRight className="w-4 h-4" />
        </button>
      )}
    </div>

    <div className="sd-card overflow-hidden">
      <div className="p-4 border-b text-sm font-semibold" style={{ borderColor: "hsl(var(--sd-stroke))" }}>تاریخچه صورتحساب</div>
      <table className="w-full text-[13px]" dir="rtl">
        <thead className="text-[11px] text-[hsl(var(--sd-muted))]" style={{ background: "hsl(var(--sd-surface-2))" }}>
          <tr>
            <th className="text-right p-3 font-normal">پلن</th>
            <th className="text-right p-3 font-normal">تاریخ خرید</th>
            <th className="text-right p-3 font-normal">تاریخ انقضا</th>
            <th className="text-left p-3 font-normal">مبلغ</th>
          </tr>
        </thead>
        <tbody>
          {shiftPlans.history.map(h => (
            <tr key={h.id} className="border-t" style={{ borderColor: "hsl(var(--sd-stroke))" }}>
              <td className="p-3">{h.plan}</td>
              <td className="p-3 sd-num">{h.purchased}</td>
              <td className="p-3 sd-num">{h.expired}</td>
              <td className="p-3 text-left sd-num">{faToman(h.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const HistoryTab = () => (
  <div className="sd-card overflow-hidden">
    <div className="p-4 border-b text-sm font-semibold" style={{ borderColor: "hsl(var(--sd-stroke))" }}>تاریخچه پلن‌های گفتگو</div>
    <table className="w-full text-[13px]" dir="rtl">
      <thead className="text-[11px] text-[hsl(var(--sd-muted))]" style={{ background: "hsl(var(--sd-surface-2))" }}>
        <tr>
          <th className="text-right p-3 font-normal">پلن</th>
          <th className="text-right p-3 font-normal">تاریخ خرید</th>
          <th className="text-right p-3 font-normal">تاریخ اتمام</th>
          <th className="text-left p-3 font-normal">مبلغ</th>
        </tr>
      </thead>
      <tbody>
        {aiPlanHistory.map(h => (
          <tr key={h.id} className="border-t" style={{ borderColor: "hsl(var(--sd-stroke))" }}>
            <td className="p-3">{h.plan}</td>
            <td className="p-3 sd-num">{h.purchased}</td>
            <td className="p-3 sd-num">{h.ranOut}</td>
            <td className="p-3 text-left sd-num">{faToman(h.price)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
