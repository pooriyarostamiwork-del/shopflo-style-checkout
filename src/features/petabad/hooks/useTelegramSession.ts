import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mapDbProduct } from "@/components/petabad/ProductCarousels";
import type { Basket } from "@/components/petabad/Sidebar";
import type { CartItem } from "@/data/petabadData";
import { BasketState, createDefaultBasketState } from "./useBasketState";

interface Args {
  baskets: Basket[];
  setBaskets: React.Dispatch<React.SetStateAction<Basket[]>>;
  setActiveBasketId: (id: string) => void;
  setBasketStates: React.Dispatch<React.SetStateAction<Record<string, BasketState>>>;
  onOpened: (basketId: string) => void;
}

/** Opens a Telegram bot conversation (?tg=<token>) as a regular PetAbad chat, for guests too. */
export function useTelegramSession({ baskets, setBaskets, setActiveBasketId, setBasketStates, onOpened }: Args) {
  const [searchParams, setSearchParams] = useSearchParams();
  const handled = useRef<string | null>(null);
  const token = searchParams.get("tg");

  useEffect(() => {
    const wa = (window as any).Telegram?.WebApp;
    if (wa) { wa.ready?.(); wa.expand?.(); }
  }, []);

  useEffect(() => {
    if (!token || handled.current === token) return;
    handled.current = token;
    const finish = (id: string) => {
      onOpened(id);
      setSearchParams({ c: id }, { replace: true });
    };
    if (baskets.some(b => b.id === token)) { finish(token); return; }
    void supabase.functions.invoke("telegram-session", { body: { token } }).then(({ data, error }) => {
      if (error || !data?.session_id) { setSearchParams({}, { replace: true }); return; }
      const id: string = data.session_id;
      const base = createDefaultBasketState();
      const cartItems: CartItem[] = (data.cart || []).map((c: any) => ({ ...mapDbProduct(c.product), quantity: c.qty }));
      const msgs = (data.messages || []).map((m: any, i: number) => ({
        id: `tg-${i}`, role: m.role, content: m.content, timestamp: new Date(),
      }));
      const firstUser = msgs.find((m: any) => m.role === "user")?.content;
      setBaskets(prev => prev.some(b => b.id === id) ? prev : [{
        id,
        title: String(firstUser || "گفتگوی تلگرام").slice(0, 40),
        itemCount: cartItems.length,
        lastActivity: "الان",
        savedItems: [],
        isSaved: false,
      }, ...prev.filter(b => !b.isDraft)]);
      setBasketStates(prev => ({
        ...prev,
        [id]: { ...base, messages: msgs.length ? msgs : base.messages, cartItems, hasStartedChat: true },
      }));
      setActiveBasketId(id);
      finish(id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
}
