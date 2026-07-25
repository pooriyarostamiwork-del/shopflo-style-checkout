import { useState } from "react";
import { Plan } from "./data/mockDashboard";
import { DashboardProvider, useDashboard } from "./context/DashboardContext";
import { PlanTag } from "./shared/PlanTag";
import { PerformanceHome } from "./sections/PerformanceHome";
import { AgentControl } from "./sections/AgentControl";
import { VisualCustomization } from "./sections/VisualCustomization";
import { Settings } from "./sections/Settings";
import { PlansBilling } from "./sections/PlansBilling";
import { Support } from "./sections/Support";
import { CustomerIntelligence } from "./sections/CustomerIntelligence";
import { Toaster } from "@/components/ui/sonner";
import "./styles/dashboard.css";
import { LayoutDashboard, Bot, Palette, Settings as SettingsIcon, CreditCard, LifeBuoy, Menu, X, Sparkles } from "lucide-react";

type NavGroup = { label: string; items: { id: string; label: string; icon: any; component: any }[] };

const NAV: NavGroup[] = [
  {
    label: "داشبورد",
    items: [
      { id: "home", label: "عملکرد و خانه", icon: LayoutDashboard, component: PerformanceHome },
    ],
  },
  {
    label: "مدیریت",
    items: [
      { id: "agent", label: "کنترل ایجنت", icon: Bot, component: AgentControl },
      { id: "intelligence", label: "هوش مشتری و بازار", icon: Sparkles, component: CustomerIntelligence },
      { id: "visual", label: "شخصی‌سازی بصری", icon: Palette, component: VisualCustomization },
      { id: "settings", label: "تنظیمات", icon: SettingsIcon, component: Settings },
    ],
  },
  {
    label: "حساب",
    items: [
      { id: "billing", label: "پلن‌ها و صورتحساب", icon: CreditCard, component: PlansBilling },
      { id: "support", label: "پشتیبانی", icon: LifeBuoy, component: Support },
    ],
  },
];

const FLAT = NAV.flatMap(g => g.items);
const USER_NAME = "سارا";

const ShellInner = () => {
  const { activeSection, setActiveSection, plan } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = FLAT.find(n => n.id === activeSection);
  const Section = active?.component ?? PerformanceHome;

  const Sidebar = (
    <aside className="w-64 shrink-0 flex flex-col h-full py-5 px-3 sticky top-4">
      <div className="px-3 pb-7">
        <div className="text-[22px] font-bold tracking-[-0.02em] leading-none">
          Shift<span className="text-[hsl(var(--sd-primary))]">.</span>
        </div>
        <div className="text-[10.5px] text-[hsl(var(--sd-muted))] mt-2 tracking-[0.08em] uppercase">
          Merchant Console
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {NAV.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? "sd-nav-group-sep" : ""}>
            <div className="sd-nav-label">{group.label}</div>
            <div className="flex flex-col gap-0.5">
              {group.items.map(n => {
                const Icon = n.icon;
                const isActive = activeSection === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => { setActiveSection(n.id); setMobileOpen(false); }}
                    className={`sd-nav-item ${isActive ? "active" : ""}`}
                  >
                    <Icon className="w-[15px] h-[15px] shrink-0 sd-nav-icon" strokeWidth={1.75} />
                    <span className="truncate">{n.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );

  return (
    <div className="shift-dash" dir="rtl" lang="fa">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b"
        style={{ background: "hsl(var(--sd-bg) / 0.85)", borderColor: "hsl(var(--sd-stroke))", backdropFilter: "blur(14px)" }}>
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: mobile menu + breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              className="lg:hidden sd-btn-ghost !p-0 !min-h-[40px] !w-10 flex items-center justify-center"
              onClick={() => setMobileOpen(true)}
              aria-label="باز کردن منو"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0 hidden sm:block">
              <div className="text-[10px] text-[hsl(var(--sd-muted))] tracking-[0.14em] uppercase leading-none">
                داشبورد شیفت
              </div>
              <div className="text-[14px] font-semibold text-[hsl(var(--sd-ink))] mt-1 leading-none truncate">
                {active?.label ?? ""}
              </div>
            </div>
          </div>

          {/* Right: plan chip + greeting + avatar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <PlanTag plan={plan} />
            <div className="hidden md:block text-[12.5px] text-[hsl(var(--sd-muted))]">
              خوش آمدید،{" "}
              <span className="text-[hsl(var(--sd-ink))] font-semibold">{USER_NAME}</span>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold border shrink-0 transition-shadow hover:ring-2 hover:ring-[hsl(var(--sd-primary)/0.18)]"
              style={{ background: "hsl(var(--sd-surface))", color: "hsl(var(--sd-ink))", borderColor: "hsl(var(--sd-stroke-strong))" }}
            >
              {USER_NAME.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 py-4 sm:py-6 flex gap-4 sm:gap-5">
        <div className="hidden lg:block">{Sidebar}</div>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40 sd-anim-in" onClick={() => setMobileOpen(false)} />
            <div
              className="absolute top-0 right-0 h-full py-3 shadow-xl"
              style={{ background: "hsl(var(--sd-bg))", width: "min(300px, 88vw)", paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <button
                className="mb-2 mx-3 sd-btn-ghost !p-0 !min-h-[40px] !w-10 flex items-center justify-center"
                onClick={() => setMobileOpen(false)}
                aria-label="بستن منو"
              >
                <X className="w-4 h-4" />
              </button>
              {Sidebar}
            </div>
          </div>
        )}
        <main className="flex-1 min-w-0 pb-16">
          <Section />
        </main>
      </div>

      <Toaster position="bottom-right" />
    </div>
  );
};

export const ShiftDashboard = ({ plan }: { plan: Plan }) => (
  <DashboardProvider plan={plan}>
    <ShellInner />
  </DashboardProvider>
);
