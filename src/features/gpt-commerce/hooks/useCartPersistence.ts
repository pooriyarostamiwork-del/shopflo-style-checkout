import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BasketState, createDefaultBasketState } from "./useBasketState";
import { Basket } from "@/components/gpt-commerce/Sidebar";
import { ChatMessage, CartItem } from "@/data/gptCommerceData";

interface UseCartPersistenceProps {
  isAuthenticated: boolean;
  activeBasketId: string;
  currentState: BasketState;
  basketStates: Record<string, BasketState>;
  baskets: Basket[];
  setBaskets: React.Dispatch<React.SetStateAction<Basket[]>>;
  setActiveBasketId: React.Dispatch<React.SetStateAction<string>>;
  setBasketStates: React.Dispatch<React.SetStateAction<Record<string, BasketState>>>;
}

export const useCartPersistence = ({
  isAuthenticated,
  activeBasketId,
  currentState,
  basketStates,
  baskets,
  setBaskets,
  setActiveBasketId,
  setBasketStates,
}: UseCartPersistenceProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedFromDb = useRef(false);
  const lastSyncedCartRef = useRef<string>('');

  // Load baskets from DB when user authenticates
  useEffect(() => {
    if (!isAuthenticated || hasLoadedFromDb.current) return;

    const loadFromDb = async () => {
      setIsSyncing(true);
      try {
        const { data, error } = await supabase
          .from('baskets')
          .select('*')
          .eq('status', 'active')
          .order('last_activity', { ascending: false });

        if (error) {
          console.error('Failed to load baskets from DB:', error);
          return;
        }

        if (!data || data.length === 0) return;

        // Merge DB baskets into local state
        const dbBaskets: Basket[] = data.map(b => ({
          id: b.id,
          title: b.title,
          itemCount: Array.isArray(b.cart_items) ? (b.cart_items as unknown as CartItem[]).length : 0,
          lastActivity: 'قبلاً',
          savedItems: [],
        }));

        const dbBasketStates: Record<string, BasketState> = {};
        data.forEach(b => {
          const defaultState = createDefaultBasketState();
          const cartItems = Array.isArray(b.cart_items) ? b.cart_items as unknown as CartItem[] : [];
          // Filter out stale interactive checkout messages — they lose meaning across sessions
          const messages = Array.isArray(b.messages)
            ? (b.messages as unknown as any[])
                .map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
                .filter((m: any) => !m.addressShipping && !m.paymentOptions && !m.addressSelector && !m.addressConfirmation)
            : defaultState.messages;

          dbBasketStates[b.id] = {
            ...defaultState,
            cartItems,
            messages,
            // Always reset checkout-in-progress state so abandoned sessions resume cleanly
            selectedAddressId: null,
            selectedShippingByMerchant: {},
            agenticState: { ...defaultState.agenticState, step: 'idle' },
            hasStartedChat: cartItems.length > 0 || messages.length > 1,
          };
        });

        // Merge: prefer DB data, keep local baskets that aren't in DB
        setBaskets(prev => {
          const dbIds = new Set(dbBaskets.map(b => b.id));
          const localOnlyBaskets = prev.filter(b => !dbIds.has(b.id));
          return [...dbBaskets, ...localOnlyBaskets];
        });

        setBasketStates(prev => ({
          ...prev,
          ...dbBasketStates,
        }));

        // Always switch to most recent DB basket (even if cart is empty — messages count)
        if (data[0]) {
          setActiveBasketId(data[0].id);
        }

        hasLoadedFromDb.current = true;
      } catch (err) {
        console.error('Error loading baskets from DB:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    loadFromDb();
  }, [isAuthenticated, setBaskets, setBasketStates, setActiveBasketId]);

  // Reset load flag and clear localStorage on sign-out
  useEffect(() => {
    if (!isAuthenticated) {
      hasLoadedFromDb.current = false;
      localStorage.removeItem('flowcart-baskets');
      localStorage.removeItem('flowcart-active-basket');
      localStorage.removeItem('flowcart-basket-states');
      localStorage.removeItem('flowcart-global-addresses');
    }
  }, [isAuthenticated]);

  // Debounced sync: save current basket to DB when cart OR messages change
  useEffect(() => {
    if (!isAuthenticated) return;

    // Sync on any meaningful change — not just cart items
    const syncKey = JSON.stringify({ cart: currentState.cartItems, msgCount: currentState.messages.length });
    if (syncKey === lastSyncedCartRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      lastSyncedCartRef.current = syncKey;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const basket = baskets.find(b => b.id === activeBasketId);
        const messagesForDb = currentState.messages
          .filter((m: any) => !m.addressShipping && !m.paymentOptions && !m.addressSelector && !m.addressConfirmation)
          .map(m => ({
          ...m,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
        }));

        await supabase.from('baskets').upsert({
          id: activeBasketId,
          user_id: user.id,
          title: basket?.title || 'سبد خرید',
          cart_items: currentState.cartItems as any,
          messages: messagesForDb as any,
          agentic_state: currentState.agenticState as any,
          selected_address_id: currentState.selectedAddressId || null,
          shipping_selections: currentState.selectedShippingByMerchant as any,
          last_activity: new Date().toISOString(),
          status: 'active',
        }, { onConflict: 'id' });
      } catch (err) {
        console.error('Error syncing basket to DB:', err);
      }
    }, 1000);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [isAuthenticated, activeBasketId, currentState.cartItems, currentState.messages, currentState.agenticState, currentState.selectedAddressId, currentState.selectedShippingByMerchant, baskets]);

  return { isSyncing };
};
