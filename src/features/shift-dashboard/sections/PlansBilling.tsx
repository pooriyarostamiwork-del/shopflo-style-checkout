import { useState } from "react";
import { SectionTabs } from "../shared/SectionTabs";
import { SectionHeader } from "../shared/SectionHeader";
import { aiPlans, conversationTiers, currentAIPlan, aiPlanHistory, shiftPlans, faToman, fa, faNum, faPct } from "../data/mockDashboard";
import { useDashboard } from "../context/DashboardContext";
import { toast } from "sonner";
import { Sparkles, ArrowUpRight, Check } from "lucide-react";

export const PlansBilling = () => {
  const [tab, setTab] = useState("ai");
  const { plan } = useDashboard();

  return (
    <div>
      <SectionHeader
        eyebrow="پلن‌ها و صورتحساب"
        title="مصرف هوش مصنوعی و پلن Shift"
        subtitle="گفتگوها، ارتقا و تاریخچه پرداخت"
      />

      <SectionTabs
        tabs={[
          { id: "ai", label: "گفتگوهای هوش مصنوعی" },
          { id: "billing", label: "صورتحساب و پلن Shift" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "ai" && <AITab />}
      {tab === "billing" && <BillingTab plan={plan} />}
    </div>
  );
};

const AITab = () => {
  const [selectedTiers, setSelectedTiers] = useState<Record<string, number>>(
    Object.fromEntries(aiPlans.map(p => [p.id, 0]))
  );
  const remainPct = (currentAIPlan.remaining / currentAIPlan.total) * 100;

  return (
    <div className="space-y-5">
      {/* Current status — hero */}
      <div className="sd-card-hero sd-anim-in p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-[11px]" style={{ color: "rgba(255,255,255,.7)" }}>پلن فعلی</div>
            <div className="mt-1.5 text-xl font-bold">{aiPlans.find(p => p.id === currentAIPlan.id)?.name}</div>
            <div className="text-[11px] mt-1 sd-num" style={{ color: "rgba(255,255,255,.7)" }}>خرید: {currentAIPlan.purchaseDate}</div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: "rgba(255,255,255,.7)" }}>گفتگوهای باقیمانده</div>
            <div className="mt-1.5 text-xl font-bold sd-num">{faNum(currentAIPlan.remaining)} / {faNum(currentAIPlan.total)}</div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.2)" }}>
              <div style={{ width: `${remainPct}%`, background: "white", height: "100%" }} />
            </div>
          </div>
          <div>
            <div className="text-[11px]" style={{ color: "rgba(255,255,255,.7)" }}>پلن در صف</div>
            <div className="mt-1.5 text-xl font-bold">{aiPlans.find(p => p.id === currentAIPlan.queued)?.name}</div>
            <div className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,.7)" }}>پس از اتمام پلن فعلی فعال می‌شود</div>
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
            <div key={p.id} className="sd-card sd-card-raise p-5 flex flex-col relative"
              style={{ borderColor: p.popular ? "hsl(var(--sd-ink))" : undefined, borderWidth: p.popular ? 1.5 : 1 }}>
              {p.popular && (
                <div className="absolute -top-2.5 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold"
                  style={{ background: "hsl(var(--sd-ink))", color: "white" }}>
                  <Sparkles className="w-3 h-3" /> محبوب
                </div>
              )}
              <div className="text-[11px] text-[hsl(var(--sd-muted))]">{p.model}</div>
              <div className="text-[17px] font-bold mt-1">{p.name}</div>
              <div className="mt-4 text-[24px] font-bold sd-num tracking-tight leading-none">{faToman(price)}</div>
              <div className="text-[11.5px] text-[hsl(var(--sd-muted))] mt-2 sd-num">
                {faNum(Math.round(convs))} گفتگو {tier.discount > 0 && <span style={{ color: "hsl(var(--sd-success))" }}> — {faPct(tier.discount)} تخفیف</span>}
              </div>

              <div className="mt-4">
                <div className="text-[11px] text-[hsl(var(--sd-muted))] mb-2">حجم گفتگو</div>
                <div className="flex gap-1">
                  {conversationTiers.map((t, i) => (
                    <button key={i} onClick={() => setSelectedTiers(s => ({ ...s, [p.id]: i }))}
                      className="flex-1 py-1.5 rounded-lg text-[11px] border sd-num transition"
                      style={{
                        borderColor: tierIdx === i ? "hsl(var(--sd-ink))" : "hsl(var(--sd-stroke))",
                        background: tierIdx === i ? "hsl(var(--sd-ink))" : "transparent",
                        color: tierIdx === i ? "white" : "hsl(var(--sd-ink-2))",
                        fontWeight: tierIdx === i ? 600 : 400,
                      }}>
                      ×{fa(t.conversations / 1000)}k
                    </button>
                  ))}
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-[12px] text-[hsl(var(--sd-ink-2))] flex-1">
                {p.features.map(f => <li key={f} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(var(--sd-primary))" }} /> {f}</li>)}
              </ul>
              <button className="mt-5 sd-btn-primary" onClick={() => toast.success(`${p.name} انتخاب شد`)}>خرید پلن</button>
            </div>
          );
        })}
      </div>

      <HistoryTable />
    </div>
  );
};

const BillingTab = ({ plan }: { plan: string }) => (
  <div className="space-y-4">
    <div className="sd-card p-6 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <div className="text-[11px] text-[hsl(var(--sd-muted))]">پلن فعلی Shift</div>
        <div className="mt-1.5 text-[26px] font-bold tracking-tight">{shiftPlans.current.name}</div>
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
      <div className="p-5 border-b text-[14px] font-semibold" style={{ borderColor: "hsl(var(--sd-stroke))" }}>تاریخچه صورتحساب</div>
      <table className="sd-table" dir="rtl">
        <thead>
          <tr>
            <th>پلن</th>
            <th>تاریخ خرید</th>
            <th>تاریخ انقضا</th>
            <th className="!text-left">مبلغ</th>
          </tr>
        </thead>
        <tbody>
          {shiftPlans.history.map(h => (
            <tr key={h.id}>
              <td className="font-medium">{h.plan}</td>
              <td className="sd-num text-[hsl(var(--sd-muted))]">{h.purchased}</td>
              <td className="sd-num text-[hsl(var(--sd-muted))]">{h.expired}</td>
              <td className="text-left sd-num font-semibold">{faToman(h.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const HistoryTable = () => (
  <div className="sd-card overflow-hidden">
    <div className="p-5 border-b text-[14px] font-semibold" style={{ borderColor: "hsl(var(--sd-stroke))" }}>تاریخچه پلن‌های گفتگو</div>
    <table className="sd-table" dir="rtl">
      <thead>
        <tr>
          <th>پلن</th>
          <th>تاریخ خرید</th>
          <th>تاریخ اتمام</th>
          <th className="!text-left">مبلغ</th>
        </tr>
      </thead>
      <tbody>
        {aiPlanHistory.map(h => (
          <tr key={h.id}>
            <td className="font-medium">{h.plan}</td>
            <td className="sd-num text-[hsl(var(--sd-muted))]">{h.purchased}</td>
            <td className="sd-num text-[hsl(var(--sd-muted))]">{h.ranOut}</td>
            <td className="text-left sd-num font-semibold">{faToman(h.price)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
