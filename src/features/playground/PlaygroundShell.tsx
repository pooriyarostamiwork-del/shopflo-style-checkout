import { FlaskConical, ShoppingBag } from "lucide-react";
import "./styles/playground.css";
import { PG_STORE, toFa } from "./data/mockStore";
import { usePlaygroundChat } from "./hooks/usePlaygroundChat";
import { PgChatThread } from "./components/PgChatThread";
import { PgCartPanel } from "./components/PgCartPanel";
import { PgDevDrawer } from "./components/PgDevDrawer";
import { PgSlotsProvider } from "./slots";
import { useActiveExperiments } from "./useActiveExperiments";

/** Desktop playground — mirrors the agentic storefront layout. */
export const PlaygroundShell = () => {
  const chat = usePlaygroundChat();
  const { active, onToggleExperiment, slots } = useActiveExperiments();

  return (
    <PgSlotsProvider slots={slots}>
      <div
        className="playground playground-root h-screen w-full flex flex-col bg-background text-foreground"
        dir="rtl"
        lang="fa"
      >
        <header className="h-14 shrink-0 border-b border-border flex items-center gap-3 px-5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-medium">{PG_STORE.name_fa}</h1>
            <p className="text-[11px] text-muted-foreground">{PG_STORE.tagline_fa}</p>
          </div>
          <span className="ms-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-[11px] text-muted-foreground">
            <FlaskConical className="w-3.5 h-3.5 text-primary" />
            محیط آزمایشی — بدون اتصال به سرور
          </span>
          <span className="text-[11px] text-muted-foreground">
            {toFa(chat.summary.totalItems)} کالا در سبد
          </span>
        </header>

        <div className="flex-1 min-h-0 flex">
          <main className="flex-1 min-w-0">
            <PgChatThread chat={chat} columns={3} />
          </main>
          <PgCartPanel
            items={chat.cart}
            summary={chat.summary}
            onRemove={chat.removeFromCart}
            onQuantity={chat.setQuantity}
          />
        </div>

        <PgDevDrawer chat={chat} active={active} onToggleExperiment={onToggleExperiment} />
      </div>
    </PgSlotsProvider>
  );
};

export default PlaygroundShell;
