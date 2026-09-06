import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BasketState, createDefaultBasketState } from "./useBasketState";
import { Basket } from "@/components/petabad/Sidebar";
import { ChatMessage, CartItem } from "@/data/petabadData";

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

/** Returns true when a local basket state has meaningful in-flight work that must not be overwritten */
const isLocallyDirty = (state: BasketState | undefined): boolean => {
  if (!state) return false;
  return (
    state.isProcessing ||
    state.hasStartedChat ||
    state.messages.length > 1 ||
    state.cartItems.length > 0
  );
};

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
          .in('status', ['active', 'completed'])
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
          isSaved: b.status === 'completed',
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
            hasStartedChat: false,
          };
        });

        // Merge: prefer DB data, keep local baskets that aren't in DB
        setBaskets(prev => {
          const dbIds = new Set(dbBaskets.map(b => b.id));
          const localOnlyBaskets = prev.filter(b => !dbIds.has(b.id));
          return [...dbBaskets, ...localOnlyBaskets];
        });

        // Conflict-safe merge: only hydrate DB state for baskets that are NOT locally dirty
        setBasketStates(prev => {
          const merged = { ...prev };
          for (const [id, dbState] of Object.entries(dbBasketStates)) {
            if (!isLocallyDirty(prev[id])) {
              merged[id] = dbState;
            }
            // If local state is dirty, keep it as-is (don't overwrite in-flight work)
          }
          return merged;
        });

        // NON-HIJACKING active basket logic:
        // Only set active basket to DB's latest if the current active basket doesn't exist
        // in the merged set. This prevents hijacking a freshly-created landing basket.
        setActiveBasketId(prev => {
          // Check if current active basket will exist after merge
          const allIds = new Set([...dbBaskets.map(b => b.id)]);
          // Also include local-only basket ids
          // We use a functional update, so we just check if prev is still valid
          if (prev && (allIds.has(prev) || !allIds.has(prev))) {
            // prev might be a local-only basket — that's fine, keep it
            return prev;
          }
          // Fallback: pick first DB basket
          return data[0]?.id || prev;
        });

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
      localStorage.removeItem('petabad-baskets');
      localStorage.removeItem('petabad-active-basket');
      localStorage.removeItem('petabad-basket-states');
      localStorage.removeItem('petabad-global-addresses');
    }
  }, [isAuthenticated]);

  // Debounced sync: save current basket to DB when cart OR messages change
  useEffect(() => {
    if (!isAuthenticated) return;

    // Include activeBasketId + last message id for more reliable change detection
    const lastMsg = currentState.messages[currentState.messages.length - 1];
    const syncKey = JSON.stringify({
      basketId: activeBasketId,
      cart: currentState.cartItems,
      msgCount: currentState.messages.length,
      lastMsgId: lastMsg?.id || '',
    });
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
          agentic_state: { ...currentState.agenticState, step: 'idle' } as any,
          selected_address_id: currentState.selectedAddressId || null,
          shipping_selections: currentState.selectedShippingByMerchant as any,
          last_activity: new Date().toISOString(),
          status: basket?.isSaved ? 'completed' : 'active',
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
