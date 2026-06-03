import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Wallet, Settings } from "lucide-react";
import { mockVendor } from "../data/mockVendor";

const tabs = [
  { to: "/m/gptcommerce/dash", label: "خانه", icon: Home, end: true },
  { to: "/m/gptcommerce/dash/finance", label: "مالی", icon: Wallet, end: false },
  { to: "/m/gptcommerce/dash/settings", label: "تنظیمات", icon: Settings, end: false },
];

export const MobileVendorShell = () => {
  const location = useLocation();
  const titleMap: Record<string, string> = {
    "/m/gptcommerce/dash": "داشبورد",
    "/m/gptcommerce/dash/finance": "مالی",
    "/m/gptcommerce/dash/settings": "تنظیمات",
  };
  const title = titleMap[location.pathname] ?? "داشبورد";

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] text-muted-foreground">{title}</span>
            <span className="text-sm font-semibold text-foreground">{mockVendor.storeName}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 border border-border flex items-center justify-center text-primary text-sm font-semibold">
            ن
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-background border-t border-border">
        <ul className="grid grid-cols-3">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
