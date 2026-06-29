import { useState } from "react";
import { useShiftStore } from "./context/ShiftStoreContext";
import { useShiftCart } from "./context/ShiftCartContext";
import HomeView from "./views/HomeView";
import SearchView from "./views/SearchView";
import CartView from "./views/CartView";
import CheckoutView from "./views/CheckoutView";
import OrdersView from "./views/OrdersView";
import AdminCatalogView from "./views/AdminCatalogView";
import ChatPanel from "./components/ChatPanel";
import { ShoppingBag, Home, Search, Package, Settings, MessageCircle } from "lucide-react";
import { toPersianDigits } from "./data/format";

type Tab = "home" | "search" | "cart" | "orders" | "admin" | "chat" | "checkout";

const ShiftDesktopApp = () => {
  const { store, loading, error } = useShiftStore();
  const { count } = useShiftCart();
  const [tab, setTab] = useState<Tab>("home");

  if (loading) return <div className="flex items-center justify-center h-screen text-sm text-[hsl(var(--shift-muted))]">در حال بارگذاری...</div>;
  if (error || !store) return <div className="flex items-center justify-center h-screen text-sm text-red-500">{error}</div>;

  const navItems: { id: Tab; label: string; icon: any }[] = [
    { id: "home", label: "خانه", icon: Home },
    { id: "search", label: "جستجو", icon: Search },
    { id: "chat", label: "گفتگو با دستیار", icon: MessageCircle },
    { id: "cart", label: "سبد خرید", icon: ShoppingBag },
    { id: "orders", label: "سفارش‌ها", icon: Package },
    { id: "admin", label: "مدیریت کاتالوگ", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-l border-[hsl(var(--shift-border))] bg-[hsl(var(--shift-surface))] flex flex-col">
        <div className="p-6 border-b border-[hsl(var(--shift-border))]">
          <div className="text-lg font-bold text-[hsl(var(--shift-fg))]">{store.name_fa}</div>
          {store.tagline_fa && <div className="text-xs text-[hsl(var(--shift-muted))] mt-1">{store.tagline_fa}</div>}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((n) => {
            const Icon = n.icon;
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active
                    ? "bg-[hsl(var(--shift-primary))] text-white"
                    : "text-[hsl(var(--shift-fg))] hover:bg-[hsl(var(--shift-hover))]"
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-right">{n.label}</span>
                {n.id === "cart" && count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${active ? "bg-white text-[hsl(var(--shift-primary))]" : "bg-[hsl(var(--shift-primary))] text-white"}`}>
                    {toPersianDigits(count)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 text-xs text-[hsl(var(--shift-muted))]">
          نمونه: <code className="font-mono">{store.slug}</code>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          {tab === "home" && <HomeView onNavigate={(t) => setTab(t as Tab)} />}
          {tab === "search" && <SearchView />}
          {tab === "chat" && <ChatPanel />}
          {tab === "cart" && <CartView onCheckout={() => setTab("checkout")} />}
          {tab === "checkout" && <CheckoutView onDone={() => setTab("orders")} />}
          {tab === "orders" && <OrdersView />}
          {tab === "admin" && <AdminCatalogView />}
        </div>
      </main>
    </div>
  );
};

export default ShiftDesktopApp;
