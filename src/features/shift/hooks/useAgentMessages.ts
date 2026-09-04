import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShiftStore } from "@/features/shift/context/ShiftStoreContext";
import {
  ChatMessage,
  CartItem,
  Product,
  DeliveryAddress,
  QuickReplyType,
  paymentOptions,
  merchants,
} from "@/features/shift/data/shiftData";

// Helper: extract a clean basket name from user query + returned products
const FILLER_WORDS = /\b(می‌خوام|میخوام|خوب|بهترین|نشون بده|نشان بده|پیدا کن|برام|برای من|لطفا|لطفاً|یه|یک|چند|تا|رو|با|از|که|هم|و|ارزان|گران|ارسال سریع|موجود)\b/g;

const extractSmartName = (userMessage: string, products: Product[]): string => {
  if (products.length > 0) {
    const p = products[0];
    const nameWords = p.name.split(/\s+/).slice(0, 3).join(' ');
    if (nameWords.length <= 25) return nameWords;
    return nameWords.slice(0, 25) + '…';
  }
  const cleaned = userMessage.replace(FILLER_WORDS, '').replace(/\s+/g, ' ').trim();
  const words = cleaned.split(/\s+/).slice(0, 3).join(' ');
  if (!words) return userMessage.slice(0, 20);
  return words.length > 25 ? words.slice(0, 25) + '…' : words;
};
import { Basket } from "@/components/shift/Sidebar";
import { BasketState, createDefaultBasketState } from "./useBasketState";

// ── Intent classification types ──
interface IntentClassification {
  intent_type: "transactional" | "discovery" | "comparison" | "info_retrieval" | "conversational";
  intent_subtype: string;
  entities: {
    product_ref?: number;
    product_name?: string;
    product_refs?: number[];
    quantity?: number;
    delta?: number;
    coupon_code?: string;
  };
  confidence: number;
}

interface UseAgentMessagesProps {
  updateCurrentBasket: (updater: (prev: BasketState) => BasketState) => void;
  setBasketStates: React.Dispatch<React.SetStateAction<Record<string, BasketState>>>;
  setBaskets: React.Dispatch<React.SetStateAction<Basket[]>>;
  activeBasketId: string;
  globalAddresses: DeliveryAddress[];
  isOTPVerified: boolean;
  handleFinalizePurchase: () => void;
  setIsCartOpen: (v: boolean) => void;
  setShowOTPModal: (v: boolean) => void;
  setOtpContext: (ctx: 'checkout' | 'login') => void;
  cartItems: CartItem[];
  messages: ChatMessage[];
  lastRecommendedProducts: Product[];
}

export const mapDbProduct = (dbProduct: any): Product => {
  // Single-vendor: every product belongs to the shift store, regardless of
  // whether the DB row originates from shift_products or products.
  return {
    id: dbProduct.id,
    name: dbProduct.name || dbProduct.name_fa,
    price: dbProduct.price,
    originalPrice: dbProduct.original_price || undefined,
    image: dbProduct.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    imageUrls: dbProduct.image_urls?.length > 0 ? dbProduct.image_urls : undefined,
    description: dbProduct.description || dbProduct.description_fa || undefined,
    specs: dbProduct.specs?.length > 0 ? dbProduct.specs : undefined,
    reviewsSummary: dbProduct.reviews_summary || undefined,
    merchant: merchants[0],
    rating: Number(dbProduct.rating) || 4.0,
    fastDelivery: dbProduct.fast_delivery || false,
    returnGuarantee: dbProduct.return_guarantee || true,
    inStock: dbProduct.in_stock !== false,
    colorOptions: dbProduct.color_options?.length > 0 ? dbProduct.color_options : undefined,
  };
};

// ── Invoke an edge function with a hard timeout so a stalled model call can't hang the UI ──
async function invokeWithTimeout(fn: string, body: any, ms = 25000) {
  return await Promise.race([
    supabase.functions.invoke(fn, { body }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]) as { data: any; error: any };
}

// ── Fuzzy match products by name (returns ALL matches) ──
function fuzzyMatchProducts(name: string, products: Product[]): Product[] {
  if (!name || products.length === 0) return [];
  const lowerName = name.toLowerCase();
  return products.filter(p => p.name.toLowerCase().includes(lowerName));
}

// ── Trim conversation history for agent calls ──
function trimHistoryForAgent(messages: ChatMessage[]): { role: string; content: string }[] {
  return messages
    .filter(m => m.role === 'user' || (m.role === 'assistant' && !m.products))
    .slice(-4)
    .map(m => ({ role: m.role, content: m.content.slice(0, 300) }));
}

export const useAgentMessages = ({
  updateCurrentBasket,
  setBasketStates,
  setBaskets,
  activeBasketId,
  globalAddresses,
  isOTPVerified,
  handleFinalizePurchase,
  setIsCartOpen,
  setShowOTPModal,
  setOtpContext,
  cartItems,
  messages,
  lastRecommendedProducts,
}: UseAgentMessagesProps) => {
  const { store } = useShiftStore();
  const storeId = store?.id;



  const handleAddToCart = useCallback((product: Product, quantity: number = 1) => {
    updateCurrentBasket(s => {
      const existing = s.cartItems.find(item => item.id === product.id);
      const newCart = existing
        ? s.cartItems.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)
        : [...s.cartItems, { ...product, quantity }];

      const updatedMessages = s.messages.map(msg =>
        msg.ctaButton
          ? { ...msg, ctaButton: undefined, content: msg.content.split('\n')[0] + '\n\n«سبد خرید به‌روزرسانی شد»' }
          : msg
      );

      const qtyText = quantity > 1 ? ` (${quantity} عدد)` : '';
      const confirmMessage: ChatMessage = {
        id: `confirm-${Date.now()}`,
        role: 'assistant',
        content: `${product.name}${qtyText} به سبدت اضافه شد! ✅\n\nمحصول دیگه‌ای می‌خوای یا خرید رو نهایی کنیم؟\nمی‌تونی از سبد خریدت تعداد و نوع محصول رو تغییر بدی.`,
        ctaButton: { label: 'نهایی کردن خرید', action: 'finalize', disabled: false },
        timestamp: new Date(),
      };

      return {
        ...s,
        cartItems: newCart,
        messages: [...updatedMessages, confirmMessage],
        agenticState: { ...s.agenticState, step: 'product-added' },
      };
    });
    setIsCartOpen(true);
  }, [updateCurrentBasket, setIsCartOpen]);

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    updateCurrentBasket(s => ({
      ...s,
      cartItems: quantity < 1
        ? s.cartItems.filter(item => item.id !== productId)
        : s.cartItems.map(item => item.id === productId ? { ...item, quantity } : item),
    }));
  }, [updateCurrentBasket]);

  const handleRemoveItem = useCallback((productId: string) => {
    updateCurrentBasket(s => ({
      ...s,
      cartItems: s.cartItems.filter(item => item.id !== productId),
    }));
  }, [updateCurrentBasket]);

  const handleCompare = useCallback((product: Product) => {
    const compareMessage: ChatMessage = {
      id: `compare-${Date.now()}`,
      role: 'assistant',
      content: `می‌خوای ${product.name} رو با چی مقایسه کنم؟`,
      timestamp: new Date(),
    };
    updateCurrentBasket(s => ({ ...s, messages: [...s.messages, compareMessage] }));
  }, [updateCurrentBasket]);

  const handleInlineProductDetails = useCallback((product: Product) => {
    const detailsMessage: ChatMessage = {
      id: `details-${Date.now()}`,
      role: 'assistant',
      content: `جزئیات کامل محصول ${product.name}:`,
      inlineProduct: product,
      timestamp: new Date(),
    };
    updateCurrentBasket(s => ({ ...s, messages: [...s.messages, detailsMessage] }));
  }, [updateCurrentBasket]);

  const handleSaveProduct = useCallback((product: Product) => {
    setBaskets(prev => prev.map(b => {
      if (b.id !== activeBasketId) return b;
      const alreadySaved = b.savedItems.some(i => i.productId === product.id);
      if (alreadySaved) {
        return { ...b, savedItems: b.savedItems.filter(i => i.productId !== product.id) };
      }
      return {
        ...b,
        savedItems: [...b.savedItems, {
          id: `saved-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        }],
      };
    }));
  }, [activeBasketId, setBaskets]);

  // ── Transactional handlers (no LLM call needed) ──

  const handleTransactionalCartAdd = useCallback((ref: number, quantity: number = 1) => {
    if (ref < 1 || ref > lastRecommendedProducts.length) {
      const msg: ChatMessage = {
        id: `err-${Date.now()}`, role: 'assistant',
        content: `محصول شماره ${ref} وجود نداره. لطفاً یه شماره بین ۱ تا ${lastRecommendedProducts.length} بگو.`,
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, msg], isProcessing: false }));
      return;
    }
    const product = lastRecommendedProducts[ref - 1];
    handleAddToCart(product, quantity);
    updateCurrentBasket(s => ({ ...s, isProcessing: false }));
  }, [lastRecommendedProducts, handleAddToCart, updateCurrentBasket]);

  const handleTransactionalCartAddByName = useCallback((name: string, quantity: number = 1) => {
    const matches = fuzzyMatchProducts(name, lastRecommendedProducts);
    
    if (matches.length === 0) {
      // Also try cart items
      const cartMatches = fuzzyMatchProducts(name, cartItems as Product[]);
      if (cartMatches.length === 1) {
        handleAddToCart(cartMatches[0], quantity);
        updateCurrentBasket(s => ({ ...s, isProcessing: false }));
        return;
      }
      const msg: ChatMessage = {
        id: `err-${Date.now()}`, role: 'assistant',
        content: `محصولی با نام "${name}" پیدا نکردم. می‌خوای برات جستجو کنم؟`,
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, msg], isProcessing: false }));
      return;
    }
    
    if (matches.length === 1) {
      handleAddToCart(matches[0], quantity);
      updateCurrentBasket(s => ({ ...s, isProcessing: false }));
      return;
    }
    
    // Multiple matches → client-side disambiguation with quick-reply chips
    const quickReplies = matches.slice(0, 4).map((p, i) => ({
      id: `disambig-${i}`,
      label: p.name.length > 45 ? p.name.slice(0, 42) + '…' : p.name,
      type: 'custom' as QuickReplyType,
      action: `add_product_${p.id}_qty_${quantity}`,
    }));
    const msg: ChatMessage = {
      id: `disambig-${Date.now()}`, role: 'assistant',
      content: `چند محصول "${name}" پیدا کردم. کدومشو می‌خوای اضافه کنم؟`,
      quickReplies,
      timestamp: new Date(),
    };
    updateCurrentBasket(s => ({ ...s, messages: [...s.messages, msg], isProcessing: false }));
  }, [lastRecommendedProducts, cartItems, handleAddToCart, updateCurrentBasket]);

  const handleTransactionalCartRemove = useCallback((ref?: number, name?: string) => {
    let productToRemove: CartItem | undefined;
    if (ref && ref >= 1 && ref <= lastRecommendedProducts.length) {
      const refProduct = lastRecommendedProducts[ref - 1];
      productToRemove = cartItems.find(item => item.id === refProduct.id);
    } else if (name) {
      productToRemove = cartItems.find(item => item.name.toLowerCase().includes(name.toLowerCase()));
    } else if (cartItems.length === 1) {
      productToRemove = cartItems[0];
    }

    if (!productToRemove) {
      const msg: ChatMessage = {
        id: `err-${Date.now()}`, role: 'assistant',
        content: 'محصول مورد نظر در سبد خریدت پیدا نشد.',
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, msg], isProcessing: false }));
      return;
    }

    const removedName = productToRemove.name;
    handleRemoveItem(productToRemove.id);
    const msg: ChatMessage = {
      id: `removed-${Date.now()}`, role: 'assistant',
      content: `${removedName} از سبد خریدت حذف شد. ❌`,
      timestamp: new Date(),
    };
    updateCurrentBasket(s => ({ ...s, messages: [...s.messages, msg], isProcessing: false }));
  }, [lastRecommendedProducts, cartItems, handleRemoveItem, updateCurrentBasket]);

  const handleTransactionalQuantityUpdate = useCallback((ref: number | undefined, quantity: number, delta?: number) => {
    let targetItem: CartItem | undefined;
    if (ref && ref >= 1 && ref <= lastRecommendedProducts.length) {
      const refProduct = lastRecommendedProducts[ref - 1];
      targetItem = cartItems.find(item => item.id === refProduct.id);
    } else if (cartItems.length === 1) {
      targetItem = cartItems[0];
    }

    if (!targetItem) {
      const msg: ChatMessage = {
        id: `err-${Date.now()}`, role: 'assistant',
        content: 'محصول مورد نظر در سبد خریدت پیدا نشد.',
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, msg], isProcessing: false }));
      return;
    }

    const newQty = delta ? targetItem.quantity + delta : quantity;
    if (newQty < 1) {
      handleRemoveItem(targetItem.id);
      const msg: ChatMessage = {
        id: `removed-${Date.now()}`, role: 'assistant',
        content: `${targetItem.name} از سبد خریدت حذف شد.`,
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, msg], isProcessing: false }));
    } else {
      handleUpdateQuantity(targetItem.id, newQty);
      const msg: ChatMessage = {
        id: `qty-${Date.now()}`, role: 'assistant',
        content: `تعداد ${targetItem.name} به ${newQty} عدد تغییر کرد. ✅`,
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, msg], isProcessing: false }));
    }
  }, [lastRecommendedProducts, cartItems, handleRemoveItem, handleUpdateQuantity, updateCurrentBasket]);

  const handleTransactionalCheckout = useCallback(() => {
    if (cartItems.length === 0) {
      const msg: ChatMessage = {
        id: `err-${Date.now()}`, role: 'assistant',
        content: 'سبد خریدت خالیه! اول محصولی اضافه کن.',
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, msg], isProcessing: false }));
      return;
    }
    handleFinalizePurchase();
    updateCurrentBasket(s => ({ ...s, isProcessing: false }));
  }, [cartItems.length, handleFinalizePurchase, updateCurrentBasket]);

  // ── Main message handler with intent classification ──
  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    updateCurrentBasket(s => ({ ...s, messages: [...s.messages, userMessage], isProcessing: true }));

    // ── Fast-path: hardcoded cart-manipulation phrases (no LLM call) ──
    // Persian digit → Latin
    const p2l = (s: string) => s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const norm = p2l(content).trim().toLowerCase();

    // Extract product ref number (#1, شماره ۱, محصول ۱, اولی، دومی…)
    const ordinalMap: Record<string, number> = {
      'اول': 1, 'اولی': 1, 'یکم': 1,
      'دوم': 2, 'دومی': 2,
      'سوم': 3, 'سومی': 3,
      'چهارم': 4, 'چهارمی': 4,
      'پنجم': 5, 'پنجمی': 5,
      'ششم': 6, 'ششمی': 6,
    };
    const refMatch = norm.match(/(?:#|شماره\s*|محصول\s*)(\d+)/) || norm.match(/\b(\d+)\s*(?:ام|امی|م)?\b/);
    let refNum: number | undefined = refMatch ? parseInt(refMatch[1]) : undefined;
    if (!refNum) {
      for (const [word, num] of Object.entries(ordinalMap)) {
        if (norm.includes(word)) { refNum = num; break; }
      }
    }
    const qtyMatch = norm.match(/(\d+)\s*(?:عدد|تا|بسته)/);
    const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;

    // ADD patterns: "اضافه کن", "بذار تو سبد", "بخر", "میخوام بخرم"
    const addRe = /(اضاف|بذار|بگذار|بریز|بندا[زذ]|به سبد|توی سبد|تو سبد|بخر|بخرم|خرید کن|میخوام بخرم|می‌خوام بخرم)/;
    // REMOVE patterns
    const removeRe = /(حذف|بردار|پاک|خارج|درا?ور|نمی‌?خوام|نخوا)/;
    // CHECKOUT patterns
    const checkoutRe = /(نهایی|پرداخت|چک اوت|checkout|تسویه|ثبت سفارش|تموم کن|تمام کن)/;
    // QUANTITY UPDATE
    const qtyUpRe = /(زیاد کن|اضافه\s*کن.*تعداد|بیشتر کن)/;
    const qtyDownRe = /(کم کن|کمتر کن)/;

    if (checkoutRe.test(norm) && cartItems.length > 0) {
      handleTransactionalCheckout();
      return;
    }
    if (removeRe.test(norm) && (refNum || cartItems.length >= 1)) {
      handleTransactionalCartRemove(refNum);
      return;
    }
    if (addRe.test(norm) && refNum && refNum <= lastRecommendedProducts.length) {
      handleTransactionalCartAdd(refNum, qty);
      return;
    }
    if (qtyUpRe.test(norm) && (refNum || cartItems.length === 1)) {
      handleTransactionalQuantityUpdate(refNum, qty, +qty);
      return;
    }
    if (qtyDownRe.test(norm) && (refNum || cartItems.length === 1)) {
      handleTransactionalQuantityUpdate(refNum, qty, -qty);
      return;
    }

    // ── Everything else: one agent call, the model picks the tool ──
    const isFirstMessage = messages.filter(m => m.role === 'user').length === 0;
    await callUnifiedAgent(content, trimHistoryForAgent(messages), isFirstMessage);
  }, [
    cartItems, lastRecommendedProducts, messages,
    handleFinalizePurchase, updateCurrentBasket, handleAddToCart,
    handleTransactionalCartAdd, handleTransactionalCartAddByName,
    handleTransactionalCartRemove, handleTransactionalQuantityUpdate,
    handleTransactionalCheckout, handleSaveProduct,
    globalAddresses, isOTPVerified, setShowOTPModal, setOtpContext,
  ]);

  // ── Execute cart actions returned by cart_manipulation agent (batched) ──
  const executeCartActions = useCallback((actions: any[]) => {
    updateCurrentBasket(s => {
      let newCartItems = [...s.cartItems];

      for (const action of actions) {
        switch (action.type) {
          case 'add': {
            const idx = action.product_index;
            if (idx && idx >= 1 && idx <= lastRecommendedProducts.length) {
              const product = lastRecommendedProducts[idx - 1];
              const qty = action.quantity || 1;
              const existing = newCartItems.find(item => item.id === product.id);
              if (existing) {
                newCartItems = newCartItems.map(item =>
                  item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
                );
              } else {
                newCartItems = [...newCartItems, { ...product, quantity: qty }];
              }
            }
            break;
          }
          case 'remove': {
            const pid = action.product_id;
            if (pid) {
              newCartItems = newCartItems.filter(item => item.id !== pid);
            }
            break;
          }
          case 'update_quantity': {
            const pid = action.product_id;
            const qty = action.quantity || 1;
            if (pid) {
              if (qty < 1) {
                newCartItems = newCartItems.filter(item => item.id !== pid);
              } else {
                newCartItems = newCartItems.map(item =>
                  item.id === pid ? { ...item, quantity: qty } : item
                );
              }
            }
            break;
          }
          case 'replace': {
            if (action.remove_product_id) {
              newCartItems = newCartItems.filter(item => item.id !== action.remove_product_id);
            }
            const addIdx = action.add_product_index;
            if (addIdx && addIdx >= 1 && addIdx <= lastRecommendedProducts.length) {
              const product = lastRecommendedProducts[addIdx - 1];
              const existing = newCartItems.find(item => item.id === product.id);
              if (existing) {
                newCartItems = newCartItems.map(item =>
                  item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
              } else {
                newCartItems = [...newCartItems, { ...product, quantity: 1 }];
              }
            }
            break;
          }
        }
      }

      return { ...s, cartItems: newCartItems };
    });
    setIsCartOpen(true);
  }, [lastRecommendedProducts, updateCurrentBasket, setIsCartOpen]);

  // ── Single unified agent call: search / details / cart tools, model decides ──
  const callUnifiedAgent = useCallback(async (
    content: string,
    conversationHistory: { role: string; content: string }[],
    isFirstMessage: boolean = false,
  ) => {
    try {
      const body: any = {
        messages: [...conversationHistory, { role: 'user', content }],
        mode: 'agentic',
        is_first_message: isFirstMessage,
        store_id: storeId,
        cart_context: {
          items: cartItems.map(item => ({
            id: item.id, name: item.name, price: item.price, quantity: item.quantity,
          })),
          total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        },
        products_context: lastRecommendedProducts.slice(0, 6).map(p => ({
          id: p.id, name: p.name, price: p.price, brand: p.merchant?.name, rating: p.rating,
        })),
      };

      const { data, error } = await invokeWithTimeout('shift-agent', body);
      if (error) throw new Error(error.message);

      const actions = data?.cart_actions || [];
      const needsClarification = data?.needs_clarification || false;
      const clarificationOptions = data?.clarification_options || [];

      if (actions.length > 0 || needsClarification) {
        if (actions.length > 0 && !needsClarification) executeCartActions(actions);

        const quickReplies = needsClarification && clarificationOptions.length > 0
          ? clarificationOptions.map((opt: string, i: number) => ({
              id: `clarify-${i}`, label: opt, type: 'custom' as QuickReplyType, action: `clarify_${i}`,
            }))
          : undefined;

        const cartMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data?.content || 'عملیات انجام شد.',
          quickReplies,
          timestamp: new Date(),
        };
        updateCurrentBasket(s => ({ ...s, messages: [...s.messages, cartMessage], isProcessing: false }));
        return;
      }

      const responseContent = data?.content || 'متأسفانه مشکلی پیش اومد. دوباره امتحان کن.';
      const dbProducts = data?.products || [];
      const mappedProducts: Product[] = dbProducts.map(mapDbProduct);

      if (mappedProducts.length > 0) {
        updateCurrentBasket(s => ({ ...s, lastRecommendedProducts: mappedProducts }));
        setBaskets(prev => prev.map(b => {
          if (b.id !== activeBasketId) return b;
          if (!b.title.startsWith('سبد جدید')) return b;
          const smartName = extractSmartName(content, mappedProducts);
          return { ...b, title: smartName };
        }));
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent + (mappedProducts.length > 0 ? '\n\nبرای اضافه کردن به سبد، بگو «محصول شماره X رو اضافه کن»' : ''),
        products: mappedProducts.length > 0 ? mappedProducts : undefined,
        productIndexStart: mappedProducts.length > 0 ? 1 : undefined,
        quickReplies: mappedProducts.length > 0 ? [
          { id: 'more', label: '🔍 نتایج بیشتر', type: 'custom' as QuickReplyType, action: 'more_results' },
        ] : undefined,
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, assistantMessage], isProcessing: false }));
    } catch (err) {
      console.error('Failed to call agent:', err);
      const fallbackMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'پاسخ‌گویی بیشتر از حد معمول طول کشید. لطفاً دوباره امتحان کن. 🙏',
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, fallbackMessage], isProcessing: false }));
    }
  }, [cartItems, lastRecommendedProducts, executeCartActions, updateCurrentBasket, setBaskets, activeBasketId, storeId]);

  // ── sendMessageToBasket: targets an explicit basket ID ──
  const sendMessageToBasket = useCallback(async (targetBasketId: string, content: string) => {
    const updateTarget = (updater: (prev: BasketState) => BasketState) => {
      setBasketStates(prev => {
        const current = prev[targetBasketId] || createDefaultBasketState();
        return { ...prev, [targetBasketId]: updater(current) };
      });
    };

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    updateTarget(s => ({ ...s, messages: [...s.messages, userMessage], isProcessing: true }));

    try {
      const { data, error } = await invokeWithTimeout('shift-agent', {
        messages: [{ role: 'user', content }], mode: 'agentic', is_first_message: true, store_id: storeId,
      });

      if (error) throw new Error(error.message);

      const responseContent = data?.content || 'متأسفانه مشکلی پیش اومد. دوباره امتحان کن.';
      const dbProducts = data?.products || [];
      const mappedProducts: Product[] = dbProducts.map(mapDbProduct);

      if (mappedProducts.length > 0) {
        updateTarget(s => ({ ...s, lastRecommendedProducts: mappedProducts }));
        setBaskets(prev => prev.map(b => {
          if (b.id !== targetBasketId) return b;
          if (!b.title.startsWith('سبد جدید')) return b;
          const smartName = extractSmartName(content, mappedProducts);
          return { ...b, title: smartName };
        }));
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent + (mappedProducts.length > 0 ? '\n\nبرای اضافه کردن به سبد، بگو «محصول شماره X رو اضافه کن»' : ''),
        products: mappedProducts.length > 0 ? mappedProducts : undefined,
        productIndexStart: mappedProducts.length > 0 ? 1 : undefined,
        quickReplies: mappedProducts.length > 0 ? [
          { id: 'more', label: '🔍 نتایج بیشتر', type: 'custom' as QuickReplyType, action: 'more_results' },
        ] : undefined,
        timestamp: new Date(),
      };
      updateTarget(s => ({ ...s, messages: [...s.messages, assistantMessage], isProcessing: false }));
    } catch (err) {
      console.error('Failed to call agent:', err);
      const fallbackMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'متأسفانه در حال حاضر سرویس جستجو در دسترس نیست. لطفاً دوباره تلاش کنید. 🙏',
        timestamp: new Date(),
      };
      updateTarget(s => ({ ...s, messages: [...s.messages, fallbackMessage], isProcessing: false }));
    }
  }, [setBasketStates, setBaskets, storeId]);

  const handleMoreResults = useCallback(() => {
    handleSendMessage('نتایج بیشتر نشون بده');
  }, [handleSendMessage]);

  return {
    handleSendMessage,
    sendMessageToBasket,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleCompare,
    handleInlineProductDetails,
    handleSaveProduct,
    handleMoreResults,
  };
};
