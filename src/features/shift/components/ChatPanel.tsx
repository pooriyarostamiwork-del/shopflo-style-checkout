import { useState, useRef, useEffect } from "react";
import { useShiftStore } from "../context/ShiftStoreContext";
import { supabase } from "@/integrations/supabase/client";
import { Send } from "lucide-react";
import ProductCard from "./ProductCard";
import type { ShiftProduct } from "../data/types";

interface Msg {
  role: "user" | "assistant";
  content: string;
  products?: ShiftProduct[];
}

const ChatPanel = () => {
  const { store } = useShiftStore();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || !store || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("shift-agent", {
        body: {
          store_id: store.id,
          messages: next.map(({ role, content }) => ({ role, content })),
        },
      });
      if (error) throw error;
      const d = data as any;
      if (d?.error) {
        setMessages((m) => [...m, { role: "assistant", content: d.error }]);
      } else {
        setMessages((m) => [...m, {
          role: "assistant",
          content: d?.content || "...",
          products: (d?.products as ShiftProduct[]) || [],
        }]);
      }
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: "خطا در اتصال به دستیار. لطفاً دوباره تلاش کنید." }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-120px)] max-h-[700px]">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="text-sm text-[hsl(var(--shift-muted))]">سلام! من دستیار {store?.name_fa} هستم.</div>
            {store?.suggested_prompts && (
              <div className="flex flex-wrap gap-2 justify-center">
                {store.suggested_prompts.map((p, i) => (
                  <button key={i} onClick={() => send(p)}
                    className="text-xs px-3 py-1.5 rounded-full bg-[hsl(var(--shift-surface))] border border-[hsl(var(--shift-border))]">
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-start" : ""}>
            <div className={`max-w-[85%] ${m.role === "user" ? "bg-[hsl(var(--shift-primary))] text-white" : "bg-[hsl(var(--shift-surface))] border border-[hsl(var(--shift-border))]"} rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap`}>
              {m.content}
            </div>
            {m.products && m.products.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 w-full">
                {m.products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="text-xs text-[hsl(var(--shift-muted))] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--shift-primary))] animate-pulse" />
            در حال فکر کردن...
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-[hsl(var(--shift-border))]">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="چی می‌خوای؟"
          className="flex-1 px-4 py-3 rounded-xl bg-[hsl(var(--shift-surface))] border border-[hsl(var(--shift-border))] text-sm focus:outline-none focus:border-[hsl(var(--shift-primary))]"
        />
        <button onClick={() => send()} disabled={busy || !input.trim()}
          className="w-11 h-11 rounded-xl bg-[hsl(var(--shift-primary))] text-white flex items-center justify-center disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
