import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useShiftStore } from "./ShiftStoreContext";
import type { ShiftCartItem, ShiftProduct } from "../data/types";

interface Ctx {
  items: ShiftCartItem[];
  count: number;
  subtotal: number;
  addItem: (product: ShiftProduct, qty?: number) => void;
  updateQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const ShiftCartContext = createContext<Ctx>({
  items: [], count: 0, subtotal: 0,
  addItem: () => {}, updateQty: () => {}, removeItem: () => {}, clear: () => {},
});

export const useShiftCart = () => useContext(ShiftCartContext);

export const ShiftCartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { store } = useShiftStore();
  const [items, setItems] = useState<ShiftCartItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = store ? `shift_cart_${store.slug}` : null;

  // Load from localStorage on mount / store change
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setItems(JSON.parse(raw));
      else setItems([]);
    } catch { setItems([]); }
  }, [storageKey]);

  // Hydrate from DB if logged in
  useEffect(() => {
    if (!user || !store) return;
    supabase.from("shift_carts").select("items").eq("user_id", user.id).eq("store_id", store.id).maybeSingle()
      .then(({ data }) => {
        if (data?.items && Array.isArray(data.items) && (data.items as any[]).length > 0) {
          setItems(data.items as ShiftCartItem[]);
        }
      });
  }, [user, store]);

  // Persist
  useEffect(() => {
    if (storageKey) {
      try { localStorage.setItem(storageKey, JSON.stringify(items)); } catch {}
    }
    if (!user || !store) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      supabase.from("shift_carts").upsert({
        user_id: user.id, store_id: store.id, items: items as any,
      }, { onConflict: "user_id,store_id" }).then(() => {});
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [items, user, store, storageKey]);

  const addItem = useCallback((product: ShiftProduct, qty = 1) => {
    setItems((cur) => {
      const existing = cur.find((i) => i.product_id === product.id);
      if (existing) {
        return cur.map((i) => i.product_id === product.id ? { ...i, qty: i.qty + qty } : i);
      }
      return [...cur, {
        product_id: product.id,
        name_fa: product.name_fa,
        price: product.price,
        image_url: product.image_url,
        qty,
      }];
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setItems((cur) => qty <= 0
      ? cur.filter((i) => i.product_id !== productId)
      : cur.map((i) => i.product_id === productId ? { ...i, qty } : i));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((cur) => cur.filter((i) => i.product_id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <ShiftCartContext.Provider value={{ items, count, subtotal, addItem, updateQty, removeItem, clear }}>
      {children}
    </ShiftCartContext.Provider>
  );
};
