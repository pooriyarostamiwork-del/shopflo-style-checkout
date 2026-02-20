import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ChatMessage,
  CartItem,
  Product,
  DeliveryAddress,
  paymentOptions,
  merchants,
} from "@/data/gptCommerceData";
import { Basket } from "@/components/gpt-commerce/Sidebar";
import { BasketState } from "./useBasketState";

interface UseAgentMessagesProps {
  updateCurrentBasket: (updater: (prev: BasketState) => BasketState) => void;
  setBaskets: React.Dispatch<React.SetStateAction<Basket[]>>;
  activeBasketId: string;
  globalAddresses: DeliveryAddress[];
  isOTPVerified: boolean;
  handleFinalizePurchase: () => void;
  setIsCartOpen: (v: boolean) => void;
  setShowOTPModal: (v: boolean) => void;
  // Current basket derived state
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
  };
};

const parseProductSelection = (content: string): number | null => {
  const persianNumbers: { [key: string]: number } = {
    '۱': 1, '۲': 2, '۳': 3, '۴': 4, '۵': 5, '۶': 6,
    'یک': 1, 'دو': 2, 'سه': 3, 'چهار': 4, 'پنج': 5, 'شش': 6,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  };
  const patterns = [
    /محصول\s*(شماره\s*)?(\d|۱|۲|۳|۴|۵|۶|یک|دو|سه|چهار|پنج|شش)/,
    /شماره\s*(\d|۱|۲|۳|۴|۵|۶)/,
    /اضافه.*(\d|۱|۲|۳|۴|۵|۶)/,
    /#(\d|۱|۲|۳|۴|۵|۶)/,
  ];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const numStr = match[match.length - 1];
      return persianNumbers[numStr] || parseInt(numStr);
    }
  }
  return null;
};

export const useAgentMessages = ({
  updateCurrentBasket,
  setBaskets,
  activeBasketId,
  globalAddresses,
  isOTPVerified,
  handleFinalizePurchase,
  setIsCartOpen,
  setShowOTPModal,
  cartItems,
  messages,
  lastRecommendedProducts,
}: UseAgentMessagesProps) => {

  const handleAddToCart = useCallback((product: Product) => {
    updateCurrentBasket(s => {
      const existing = s.cartItems.find(item => item.id === product.id);
      const newCart = existing
        ? s.cartItems.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...s.cartItems, { ...product, quantity: 1 }];

      const updatedMessages = s.messages.map(msg =>
        msg.ctaButton
          ? { ...msg, ctaButton: undefined, content: msg.content.split('\n')[0] + '\n\n«سبد خرید به‌روزرسانی شد»' }
          : msg
      );

      const confirmMessage: ChatMessage = {
        id: `confirm-${Date.now()}`,
        role: 'assistant',
        content: `${product.name} به سبدت اضافه شد! ✅\n\nمحصول دیگه‌ای می‌خوای یا خرید رو نهایی کنیم؟\nمی‌تونی از سبد خریدت تعداد و نوع محصول رو تغییر بدی.`,
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

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    updateCurrentBasket(s => ({ ...s, messages: [...s.messages, userMessage], isProcessing: true }));

    // Order inquiry shortcut
    if (content.includes('سفارش') && (content.includes('پیگیری') || content.includes('کجاست') || content.includes('وضعیت'))) {
      const orderInquiryMessage: ChatMessage = {
        id: `order-inquiry-${Date.now()}`,
        role: 'assistant',
        content: 'برای مشاهده و پیگیری سفارش‌هایت، به بخش «سفارش‌ها» مراجعه کن.',
        ctaButton: { label: '📦 مشاهده سفارش‌ها', action: 'view-orders', disabled: false },
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, orderInquiryMessage], isProcessing: false }));
      return;
    }

    const selectedNumber = parseProductSelection(content);
    const isDirectPayment = content.includes('پرداخت مستقیم') && (content.includes('بخر') || content.includes('خرید'));
    const isBuyAndSend = !isDirectPayment && (content.includes('بخر') || content.includes('بخرید')) &&
                        (content.includes('خانه') || content.includes('بفرست') || content.includes('ارسال'));

    if (selectedNumber && lastRecommendedProducts.length >= selectedNumber) {
      const selectedProduct = lastRecommendedProducts[selectedNumber - 1];

      updateCurrentBasket(s => {
        const existing = s.cartItems.find(item => item.id === selectedProduct.id);
        const newCart = existing
          ? s.cartItems.map(item => item.id === selectedProduct.id ? { ...item, quantity: item.quantity + 1 } : item)
          : [...s.cartItems, { ...selectedProduct, quantity: 1 }];
        return { ...s, cartItems: newCart };
      });

      if (isDirectPayment) {
        if (!isOTPVerified) {
          setShowOTPModal(true);
          updateCurrentBasket(s => ({ ...s, isProcessing: false }));
          return;
        }
        const addedMessage: ChatMessage = {
          id: `added-${Date.now()}`, role: 'assistant',
          content: `${selectedProduct.name} به سبدت اضافه شد! ✅\n\nداریم سفارشت رو با پرداخت مستقیم پردازش می‌کنیم...`,
          timestamp: new Date(),
        };
        updateCurrentBasket(s => ({ ...s, messages: [...s.messages, addedMessage] }));
        setTimeout(() => {
          const orderId = `FLC-${Date.now().toString().slice(-6)}`;
          const successMessage: ChatMessage = {
            id: `success-${Date.now()}`, role: 'assistant',
            content: `سفارشت با موفقیت ثبت شد! 🎉\n\nشماره سفارش: ${orderId}\n📍 آدرس: ${globalAddresses[0]?.fullAddress || ''}\n💳 پرداخت: درگاه مستقیم`,
            quickReplies: [
              { id: 'track', label: '📦 پیگیری سفارش', type: 'track-order' },
              { id: 'continue', label: '🛍️ ادامه خرید', type: 'add-more' },
            ],
            timestamp: new Date(),
          };
          updateCurrentBasket(s => ({
            ...s, messages: [...s.messages, successMessage],
            agenticState: { ...s.agenticState, step: 'order-complete', orderId, selectedPayment: 'gateway' },
            cartItems: [], isProcessing: false,
          }));
        }, 2000);
        updateCurrentBasket(s => ({ ...s, isProcessing: false }));
        return;
      }

      if (isBuyAndSend) {
        if (!isOTPVerified) {
          setShowOTPModal(true);
          updateCurrentBasket(s => ({ ...s, isProcessing: false }));
          return;
        }
        const addedMessage: ChatMessage = {
          id: `added-${Date.now()}`, role: 'assistant',
          content: `${selectedProduct.name} به سبدت اضافه شد! ✅\n\n📍 آدرس تحویل: ${globalAddresses[0]?.fullAddress || ''}\n\nحالا روش پرداخت رو انتخاب کن:`,
          paymentOptions: paymentOptions, timestamp: new Date(),
        };
        updateCurrentBasket(s => ({
          ...s, messages: [...s.messages, addedMessage],
          agenticState: { ...s.agenticState, step: 'payment-selection' }, isProcessing: false,
        }));
        return;
      }

      updateCurrentBasket(s => ({
        ...s,
        messages: s.messages.map(msg =>
          msg.ctaButton ? { ...msg, ctaButton: undefined, content: msg.content.split('\n')[0] + '\n\n«سبد خرید به‌روزرسانی شد»' } : msg
        ),
        agenticState: { ...s.agenticState, step: 'product-added' },
      }));
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`, role: 'assistant',
        content: `${selectedProduct.name} به سبدت اضافه شد! ✅\n\nمحصول دیگه‌ای می‌خوای یا خرید رو نهایی کنیم؟`,
        ctaButton: { label: 'نهایی کردن خرید', action: 'finalize', disabled: false },
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, assistantMessage], isProcessing: false }));
      return;
    }

    if (content.includes('نهایی') || content.includes('انجام بده') || content.includes('تموم')) {
      handleFinalizePurchase();
      updateCurrentBasket(s => ({ ...s, isProcessing: false }));
      return;
    }
    if (content.includes('خرید') && content.includes('انجام')) {
      if (cartItems.length > 0) {
        handleFinalizePurchase();
        updateCurrentBasket(s => ({ ...s, isProcessing: false }));
        return;
      }
    }

    // === AI-POWERED SEARCH ===
    try {
      const conversationHistory = messages
        .filter(m => m.role === 'user' || (m.role === 'assistant' && !m.products))
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));
      conversationHistory.push({ role: 'user', content });

      const { data, error } = await supabase.functions.invoke('gpt-commerce-agent', {
        body: { messages: conversationHistory },
      });

      if (error) throw new Error(error.message);

      const responseContent = data?.content || 'متأسفانه مشکلی پیش اومد. دوباره امتحان کن.';
      const dbProducts = data?.products || [];
      const mappedProducts: Product[] = dbProducts.map(mapDbProduct);

      if (mappedProducts.length > 0) {
        updateCurrentBasket(s => ({ ...s, lastRecommendedProducts: mappedProducts }));
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent + (mappedProducts.length > 0 ? '\n\nبرای اضافه کردن به سبد، بگو «محصول شماره X رو اضافه کن»' : ''),
        products: mappedProducts.length > 0 ? mappedProducts : undefined,
        productIndexStart: mappedProducts.length > 0 ? 1 : undefined,
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
  }, [
    cartItems.length, lastRecommendedProducts, messages,
    handleFinalizePurchase, updateCurrentBasket,
    globalAddresses, isOTPVerified, setShowOTPModal,
  ]);

  return {
    handleSendMessage,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleCompare,
    handleInlineProductDetails,
    handleSaveProduct,
  };
};
