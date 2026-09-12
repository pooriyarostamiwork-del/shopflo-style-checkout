import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Clarification,
  ChatMessage,
  CartItem,
  Product,
  DeliveryAddress,
  QuickReplyType,
  paymentOptions,
  merchants,
} from "@/data/petabadData";

const isValidClarification = (value: unknown): value is Clarification => {
  if (!value || typeof value !== 'object') return false;
  const card = value as Clarification;
  const validOptions = (options: unknown) => Array.isArray(options) && options.length >= 2 &&
    options.every(option => Boolean(option && typeof option === 'object' && typeof (option as { label?: unknown }).label === 'string' && (option as { label: string }).label.trim()));
  if (card.kind === 'single') return typeof card.question === 'string' && Boolean(card.question.trim()) && validOptions(card.options);
  return card.kind === 'steps' && Array.isArray(card.steps) && card.steps.length > 0 && card.steps.every(step =>
    typeof step.question === 'string' && Boolean(step.question.trim()) && validOptions(step.options)
  );
};

const invalidAssistantResponse = 'پاسخ کامل دریافت نشد. لطفاً همین پیام را دوباره ارسال کن.';

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
import { Basket } from "@/components/petabad/Sidebar";
import { BasketState, createDefaultBasketState } from "./useBasketState";
import {
  ProductMemory,
  appendGroup,
  ensureProductMemory,
  focusProduct,
  markCommitment,
  resolveById,
  resolveByPosition,
  serializeMemory,
  setFocus,
  unmarkInCart,
} from "./productMemory";
import {
  ShoppingContext,
  ensureShoppingContext,
  mergeGoalSignal,
  serializeShoppingContext,
  updateFromMessage,
} from "./shoppingContext";
import {
  activePetPayload,
  ensurePetMemory,
  rememberBrands,
  rememberFromJourney,
  rememberFromMessage,
  serializePetMemory,
} from "./petMemory";
import type { QuestionJourney } from "@/data/petabadData";
import { decodeJourneyAnswer } from "@/data/petabadData";

const isLiveJourney = (m: ChatMessage) =>
  Boolean(m.journey && (m.journey.status === 'asking' || m.journey.status === 'checking'));

/** Text form of a journey card for the model's history window. */
const journeyAsText = (j: QuestionJourney): string =>
  j.steps
    .map(s => `سؤال: ${s.card.question || s.card.title || ''} — جواب: ${s.answer.trim() || 'فرقی نمی‌کنه'}`)
    .join('\n');

/** Close every live journey card (a normal answer arrived). */
const closeJourneys = (msgs: ChatMessage[]): ChatMessage[] =>
  msgs.some(isLiveJourney)
    ? msgs.map(m => (isLiveJourney(m) ? { ...m, journey: { ...m.journey!, current: null, status: 'done' as const } } : m))
    : msgs;


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
  productMemory: ProductMemory;
  shoppingContext: ShoppingContext;
}

export const mapDbProduct = (dbProduct: any): Product => {
  const specsObj = dbProduct.specs && typeof dbProduct.specs === 'object' && !Array.isArray(dbProduct.specs)
    ? Object.entries(dbProduct.specs).map(([label, value]) => ({ label, value: String(value) }))
    : (Array.isArray(dbProduct.specs) ? dbProduct.specs : undefined);
  return {
    id: dbProduct.id,
    name: dbProduct.name_fa || dbProduct.name,
    price: dbProduct.price,
    originalPrice: dbProduct.original_price || undefined,
    image: dbProduct.image_url || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=300&fit=crop',
    imageUrls: dbProduct.image_urls?.length > 0 ? dbProduct.image_urls : undefined,
    description: dbProduct.description_fa || dbProduct.description || undefined,
    specs: specsObj && specsObj.length > 0 ? specsObj : undefined,
    reviewsSummary: dbProduct.review_count ? `${dbProduct.review_count} نظر` : undefined,
    merchant: merchants[0],
    rating: Number(dbProduct.rating) || 4.0,
    fastDelivery: dbProduct.fast_delivery || false,
    returnGuarantee: dbProduct.return_guarantee ?? true,
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
  // Keep recent turns from BOTH roles (product lists live in structured memory)
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: (m.journey ? journeyAsText(m.journey) : m.content).slice(0, 300) }))
    .filter(m => m.content.trim())
    .slice(-12);
}

// ── Deterministic hints (no model call) ──
const ENUMERATION_RE = /(چیا داری|چی داری|چه (برند|مدل|مارک)|همه(ی)? ?(محصولات|مدل ?ها|گزینه ?ها)?|لیست|چند تا|چندتا|کدوم برند|برند ?های|موجودی)/;
const EXISTENCE_RE = /(داری|دارید|موجوده|موجود هست|هست)\s*\??$/;
const REFERENCE_RE = /(این|اینا|اینها|همون|همین|اون ?ها|اونا|قبلی|همون ?ها|برای این|با این|اولی|اولو|اول|دومی|دوم|سومی|سوم|شماره ?\d)/;
const ORDINALS: Record<string, number> = {
  'اولی': 1, 'اولو': 1, 'اول': 1, 'دومی': 2, 'دوم': 2, 'سومی': 3, 'سوم': 3,
  'چهارمی': 4, 'چهارم': 4, 'پنجمی': 5, 'پنجم': 5, 'ششمی': 6, 'ششم': 6,
};

function buildScopeHint(message: string): string | undefined {
  const t = message.replace(/\u200c/g, " ");
  const hints: string[] = [];
  if (ENUMERATION_RE.test(t)) hints.push("این پیام درخواست شمارش/فهرست کامل است — حتماً catalog_facets را صدا بزن و اعداد را از آن بگیر.");
  else if (EXISTENCE_RE.test(t)) hints.push("این پیام سؤال موجود بودن است — حتماً قبل از هر پاسخ search_products یا catalog_facets را صدا بزن؛ از حافظه پاسخ نده.");
  return hints.length ? hints.join(" ") : undefined;
}

function buildReferenceHint(message: string, memory: ProductMemory): string | undefined {
  if (!REFERENCE_RE.test(message)) return undefined;
  const latest = memory.groups[memory.groups.length - 1]?.productIds ?? [];
  const focus = memory.focus?.productIds?.length ? memory.focus.productIds : latest;
  if (!focus.length) return undefined;

  // «محصول اول/دومی/شماره ۲» points at one concrete product — name it for the model.
  const t = message.replace(/\u200c/g, " ").replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  let ordinal: number | undefined;
  const numMatch = t.match(/(?:شماره|محصول)\s*(\d+)/);
  if (numMatch) ordinal = parseInt(numMatch[1]);
  if (!ordinal) {
    for (const [word, n] of Object.entries(ORDINALS)) {
      if (new RegExp(`(^|\\s)${word}(\\s|$|و|ی|رو|را)`).test(t)) { ordinal = n; break; }
    }
  }
  const namedId = ordinal ? latest[ordinal - 1] : undefined;
  const namedProduct = namedId ? memory.entries[namedId]?.product : undefined;
  if (namedProduct) {
    return `کاربر به «محصول ${ordinal}» از آخرین لیست اشاره کرده؛ منظورش دقیقاً این محصوله: ${namedProduct.name} (id: ${namedProduct.id}). در پاسخ نام همین محصول را بیاور و جواب سؤالش را دربارهٔ همین محصول بده؛ لیست جدید نساز.`;
  }
  return `کاربر با ضمیر به محصولات قبلی اشاره کرده. محصولات مرجع: ${focus.slice(0, 6).join(", ")}. اینها موضوع جدید نیستند مگر صریح گفته شود.`;
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
  productMemory,
  shoppingContext,
}: UseAgentMessagesProps) => {

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

  // ── Main message handler: local fast paths, then ONE unified tool-calling agent ──
  const handleSendMessage = useCallback(async (content: string) => {
    // ── Journey card taps: no user bubble; the card itself records the answer ──
    const journeyTap = decodeJourneyAnswer(content);
    if (journeyTap) {
      const target = messages.find(m => m.id === journeyTap.messageId);
      if (!target?.journey || !isLiveJourney(target)) return;
      const j = target.journey;
      if (journeyTap.redoIndex !== undefined) {
        // Change an earlier answer: reopen that question and forget everything after it.
        const idx = Math.max(0, Math.min(journeyTap.redoIndex, j.steps.length - 1));
        const reopened = j.steps[idx];
        if (!reopened) return;
        const dropped = j.steps.slice(idx).map(st => st.card.id).filter(Boolean) as string[];
        updateCurrentBasket(s => {
          const flow = s.shoppingContext?.questionFlow;
          const nextFlow = flow && typeof flow === 'object'
            ? {
                ...flow,
                asked: (flow.asked || []).filter((id: string) => !dropped.includes(id)),
                answers: Object.fromEntries(Object.entries(flow.answers || {}).filter(([k]) => !dropped.includes(k))),
                pending: reopened.card.id || null,
                done: false,
              }
            : flow;
          return {
            ...s,
            messages: s.messages.map(m => m.id !== target.id ? m : {
              ...m,
              journey: { steps: j.steps.slice(0, idx), current: reopened.card, status: 'asking' as const },
            }),
            shoppingContext: { ...ensureShoppingContext(s.shoppingContext), questionFlow: nextFlow },
          };
        });
        return;
      }
      if (!j.current) return;
      const steps = [...j.steps, { card: j.current, answer: journeyTap.answer }];
      updateCurrentBasket(s => ({
        ...s,
        isProcessing: true,
        messages: s.messages.map(m => m.id !== target.id ? m : {
          ...m, journey: { steps, current: null, status: 'checking' as const },
        }),
        shoppingContext: {
          ...ensureShoppingContext(s.shoppingContext),
          petMemory: rememberFromJourney(ensurePetMemory(s.shoppingContext?.petMemory), steps),
        },
      }));
      await callUnifiedAgent(journeyTap.answer, trimHistoryForAgent(messages), false, target.id);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    updateCurrentBasket(s => ({ ...s, messages: [...s.messages, userMessage], isProcessing: true }));

    // ── Fast paths: deterministic Persian phrasings resolved locally (zero network) ──
    const p2l = (s: string) => s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const norm = p2l(content).trim().toLowerCase();

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

    const addRe = /(اضاف|بذار|بگذار|بریز|بندا[زذ]|به سبد|توی سبد|تو سبد|بخر|بخرم|خرید کن|میخوام بخرم|می‌خوام بخرم)/;
    // Verb-shaped only: informational words that merely CONTAIN these letters
    // (e.g. «خارجیاشون» containing «خارج») must never trigger a cart removal.
    const removeRe = /(حذف\s*(کن|کنش|شون|ش)?|حذفش|بردار|پاکش|پاک\s*کن|از\s*سبد\s*(خارج|بردار|حذف)|درش\s*بیار|در\s*بیار|نمی‌?خوامش|دیگه\s*نمی‌?خوام)/;
    const checkoutRe = /(نهایی|پرداخت|چک اوت|checkout|تسویه|ثبت سفارش|تموم کن|تمام کن)/;
    const qtyUpRe = /(زیاد کن|بیشتر کن)/;
    const qtyDownRe = /(کم کن|کمتر کن)/;
    const ordersRe = /(سفارش‌?ها|سفارشاتم|پیگیری سفارش|کد رهگیری)/;
    // A question is a question: it goes to the assistant, never to a cart shortcut.
    const isQuestion = /[?؟]\s*$/.test(norm)
      || /(کدوم|کدام|چه\s|چیا|چیه|چی\s|آیا|چطور|چقدر|چند|خارجی|داخلی|معرفی|مقایسه)/.test(norm);

    if (checkoutRe.test(norm) && cartItems.length > 0 && !isQuestion) {
      handleTransactionalCheckout();
      return;
    }

    if (ordersRe.test(norm)) {
      const msg: ChatMessage = {
        id: `order-inquiry-${Date.now()}`, role: 'assistant',
        content: 'برای مشاهده و پیگیری سفارش‌هایت، به بخش «سفارش‌ها» مراجعه کن.',
        ctaButton: { label: '📦 مشاهده سفارش‌ها', action: 'view-orders', disabled: false },
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, msg], isProcessing: false }));
      return;
    }
    if (!isQuestion && removeRe.test(norm) && (refNum || cartItems.length >= 1)) {
      handleTransactionalCartRemove(refNum);
      return;
    }
    if (!isQuestion && addRe.test(norm) && refNum && refNum <= lastRecommendedProducts.length) {
      handleTransactionalCartAdd(refNum, qty);
      return;
    }
    if (!isQuestion && qtyUpRe.test(norm) && (refNum || cartItems.length === 1)) {
      handleTransactionalQuantityUpdate(refNum, qty, +qty);
      return;
    }
    if (!isQuestion && qtyDownRe.test(norm) && (refNum || cartItems.length === 1)) {
      handleTransactionalQuantityUpdate(refNum, qty, -qty);
      return;
    }


    // ── Everything else: one agent call, the model picks the tool ──
    const isFirstMessage = messages.filter(m => m.role === 'user').length === 0;
    await callUnifiedAgent(content, trimHistoryForAgent(messages), isFirstMessage);
  }, [
    cartItems, lastRecommendedProducts, messages, updateCurrentBasket,
    handleTransactionalCartAdd, handleTransactionalCartRemove,
    handleTransactionalQuantityUpdate, handleTransactionalCheckout,
  ]);

  // ── Execute cart actions returned by cart_manipulation agent (batched) ──
  const executeCartActions = useCallback((actions: any[]) => {
    updateCurrentBasket(s => {
      let newCartItems = [...s.cartItems];

      const mem = ensureProductMemory(s.productMemory);
      const addedIds: string[] = [];
      const removedIds: string[] = [];

      // Resolve an action target by stable id first, then by badge position
      const resolveTarget = (action: any, indexField = 'product_index'): Product | undefined => {
        if (action.product_id) {
          const byId = resolveById(mem, action.product_id) ||
            lastRecommendedProducts.find(p => p.id === action.product_id);
          if (byId) return byId;
        }
        const idx = action[indexField];
        if (idx && idx >= 1) {
          return resolveByPosition(mem, idx, action.group_id) || lastRecommendedProducts[idx - 1];
        }
        return undefined;
      };

      for (const action of actions) {
        switch (action.type) {
          case 'add': {
            const product = resolveTarget(action);
            if (product) {
              addedIds.push(product.id);
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
            const target = resolveTarget(action);
            const pid = action.product_id || target?.id;
            if (pid) {
              removedIds.push(pid);
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
              removedIds.push(action.remove_product_id);
              newCartItems = newCartItems.filter(item => item.id !== action.remove_product_id);
            }
            const product = resolveTarget({ product_id: action.add_product_id, add_product_index: action.add_product_index, group_id: action.group_id }, 'add_product_index');
            if (product) {
              addedIds.push(product.id);
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

      let nextMemory = mem;
      if (addedIds.length) nextMemory = markCommitment(nextMemory, addedIds, 'inCart');
      if (removedIds.length) nextMemory = unmarkInCart(nextMemory, removedIds);

      return { ...s, cartItems: newCartItems, productMemory: nextMemory };
    });
    setIsCartOpen(true);
  }, [lastRecommendedProducts, updateCurrentBasket, setIsCartOpen]);

  // ── Single unified agent call: search / details / cart tools, model decides ──
  const callUnifiedAgent = useCallback(async (
    content: string,
    conversationHistory: { role: string; content: string }[],
    isFirstMessage: boolean = false,
    journeyMessageId?: string,
  ) => {
    try {
      const mem = ensureProductMemory(productMemory);
      const body: any = {
        messages: [...conversationHistory, { role: 'user', content }],
        mode: 'agentic',
        is_first_message: isFirstMessage,
        cart_context: {
          items: cartItems.map(item => ({
            id: item.id, name: item.name, price: item.price, quantity: item.quantity,
          })),
          total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        },
        // Structured working memory of everything already shown in this conversation
        product_memory: serializeMemory(mem),
        memory_index: mem.groups.map(g => ({
          group_id: g.groupId,
          turn: g.turn,
          query: g.query,
          items: g.productIds
            .map(id => mem.entries[id])
            .filter(Boolean)
            .map(e => ({ position: e.position, id: e.product.id, name: e.product.name, price: e.product.price })),
        })),
        products_context: lastRecommendedProducts.slice(0, 6).map(p => ({
          id: p.id, name: p.name, price: p.price, brand: p.merchant?.name, rating: p.rating,
        })),
      };

      const nextShopping = updateFromMessage(ensureShoppingContext(shoppingContext), content);
      // Pet memory: typed messages teach it directly; journey taps were folded in already.
      nextShopping.petMemory = journeyMessageId
        ? ensurePetMemory(nextShopping.petMemory)
        : rememberFromMessage(ensurePetMemory(nextShopping.petMemory), content);
      const serializedGoal = [serializeShoppingContext(nextShopping), serializePetMemory(nextShopping.petMemory)]
        .filter(Boolean)
        .join('\n');
      if (serializedGoal) body.shopping_context = serializedGoal;
      const petPayload = activePetPayload(nextShopping.petMemory);
      if (petPayload) body.pet_memory = petPayload;
      // Adaptive question flow: echo the server's state so the next question adapts to this answer.
      if (nextShopping.questionFlow) body.question_flow = nextShopping.questionFlow;
      const scopeHint = buildScopeHint(content);
      if (scopeHint) body.scope_hint = scopeHint;
      const referenceHint = buildReferenceHint(content, mem);
      if (referenceHint) body.reference_hint = referenceHint;

      const { data, error } = await invokeWithTimeout('petabad-agent', body);
      if (error) throw new Error(error.message);

      const actions = data?.cart_actions || [];
      const needsClarification = data?.needs_clarification || false;
      const clarificationOptions = data?.clarification_options || [];
      const likedIds: string[] = data?.liked_product_ids || [];
      const rejectedIds: string[] = data?.rejected_product_ids || [];
      const referenceIds: string[] = data?.reference_product_ids || [];

      // ── Commitments + focus the model resolved this turn ──
      const applyMemorySignals = (base: ProductMemory): ProductMemory => {
        let next = base;
        if (likedIds.length) next = markCommitment(next, likedIds, 'liked');
        if (rejectedIds.length) next = markCommitment(next, rejectedIds, 'rejected');
        if (referenceIds.length) next = setFocus(next, referenceIds, next.entries[referenceIds[0]]?.groupId ?? null);
        return next;
      };

      // ── Shopping goal persistence (deterministic + optional GOAL signal) ──
      const goalUpdated = mergeGoalSignal(nextShopping, data?.goal);
      // The flow lives only while the server keeps asking; any other reply ends it.
      goalUpdated.questionFlow =
        data?.response_type === 'clarification' && data?.question_flow ? data.question_flow : undefined;

      // ── Clarification branch: render an interactive card, never a duplicate question ──
      const clarification = data?.clarification;
      if (data?.response_type === 'clarification' && isValidClarification(clarification)) {
        if (data?.question_flow && clarification.kind === 'single') {
          // Journey question: attach to the live card (tap or typed answer) or open a new one.
          updateCurrentBasket(s => {
            const live = s.messages.find(m => m.id === journeyMessageId && isLiveJourney(m))
              || [...s.messages].reverse().find(m => m.role === 'assistant' && isLiveJourney(m));
            let msgs: ChatMessage[];
            let steps = live?.journey?.steps ?? [];
            if (live?.journey) {
              // A typed reply answered the open question — record it as a step.
              if (live.journey.current) steps = [...steps, { card: live.journey.current, answer: content }];
              const journey: QuestionJourney = { steps, current: clarification, status: 'asking' };
              msgs = s.messages.map(m => (m.id === live.id ? { ...m, journey } : m));
            } else {
              msgs = [...s.messages, {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: '',
                journey: { steps: [], current: clarification, status: 'asking' },
                timestamp: new Date(),
              }];
            }
            return {
              ...s,
              messages: msgs,
              shoppingContext: {
                ...goalUpdated,
                petMemory: rememberFromJourney(ensurePetMemory(goalUpdated.petMemory), steps),
              },
              isProcessing: false,
            };
          });
          return;
        }
        const clarifyMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          clarification,
          timestamp: new Date(),
        };
        updateCurrentBasket(s => ({
          ...s,
          messages: [...closeJourneys(s.messages), clarifyMessage],
          shoppingContext: goalUpdated,
          isProcessing: false,
        }));
        return;
      }

      // ── Cart branch ──
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
        updateCurrentBasket(s => ({
          ...s,
          messages: [...closeJourneys(s.messages), cartMessage],
          productMemory: applyMemorySignals(ensureProductMemory(s.productMemory)),
          shoppingContext: goalUpdated,
          isProcessing: false,
        }));
        return;
      }

      // ── Discovery / recall / conversational branch ──
      const responseContent = typeof data?.content === 'string' && data.content.trim()
        ? data.content.trim()
        : invalidAssistantResponse;
      const dbProducts = data?.products || [];
      const mappedProducts: Product[] = dbProducts.map(mapDbProduct);

      const shownBrands: string[] = dbProducts.map((p: any) => String(p.brand || '').trim()).filter(Boolean);
      updateCurrentBasket(s => {
        let nextMemory = applyMemorySignals(ensureProductMemory(s.productMemory));
        if (mappedProducts.length > 0) {
          const turn = s.messages.filter(m => m.role === 'user').length;
          nextMemory = appendGroup(nextMemory, content, mappedProducts, turn);
        }
        return {
          ...s,
          productMemory: nextMemory,
          shoppingContext: {
            ...goalUpdated,
            petMemory: shownBrands.length
              ? rememberBrands(ensurePetMemory(goalUpdated.petMemory), shownBrands)
              : goalUpdated.petMemory,
          },
          ...(mappedProducts.length > 0 ? { lastRecommendedProducts: mappedProducts } : {}),
        };
      });

      if (mappedProducts.length > 0) {
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
        content: responseContent,
        products: mappedProducts.length > 0 ? mappedProducts : undefined,
        productIndexStart: mappedProducts.length > 0 ? 1 : undefined,
        quickReplies: mappedProducts.length > 0 ? [
          { id: 'more', label: '🔍 نتایج بیشتر', type: 'custom' as QuickReplyType, action: 'more_results' },
        ] : undefined,
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...closeJourneys(s.messages), assistantMessage], isProcessing: false }));
    } catch (err) {
      console.error('Failed to call agent:', err);
      const fallbackMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'پاسخ‌گویی بیشتر از حد معمول طول کشید. لطفاً دوباره امتحان کن. 🙏',
        timestamp: new Date(),
      };
      // A journey that was waiting on this call gets its last question back so the shopper can retry.
      const reopen = (m: ChatMessage): ChatMessage => {
        if (m.id !== journeyMessageId || m.journey?.status !== 'checking') return m;
        const steps = [...m.journey.steps];
        const last = steps.pop();
        return { ...m, journey: { steps, current: last?.card ?? null, status: last ? 'asking' : 'abandoned' } };
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages.map(reopen), fallbackMessage], isProcessing: false }));
    }
  }, [cartItems, lastRecommendedProducts, executeCartActions, updateCurrentBasket, setBaskets, activeBasketId, productMemory, shoppingContext]);

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
      const { data, error } = await invokeWithTimeout('petabad-agent', {
        messages: [{ role: 'user', content }], mode: 'agentic', is_first_message: true,
      });

      if (error) throw new Error(error.message);

      const clarification = data?.clarification;
      if (data?.response_type === 'clarification' && isValidClarification(clarification)) {
        const asJourney = Boolean(data?.question_flow) && clarification.kind === 'single';
        const clarifyMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: '',
          ...(asJourney
            ? { journey: { steps: [], current: clarification, status: 'asking' as const } }
            : { clarification }),
          timestamp: new Date(),
        };
        updateTarget(s => ({
          ...s,
          messages: [...s.messages, clarifyMessage],
          shoppingContext: {
            ...ensureShoppingContext(s.shoppingContext),
            questionFlow: data?.question_flow || undefined,
            petMemory: rememberFromMessage(ensurePetMemory(s.shoppingContext?.petMemory), content),
          },
          isProcessing: false,
        }));
        return;
      }

      const responseContent = typeof data?.content === 'string' && data.content.trim()
        ? data.content.trim()
        : invalidAssistantResponse;
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
        content: responseContent,
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
  }, [setBasketStates]);

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
