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
import { Home, Search, ShoppingBag, Package, MessageCircle, Settings } from "lucide-react";
import { toPersianDigits } from "./data/format";

type Tab = "home" | "search" | "chat" | "cart" | "orders" | "admin" | "checkout";

const ShiftMobileApp = () => {
  const { store, loading, error } = useShiftStore();
  const { count } = useShiftCart();
  const [tab, setTab] = useState<Tab>("home");

  if (loading) return <div className="flex items-center justify-center min-h-screen text-sm text-[hsl(var(--shift-muted))]">در حال بارگذاری...</div>;
  if (error || !store) return <div className="flex items-center justify-center min-h-screen text-sm text-red-500 px-6 text-center">{error}</div>;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "home", label: "خانه", icon: Home },
    { id: "search", label: "جستجو", icon: Search },
    { id: "chat", label: "دستیار", icon: MessageCircle },
    { id: "cart", label: "سبد", icon: ShoppingBag },
    { id: "orders", label: "سفارش", icon: Package },
  ];

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col">
      {/* Top brand bar */}
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <div className="text-base font-bold">{store.name_fa}</div>
          {store.tagline_fa && <div className="text-[11px] text-[hsl(var(--shift-muted))] mt-0.5">{store.tagline_fa}</div>}
        </div>
        <button onClick={() => setTab("admin")}
          aria-label="تنظیمات کاتالوگ"
          className="w-9 h-9 rounded-full bg-[hsl(var(--shift-surface))] flex items-center justify-center text-[hsl(var(--shift-muted))]">
          <Settings className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 px-5 pb-28">
        {tab === "home" && <HomeView onNavigate={(t) => setTab(t as Tab)} />}
        {tab === "search" && <SearchView />}
        {tab === "chat" && <ChatPanel />}
        {tab === "cart" && <CartView onCheckout={() => setTab("checkout")} />}
        {tab === "checkout" && <CheckoutView onDone={() => setTab("orders")} />}
        {tab === "orders" && <OrdersView />}
        {tab === "admin" && <AdminCatalogView />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 max-w-md mx-auto bg-[hsl(var(--shift-surface))] border-t border-[hsl(var(--shift-border))] px-2 py-2 flex items-center justify-around">
        {tabs.map((n) => {
          const Icon = n.icon;
          const active = tab === n.id;
          return (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] transition ${
                active ? "text-[hsl(var(--shift-primary))]" : "text-[hsl(var(--shift-muted))]"
              }`}>
              <div className="relative">
                <Icon className="w-5 h-5" />
                {n.id === "cart" && count > 0 && (
                  <span className="absolute -top-1 -left-1 bg-[hsl(var(--shift-primary))] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                    {toPersianDigits(count)}
                  </span>
                )}
              </div>
              <span>{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default ShiftMobileApp;
