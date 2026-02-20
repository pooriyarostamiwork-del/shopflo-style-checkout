import { useState, useCallback, useEffect } from "react";
import {
  ChatMessage,
  CartItem,
  Product,
  AgenticState,
  DeliveryAddress,
} from "@/data/gptCommerceData";
import { Basket } from "@/components/gpt-commerce/Sidebar";

// ========== PER-BASKET STATE ==========
export interface BasketState {
  messages: ChatMessage[];
  cartItems: CartItem[];
  agenticState: AgenticState;
  selectedAddressId: string | null;
  selectedShippingByMerchant: Record<string, string>;
  lastRecommendedProducts: Product[];
  isProcessing: boolean;
  hasStartedChat: boolean;
  checkoutAddresses: DeliveryAddress[];
  isOTPVerified: boolean;
  isNewUser: boolean;
}

export const createDefaultBasketState = (): BasketState => ({
  messages: [{
    id: `welcome-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role: 'assistant',
    content: 'سلام! 👋 من دستیار خرید هوشمند فلوکارت هستم. چطور می‌تونم کمکت کنم؟\n\nمی‌تونی بگی دنبال چی می‌گردی، یا از من بخوای محصولات رو مقایسه کنم.',
    timestamp: new Date(),
  }],
  cartItems: [],
  agenticState: {
    step: 'idle',
    isLoggedIn: false,
    hasStoredCheckoutDetails: false,
    selectedAddress: null,
    selectedPayment: null,
    orderId: null,
  },
  selectedAddressId: null,
  selectedShippingByMerchant: {},
  lastRecommendedProducts: [],
  isProcessing: false,
  hasStartedChat: false,
  checkoutAddresses: [],
  isOTPVerified: false,
  isNewUser: false,
});

// localStorage keys
export const BASKETS_STORAGE_KEY = 'flowcart-baskets';
export const ACTIVE_BASKET_KEY = 'flowcart-active-basket';
export const BASKET_STATES_KEY = 'flowcart-basket-states';

// Storage version migration guard (module-level, runs once)
const STORAGE_VERSION_KEY = 'flowcart-storage-version';
const CURRENT_VERSION = '4';
if (typeof window !== 'undefined') {
  const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
  if (storedVersion !== CURRENT_VERSION) {
    localStorage.removeItem('flowcart-basket-states');
    localStorage.removeItem('flowcart-baskets');
    localStorage.removeItem('flowcart-active-basket');
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
  }
}

const getInitialBaskets = (): Basket[] => {
  try {
    const stored = localStorage.getItem(BASKETS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { console.error('Failed to load baskets:', e); }
  return [{ id: 'basket-1', title: 'هدفون‌های بی‌سیم', itemCount: 0, lastActivity: 'الان', savedItems: [] }];
};

const getInitialActiveBasketId = (): string => {
  try {
    const stored = localStorage.getItem(ACTIVE_BASKET_KEY);
    if (stored) return stored;
  } catch (e) { console.error('Failed to load active basket:', e); }
  return 'basket-1';
};

const getInitialBasketStates = (): Record<string, BasketState> => {
  try {
    const stored = localStorage.getItem(BASKET_STATES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      for (const key of Object.keys(parsed)) {
        const bs = parsed[key];
        bs.hasStartedChat = false;
        if (bs.messages) {
          bs.messages = bs.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
        }
      }
      return parsed;
    }
  } catch (e) { console.error('Failed to load basket states:', e); }
  return {};
};

export const useBasketState = () => {
  const [baskets, setBaskets] = useState<Basket[]>(() => getInitialBaskets());
  const [activeBasketId, setActiveBasketId] = useState<string>(() => getInitialActiveBasketId());
  const [basketStates, setBasketStates] = useState<Record<string, BasketState>>(() => getInitialBasketStates());

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem(BASKETS_STORAGE_KEY, JSON.stringify(baskets)); } catch (e) { console.error(e); }
  }, [baskets]);

  useEffect(() => {
    try { localStorage.setItem(ACTIVE_BASKET_KEY, activeBasketId); } catch (e) { console.error(e); }
  }, [activeBasketId]);

  useEffect(() => {
    try { localStorage.setItem(BASKET_STATES_KEY, JSON.stringify(basketStates)); } catch (e) { console.error(e); }
  }, [basketStates]);

  // Initialize missing basket states
  useEffect(() => {
    if (!basketStates[activeBasketId]) {
      setBasketStates(prev => ({
        ...prev,
        [activeBasketId]: createDefaultBasketState(),
      }));
    }
  }, [activeBasketId, basketStates]);

  const getCurrentBasketState = useCallback((): BasketState => {
    return basketStates[activeBasketId] || createDefaultBasketState();
  }, [basketStates, activeBasketId]);

  const currentState = getCurrentBasketState();

  const updateCurrentBasket = useCallback((updater: (prev: BasketState) => BasketState) => {
    setBasketStates(prev => {
      const current = prev[activeBasketId] || createDefaultBasketState();
      return { ...prev, [activeBasketId]: updater(current) };
    });
  }, [activeBasketId]);

  return {
    baskets,
    setBaskets,
    activeBasketId,
    setActiveBasketId,
    basketStates,
    setBasketStates,
    currentState,
    updateCurrentBasket,
  };
};
