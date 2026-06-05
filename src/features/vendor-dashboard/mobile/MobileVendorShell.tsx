import { useState } from "react";
import { NavLink, Outlet, Navigate, Route, Routes } from "react-router-dom";
import { Home, Wallet, Settings } from "lucide-react";
import { useVendorDashboard } from "../context/VendorDashboardContext";
import { MobileVendorHome } from "./MobileVendorHome";
import { MobileVendorFinance } from "./MobileVendorFinance";
import { MobileVendorSettings } from "./MobileVendorSettings";

const tabs = [
  { to: "/m/gptcommerce/dash/home", label: "خانه", icon: Home },
  { to: "/m/gptcommerce/dash/finance", label: "مالی", icon: Wallet },
  { to: "/m/gptcommerce/dash/settings", label: "تنظیمات", icon: Settings },
];

const Shell = () => {
  const { vendor, pendingChanges, approvePending } = useVendorDashboard();
  const [devOpen, setDevOpen] = useState(false);

  return (
    <div dir="rtl" className="vendor-dash min-h-screen bg-[hsl(var(--vd-surface-2))] text-foreground flex flex-col">
      <header className="sticky top-0 z-20 bg-[hsl(var(--vd-surface))] border-b border-[hsl(var(--vd-stroke))]">
        <div className="px-4 h-14 flex items-center">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[hsl(var(--vd-accent-soft))] text-[hsl(var(--vd-accent))] flex items-center justify-center text-sm font-semibold">
              ن
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">{vendor.storeName}</div>
              <div className="text-[10px] text-muted-foreground">داشبورد فروشنده</div>
            </div>
          </div>
        </div>
      </header>


      <main className="flex-1 pb-24">
        <Outlet />

        {/* Dev: simulate admin approval */}
        {pendingChanges.length > 0 && (
          <div className="px-4 pb-6">
            <div className="bg-[hsl(var(--vd-warning-soft))] border border-[hsl(var(--vd-stroke))] rounded-2xl p-3">
              <button onClick={() => setDevOpen((v) => !v)} className="text-[11px] text-[hsl(var(--vd-warning))] font-medium">
                {devOpen ? "▼" : "◀"} شبیه‌سازی تأیید ادمین ({pendingChanges.length})
              </button>
              {devOpen && (
                <ul className="mt-2 space-y-1.5">
                  {pendingChanges.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground">{p.section}</span>
                      <button
                        onClick={() => approvePending(p.id)}
                        className="rounded-full bg-[hsl(var(--vd-positive))] text-white px-2 py-0.5"
                      >
                        تأیید
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-[hsl(var(--vd-surface))] border-t border-[hsl(var(--vd-stroke))]">
        <ul className="grid grid-cols-3">
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors ${
                    isActive ? "text-[hsl(var(--vd-accent))]" : "text-muted-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute top-0 inset-x-6 h-0.5 bg-[hsl(var(--vd-accent))] rounded-full" />
                    )}
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    <span className={isActive ? "font-medium" : ""}>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export const MobileVendorShell = () => (
  <Routes>
    <Route element={<Shell />}>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<MobileVendorHome />} />
      <Route path="finance" element={<MobileVendorFinance />} />
      <Route path="settings" element={<MobileVendorSettings />} />
    </Route>
  </Routes>
);
