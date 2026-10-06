import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

export interface TelegramHistoryItem { token: string; title: string; reason: string; ended_at: string; count: number }

const initData = () => ((window as any).Telegram?.WebApp?.initData as string) || "";

/**
 * Opens a Telegram bot conversation (?tg=<token>) as a regular PetAbad chat, for guests too.
 * Signed Telegram initData + a confirmed phone signs the user in (no OTP). `?view=history` opens the history sheet.
 */
export function useTelegramSession({ baskets, setBaskets, setActiveBasketId, setBasketStates, onOpened }: Args) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, setSessionFromOTP } = useAuth();
  const handled = useRef<string | null>(null);
  const token = searchParams.get("tg");
  const wantsHistory = searchParams.get("view") === "history";
  const [pending, setPending] = useState(!!token);
  const [checkoutIntent, setCheckoutIntent] = useState<string | null>(null);
  const [checkoutAddr, setCheckoutAddr] = useState<string | null>(null);
  const [checkoutMode, setCheckoutMode] = useState<string | null>(null);
  const [history, setHistory] = useState<TelegramHistoryItem[] | null>(null);
  const [historyOpen, setHistoryOpen] = useState(wantsHistory);

  const applyAuth = async (auth: any) => {
    if (auth?.access_token && !isAuthenticated) await setSessionFromOTP(auth);
  };

  useEffect(() => {
    const wa = (window as any).Telegram?.WebApp;
    if (wa) { wa.ready?.(); wa.expand?.(); }
  }, []);

  useEffect(() => {
    if (!wantsHistory) return;
    setHistoryOpen(true);
    void supabase.functions.invoke("telegram-session", { body: { action: "history", init_data: initData() } }).then(async ({ data }) => {
      setHistory(data?.items || []);
      await applyAuth(data?.auth);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsHistory]);

  useEffect(() => {
    if (!token || handled.current === token) return;
    handled.current = token;
    setPending(true);
    const intent = searchParams.get("intent");
    const finish = (id: string) => {
      onOpened(id);
      setSearchParams({ c: id }, { replace: true });
      setHistoryOpen(false);
      if (intent === "checkout" || intent === "payment" || intent === "new_address") {
        setCheckoutAddr(intent === "payment" ? searchParams.get("addr") : null);
        setCheckoutMode(intent);
        setCheckoutIntent(id);
      }
      setPending(false);
    };
    if (baskets.some(b => b.id === token)) {
      finish(token);
      void supabase.functions.invoke("telegram-session", { body: { token, init_data: initData() } }).then(({ data }) => applyAuth(data?.auth));
      return;
    }
    void supabase.functions.invoke("telegram-session", { body: { token, init_data: initData() } }).then(async ({ data, error }) => {
      if (error || !data?.session_id) { setPending(false); setSearchParams({}, { replace: true }); return; }
      await applyAuth(data.auth);
      const id: string = data.session_id;
      const base = createDefaultBasketState();
      const cartItems: CartItem[] = (data.cart || []).map((c: any) => ({ ...mapDbProduct(c.product), quantity: c.qty }));
      const msgs = (data.messages || []).map((m: any, i: number) => ({
        id: `tg-${i}`, role: m.role, content: m.content, timestamp: new Date(),
        ...(m.products?.length ? { products: m.products.map(mapDbProduct), productIndexStart: 1 } : {}),
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

  const openHistoryItem = (t: string) => {
    handled.current = null;
    setHistoryOpen(false);
    setSearchParams({ tg: t }, { replace: true });
  };
  const closeHistory = () => {
    setHistoryOpen(false);
    const wa = (window as any).Telegram?.WebApp;
    if (wantsHistory && wa?.close) wa.close();
    else if (wantsHistory) setSearchParams({}, { replace: true });
  };

  return {
    pending: pending || !!token,
    checkoutIntent,
    checkoutAddr,
    checkoutMode,
    clearCheckoutIntent: () => setCheckoutIntent(null),
    history, historyOpen, openHistoryItem, closeHistory,
  };
}
