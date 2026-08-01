import { useState } from "react";
import { ShoppingBag, X } from "lucide-react";
import "./styles/playground.css";
import { PG_STORE, toFa } from "./data/mockStore";
import { usePlaygroundChat } from "./hooks/usePlaygroundChat";
import { PgChatThread } from "./components/PgChatThread";
import { PgCartPanel } from "./components/PgCartPanel";
import { PgDevDrawer } from "./components/PgDevDrawer";
import { PgSlotsProvider } from "./slots";
import { useActiveExperiments } from "./useActiveExperiments";

/** Mobile playground — mirrors the mobile agentic storefront. */
export const MobilePlaygroundShell = () => {
  const chat = usePlaygroundChat();
  const { active, onToggleExperiment, slots } = useActiveExperiments();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <PgSlotsProvider slots={slots}>
      <div
        className="playground playground-root h-[100dvh] w-full flex flex-col bg-background text-foreground"
        dir="rtl"
        lang="fa"
      >
        <header className="h-14 shrink-0 border-b border-border flex items-center gap-2 px-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-sm font-medium">{PG_STORE.name_fa}</h1>
          <button
            onClick={() => setCartOpen(true)}
            className="ms-auto relative w-10 h-10 rounded-xl border border-border flex items-center justify-center"
            aria-label="سبد خرید"
          >
            <ShoppingBag className="w-4 h-4" />
            {chat.summary.totalItems > 0 && (
              <span className="absolute -top-1 -left-1 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {toFa(chat.summary.totalItems)}
              </span>
            )}
          </button>
        </header>

        <main className="flex-1 min-h-0">
          <PgChatThread chat={chat} columns={2} />
        </main>

        {cartOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end" dir="rtl">
            <button
              className="flex-1 bg-foreground/40"
              onClick={() => setCartOpen(false)}
              aria-label="بستن"
            />
            <div className="h-[78dvh] bg-background rounded-t-2xl border-t border-border flex flex-col pg-anim-in overflow-hidden">
              <div className="flex items-center px-4 py-3 border-b border-border">
                <span className="text-sm font-medium">سبد خرید</span>
                <button
                  onClick={() => setCartOpen(false)}
                  className="ms-auto w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground"
                  aria-label="بستن"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0 flex">
                <div className="w-full">
                  <PgCartPanel
                    items={chat.cart}
                    summary={chat.summary}
                    onRemove={chat.removeFromCart}
                    onQuantity={chat.setQuantity}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <PgDevDrawer chat={chat} active={active} onToggleExperiment={onToggleExperiment} />
      </div>
    </PgSlotsProvider>
  );
};

export default MobilePlaygroundShell;
