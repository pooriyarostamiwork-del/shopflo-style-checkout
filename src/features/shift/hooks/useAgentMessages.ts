import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  const merchantMap: Record<string, typeof merchants[0]> = {
    m1: merchants[0], m2: merchants[1], m3: merchants[2], m4: merchants[3], m5: merchants[4],
  };
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    price: dbProduct.price,
    originalPrice: dbProduct.original_price || undefined,
    image: dbProduct.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    imageUrls: dbProduct.image_urls?.length > 0 ? dbProduct.image_urls : undefined,
    description: dbProduct.description || undefined,
    specs: dbProduct.specs?.length > 0 ? dbProduct.specs : undefined,
    reviewsSummary: dbProduct.reviews_summary || undefined,
    merchant: merchantMap[dbProduct.merchant_id] || merchants[0],
    rating: Number(dbProduct.rating) || 4.0,
    fastDelivery: dbProduct.fast_delivery || false,
    returnGuarantee: dbProduct.return_guarantee || true,
    inStock: dbProduct.in_stock !== false,
    colorOptions: dbProduct.color_options?.length > 0 ? dbProduct.color_options : undefined,
  };
};

// ── Classify intent via edge function ──
async function classifyIntent(
  message: string,
  conversationHistory: { role: string; content: string }[],
  context: {
    has_cart_items: boolean;
    last_recommended_count: number;
    last_recommended_names: string[];
    checkout_step: string;
  }
): Promise<IntentClassification> {
  try {
    const { data, error } = await supabase.functions.invoke('classify-intent', {
      body: { message, conversation_history: conversationHistory, context },
    });
    if (error) throw new Error(error.message);
    return data as IntentClassification;
  } catch (err) {
    console.error('Intent classification failed, falling back to discovery:', err);
    return {
      intent_type: 'discovery',
      intent_subtype: 'product_search',
      entities: {},
      confidence: 0.3,
    };
  }
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

    // Build conversation history for classifier (lightweight, no products)
    const conversationHistory = messages
      .filter(m => m.role === 'user' || (m.role === 'assistant' && !m.products))
      .slice(-6)
      .map(m => ({ role: m.role, content: m.content.slice(0, 200) }));

    // Build context for classifier
    const classifierContext = {
      has_cart_items: cartItems.length > 0,
      last_recommended_count: lastRecommendedProducts.length,
      last_recommended_names: lastRecommendedProducts.slice(0, 6).map(p => p.name),
      checkout_step: 'idle',
    };

    // Determine if this is the first real message (for greeting control)
    const isFirstMessage = messages.filter(m => m.role === 'user').length === 0;

    // ── Step 1: Classify intent ──
    const intent = await classifyIntent(content, conversationHistory, classifierContext);
    console.log('Intent classified:', JSON.stringify(intent));

    // ── Step 2: Route based on intent ──
    switch (intent.intent_type) {
      case 'transactional': {
        // New subtypes that always route to cart_manipulation agent
        if (['cart_batch_add', 'cart_replace', 'cart_cheapest'].includes(intent.intent_subtype)) {
          await callCartManipulationAgent(content);
          return;
        }

        const quantity = intent.entities.quantity || 1;

        switch (intent.intent_subtype) {
          case 'cart_add':
            if (intent.entities.product_ref) {
              handleTransactionalCartAdd(intent.entities.product_ref, quantity);
            } else {
              // No ref — ambiguous, route to cart_manipulation agent
              await callCartManipulationAgent(content);
            }
            return;

          case 'cart_add_by_name':
            if (intent.entities.product_name) {
              handleTransactionalCartAddByName(intent.entities.product_name, quantity);
            } else {
              await callAgent(content, trimHistoryForAgent(messages), 'discovery', undefined, isFirstMessage);
            }
            return;

          case 'cart_remove':
            if (intent.entities.product_ref || intent.entities.product_name || cartItems.length === 1) {
              handleTransactionalCartRemove(intent.entities.product_ref, intent.entities.product_name);
            } else {
              await callCartManipulationAgent(content);
            }
            return;

          case 'quantity_update':
            if (intent.entities.product_ref || cartItems.length === 1) {
              handleTransactionalQuantityUpdate(
                intent.entities.product_ref,
                intent.entities.quantity || 1,
                intent.entities.delta
              );
            } else {
              await callCartManipulationAgent(content);
            }
            return;

          case 'checkout_initiate':
            handleTransactionalCheckout();
            return;

          case 'checkout_direct':
            if (intent.entities.product_ref && lastRecommendedProducts.length >= intent.entities.product_ref) {
              const product = lastRecommendedProducts[intent.entities.product_ref - 1];
              handleAddToCart(product, quantity);
              setTimeout(() => {
                handleFinalizePurchase();
                updateCurrentBasket(s => ({ ...s, isProcessing: false }));
              }, 500);
            } else {
              await callCartManipulationAgent(content);
            }
            return;

          case 'save_for_later':
            if (intent.entities.product_ref && lastRecommendedProducts.length >= intent.entities.product_ref) {
              const product = lastRecommendedProducts[intent.entities.product_ref - 1];
              handleSaveProduct(product);
              const msg: ChatMessage = {
                id: `saved-${Date.now()}`, role: 'assistant',
                content: `${product.name} ذخیره شد! ✅`,
                timestamp: new Date(),
              };
              updateCurrentBasket(s => ({ ...s, messages: [...s.messages, msg], isProcessing: false }));
            } else {
              const msg: ChatMessage = {
                id: `err-${Date.now()}`, role: 'assistant',
                content: 'کدوم محصول رو می‌خوای ذخیره کنی؟ شماره محصول رو بگو.',
                timestamp: new Date(),
              };
              updateCurrentBasket(s => ({ ...s, messages: [...s.messages, msg], isProcessing: false }));
            }
            return;

          case 'order_status': {
            const msg: ChatMessage = {
              id: `order-inquiry-${Date.now()}`, role: 'assistant',
              content: 'برای مشاهده و پیگیری سفارش‌هایت، به بخش «سفارش‌ها» مراجعه کن.',
              ctaButton: { label: '📦 مشاهده سفارش‌ها', action: 'view-orders', disabled: false },
              timestamp: new Date(),
            };
            updateCurrentBasket(s => ({ ...s, messages: [...s.messages, msg], isProcessing: false }));
            return;
          }

          default:
            await callAgent(content, trimHistoryForAgent(messages), 'discovery', undefined, isFirstMessage);
            return;
        }
      }

      case 'comparison': {
        const refs = intent.entities.product_refs || [];
        const productsContext = refs
          .filter(r => r >= 1 && r <= lastRecommendedProducts.length)
          .map(r => lastRecommendedProducts[r - 1]);

        if (productsContext.length >= 2) {
          await callAgent(content, trimHistoryForAgent(messages), 'comparison', productsContext, isFirstMessage);
        } else {
          await callAgent(content, trimHistoryForAgent(messages), 'discovery', undefined, isFirstMessage);
        }
        return;
      }

      case 'info_retrieval':
        await callAgent(content, trimHistoryForAgent(messages), 'info_retrieval', undefined, isFirstMessage);
        return;

      case 'conversational':
        await callAgent(content, trimHistoryForAgent(messages), 'conversational', undefined, isFirstMessage);
        return;

      case 'discovery':
      default:
        await callAgent(content, trimHistoryForAgent(messages), 'discovery', undefined, isFirstMessage);
        return;
    }
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

  // ── Call cart_manipulation agent (minimal context, no conversation history) ──
  const callCartManipulationAgent = useCallback(async (content: string) => {
    try {
      const body: any = {
        messages: [{ role: 'user', content }],
        mode: 'cart_manipulation',
        is_first_message: false,
        cart_context: {
          items: cartItems.map(item => ({
            id: item.id, name: item.name, price: item.price,
            quantity: item.quantity, merchant: item.merchant?.name,
          })),
          total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        },
        products_context: lastRecommendedProducts.map(p => ({
          id: p.id, name: p.name, price: p.price,
          brand: p.merchant?.name, rating: p.rating,
        })),
      };

      const { data, error } = await supabase.functions.invoke('shift-agent', { body });
      if (error) throw new Error(error.message);

      const actions = data?.cart_actions || [];
      const responseContent = data?.content || 'عملیات انجام شد.';
      const needsClarification = data?.needs_clarification || false;
      const clarificationOptions = data?.clarification_options || [];

      // Execute cart actions if any (single batched update)
      if (actions.length > 0 && !needsClarification) {
        executeCartActions(actions);
      }

      // Build quick replies from clarification options
      const quickReplies = needsClarification && clarificationOptions.length > 0
        ? clarificationOptions.map((opt: string, i: number) => ({
            id: `clarify-${i}`, label: opt, type: 'custom' as QuickReplyType, action: `clarify_${i}`,
          }))
        : undefined;

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        quickReplies,
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, assistantMessage], isProcessing: false }));
    } catch (err) {
      console.error('Cart manipulation agent failed:', err);
      const fallbackMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: 'متأسفانه نتونستم درخواستت رو پردازش کنم. دوباره امتحان کن. 🙏',
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, fallbackMessage], isProcessing: false }));
    }
  }, [cartItems, lastRecommendedProducts, executeCartActions, updateCurrentBasket]);

  // ── Call the gpt-commerce-agent with a specific mode ──
  const callAgent = useCallback(async (
    content: string,
    conversationHistory: { role: string; content: string }[],
    mode: string,
    productsContext?: Product[],
    isFirstMessage: boolean = false,
  ) => {
    try {
      const body: any = {
        messages: [...conversationHistory, { role: 'user', content }],
        mode,
        is_first_message: isFirstMessage,
      };
      if (productsContext) {
        body.products_context = productsContext.map(p => ({
          name: p.name,
          price: p.price,
          brand: p.merchant?.name,
          rating: p.rating,
          specs: p.specs,
          description: p.description,
        }));
      }

      const { data, error } = await supabase.functions.invoke('shift-agent', { body });
      if (error) throw new Error(error.message);

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
        content: 'متأسفانه در حال حاضر سرویس جستجو در دسترس نیست. لطفاً دوباره تلاش کنید. 🙏',
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, fallbackMessage], isProcessing: false }));
    }
  }, [updateCurrentBasket, setBaskets, activeBasketId]);

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
      const { data, error } = await supabase.functions.invoke('shift-agent', {
        body: { messages: [{ role: 'user', content }], mode: 'discovery', is_first_message: true },
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
