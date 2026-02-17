import { useState, useCallback, useEffect, useRef } from "react";
import { Sidebar, Basket, SavedItem } from "@/components/gpt-commerce/Sidebar";
import { ChatInterface } from "@/components/gpt-commerce/ChatInterface";
import { RightPanel } from "@/components/gpt-commerce/RightPanel";
import { AccountPanel } from "@/components/gpt-commerce/AccountPanel";
import { CheckoutModalLocalized } from "@/components/CheckoutModalLocalized";
import { SuccessScreenLocalized } from "@/components/SuccessScreenLocalized";
import { OTPModal } from "@/components/gpt-commerce/OTPModal";
import { LanguageProvider } from "@/i18n/LanguageContext";
import {
  ChatMessage,
  CartItem,
  Product,
  mockProducts,
  initialMessages,
  mockOrders,
  mockAddresses,
  paymentOptions,
  AgenticState,
  QuickReply,
  PaymentMethod,
  DeliveryAddress,
  calculateOrderSummary,
  toPersianNumber,
} from "@/data/gptCommerceData";
import { checkoutModes, upsellProducts, couponTiers } from "@/data/checkoutModes";

// ========== PER-BASKET STATE ==========
interface BasketState {
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

const createDefaultBasketState = (): BasketState => ({
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
  checkoutAddresses: [...mockAddresses],
  isOTPVerified: false,
  isNewUser: false,
});

// localStorage keys
const BASKETS_STORAGE_KEY = 'flowcart-baskets';
const ACTIVE_BASKET_KEY = 'flowcart-active-basket';
const BASKET_STATES_KEY = 'flowcart-basket-states';
// Global addresses (account-level)
const GLOBAL_ADDRESSES_KEY = 'flowcart-global-addresses';

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
      // Rehydrate Date objects in messages
      for (const key of Object.keys(parsed)) {
        const bs = parsed[key];
        if (bs.messages) {
          bs.messages = bs.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
        }
      }
      return parsed;
    }
  } catch (e) { console.error('Failed to load basket states:', e); }
  return {};
};

const getInitialGlobalAddresses = (): DeliveryAddress[] => {
  try {
    const stored = localStorage.getItem(GLOBAL_ADDRESSES_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) { console.error('Failed to load global addresses:', e); }
  return [...mockAddresses];
};

const GPTCommerceContent = () => {
  // === BASKET MANAGEMENT ===
  const [baskets, setBaskets] = useState<Basket[]>(() => getInitialBaskets());
  const [activeBasketId, setActiveBasketId] = useState<string>(() => getInitialActiveBasketId());
  
  // Per-basket state storage
  const [basketStates, setBasketStates] = useState<Record<string, BasketState>>(() => getInitialBasketStates());

  // Global addresses (account-level, available to all baskets)
  const [globalAddresses, setGlobalAddresses] = useState<DeliveryAddress[]>(() => getInitialGlobalAddresses());

  // Get or create state for current basket
  const getCurrentBasketState = useCallback((): BasketState => {
    return basketStates[activeBasketId] || createDefaultBasketState();
  }, [basketStates, activeBasketId]);

  // Current basket state (derived)
  const currentState = getCurrentBasketState();

  // Active state accessors
  const messages = currentState.messages;
  const cartItems = currentState.cartItems;
  const agenticState = currentState.agenticState;
  const selectedAddressId = currentState.selectedAddressId;
  const selectedShippingByMerchant = currentState.selectedShippingByMerchant;
  const lastRecommendedProducts = currentState.lastRecommendedProducts;
  const isProcessing = currentState.isProcessing;
  const hasStartedChat = currentState.hasStartedChat;
  const checkoutAddresses = currentState.checkoutAddresses;
  const isOTPVerified = currentState.isOTPVerified;
  const isNewUser = currentState.isNewUser;

  // Helper to update current basket state
  const updateCurrentBasket = useCallback((updater: (prev: BasketState) => BasketState) => {
    setBasketStates(prev => {
      const current = prev[activeBasketId] || createDefaultBasketState();
      return { ...prev, [activeBasketId]: updater(current) };
    });
  }, [activeBasketId]);

  // UI-only state (not per-basket)
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState('active-cart');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);

  // Persist baskets
  useEffect(() => {
    try { localStorage.setItem(BASKETS_STORAGE_KEY, JSON.stringify(baskets)); } catch (e) { console.error(e); }
  }, [baskets]);

  // Persist active basket ID
  useEffect(() => {
    try { localStorage.setItem(ACTIVE_BASKET_KEY, activeBasketId); } catch (e) { console.error(e); }
  }, [activeBasketId]);

  // Persist basket states
  useEffect(() => {
    try { localStorage.setItem(BASKET_STATES_KEY, JSON.stringify(basketStates)); } catch (e) { console.error(e); }
  }, [basketStates]);

  // Persist global addresses
  useEffect(() => {
    try { localStorage.setItem(GLOBAL_ADDRESSES_KEY, JSON.stringify(globalAddresses)); } catch (e) { console.error(e); }
  }, [globalAddresses]);

  // Initialize state for basket-1 if not exists
  useEffect(() => {
    if (!basketStates[activeBasketId]) {
      setBasketStates(prev => ({
        ...prev,
        [activeBasketId]: createDefaultBasketState(),
      }));
    }
  }, [activeBasketId, basketStates]);

  // Open cart when chat starts
  useEffect(() => {
    if (hasStartedChat) {
      setIsCartOpen(true);
    }
  }, [hasStartedChat]);

  const handleStartChat = useCallback(() => {
    updateCurrentBasket(s => ({ ...s, hasStartedChat: true }));
  }, [updateCurrentBasket]);

  // Build merchant shipping from cart items
  const getMerchantShipping = useCallback(() => {
    const merchantIds = [...new Set(cartItems.map(item => item.merchant.id))];
    return merchantIds.map(merchantId => {
      const merchant = cartItems.find(item => item.merchant.id === merchantId)?.merchant;
      return {
        merchant: merchant!,
        methods: [
          { id: 'standard', label: 'ارسال عادی', deliveryWindow: '۲ تا ۷ روز کاری', priceLabel: '۵۵٬۰۰۰ تومان', isDefault: true },
          { id: 'express', label: 'ارسال اکسپرس', deliveryWindow: '۲ تا ۴ روز کاری', priceLabel: '۸۵٬۰۰۰ تومان', isDefault: false },
          { id: 'courier', label: 'ارسال با پیک', deliveryWindow: 'امروز', priceLabel: 'پس کرایه', isDefault: false },
        ],
      };
    });
  }, [cartItems]);

  // Auto-select default shipping
  useEffect(() => {
    if (agenticState.step !== 'address-confirmation') return;
    const merchantShipping = getMerchantShipping();
    const needsUpdate = merchantShipping.some(ms => !selectedShippingByMerchant[ms.merchant.id]);
    if (!needsUpdate) return;

    updateCurrentBasket(s => {
      const next = { ...s.selectedShippingByMerchant };
      merchantShipping.forEach(ms => {
        if (!next[ms.merchant.id]) {
          const def = ms.methods.find(m => m.isDefault) || ms.methods[0];
          if (def) next[ms.merchant.id] = def.id;
        }
      });
      return { ...s, selectedShippingByMerchant: next };
    });
  }, [agenticState.step, getMerchantShipping, selectedShippingByMerchant, updateCurrentBasket]);

  // Parse "add product number X" commands
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

  // Handle quick reply
  const handleQuickReply = useCallback((reply: QuickReply) => {
    if (reply.type === 'confirm-cart') {
      if (!isOTPVerified) {
        setShowOTPModal(true);
        return;
      }
      const addressMessage: ChatMessage = {
        id: `addr-${Date.now()}`,
        role: 'assistant',
        content: 'آدرس و نحوه ارسال را انتخاب کنید:',
        addressShipping: {
          mode: isNewUser ? 'new' : 'existing',
          addresses: isNewUser ? [] : globalAddresses,
          shippingMethods: [],
        },
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({
        ...s,
        messages: [...s.messages, addressMessage],
        agenticState: {
          ...s.agenticState,
          step: 'address-confirmation',
          ...((!isNewUser && globalAddresses[0]) ? {
            selectedAddress: globalAddresses[0],
            isLoggedIn: true,
            hasStoredCheckoutDetails: true,
          } : {}),
        },
        selectedAddressId: (!isNewUser && globalAddresses[0]) ? globalAddresses[0].id : null,
        selectedShippingByMerchant: {},
      }));
    } else if (reply.type === 'add-more') {
      const moreMessage: ChatMessage = {
        id: `more-${Date.now()}`,
        role: 'assistant',
        content: 'باشه! بگو دنبال چی می‌گردی تا پیداش کنم.',
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({
        ...s,
        messages: [...s.messages, moreMessage],
        agenticState: { ...s.agenticState, step: 'idle' },
      }));
    } else if (reply.type === 'track-order') {
      const trackMessage: ChatMessage = {
        id: `track-${Date.now()}`,
        role: 'assistant',
        content: `سفارش ${agenticState.orderId} در حال پردازش هست و تا ۲ روز آینده به دستت می‌رسه! 📦`,
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({
        ...s,
        messages: [...s.messages, trackMessage],
      }));
    }
  }, [agenticState.orderId, globalAddresses, isNewUser, isOTPVerified, updateCurrentBasket]);

  // Handle OTP verification
  const handleOTPVerified = useCallback((newUser: boolean) => {
    setShowOTPModal(false);
    const addressMessage: ChatMessage = {
      id: `addr-${Date.now()}`,
      role: 'assistant',
      content: 'آدرس و نحوه ارسال را انتخاب کنید:',
      addressShipping: {
        mode: newUser ? 'new' : 'existing',
        addresses: newUser ? [] : globalAddresses,
        shippingMethods: [],
      },
      timestamp: new Date(),
    };
    updateCurrentBasket(s => ({
      ...s,
      isOTPVerified: true,
      isNewUser: newUser,
      messages: [...s.messages, addressMessage],
      agenticState: {
        ...s.agenticState,
        step: 'address-confirmation',
        isLoggedIn: true,
        ...((!newUser && globalAddresses[0]) ? {
          selectedAddress: globalAddresses[0],
          hasStoredCheckoutDetails: true,
        } : {}),
      },
      selectedAddressId: (!newUser && globalAddresses[0]) ? globalAddresses[0].id : null,
      selectedShippingByMerchant: {},
    }));
  }, [globalAddresses, updateCurrentBasket]);

  // Handle address selection
  const handleAddressSelect = useCallback((addressId: string) => {
    const selectedAddr = globalAddresses.find(a => a.id === addressId);
    updateCurrentBasket(s => ({
      ...s,
      selectedAddressId: addressId,
      agenticState: selectedAddr ? { ...s.agenticState, selectedAddress: selectedAddr } : s.agenticState,
    }));
  }, [globalAddresses, updateCurrentBasket]);

  // Handle shipping selection
  const handleSelectShipping = useCallback((merchantId: string, shippingId: string) => {
    updateCurrentBasket(s => ({
      ...s,
      selectedShippingByMerchant: { ...s.selectedShippingByMerchant, [merchantId]: shippingId },
    }));
  }, [updateCurrentBasket]);

  // Handle address confirmation
  const handleAddressConfirm = useCallback(() => {
    const merchantShipping = getMerchantShipping();
    const allSelected = merchantShipping.every(ms => selectedShippingByMerchant[ms.merchant.id]);
    if (!allSelected) return;

    const paymentMessage: ChatMessage = {
      id: `payment-${Date.now()}`,
      role: 'assistant',
      content: `✅ آدرس و نحوه ارسال تأیید شد\n\nحالا روش پرداخت رو انتخاب کن:`,
      paymentOptions: paymentOptions,
      timestamp: new Date(),
    };
    updateCurrentBasket(s => ({
      ...s,
      messages: [...s.messages, paymentMessage],
      agenticState: { ...s.agenticState, step: 'payment-selection' },
    }));
  }, [selectedShippingByMerchant, getMerchantShipping, updateCurrentBasket]);

  const handleAddNewAddress = useCallback((addr: Omit<DeliveryAddress, "id">) => {
    const id = `addr-${Date.now()}`;
    const created: DeliveryAddress = { id, ...addr, recipientName: addr.recipientName || '', phone: addr.phone || '' };

    // Add to global addresses
    setGlobalAddresses(prev => [created, ...prev]);

    updateCurrentBasket(s => {
      // Update address shipping message in chat
      const msgs = [...s.messages];
      const lastIdx = [...msgs].reverse().findIndex(m => !!m.addressShipping);
      if (lastIdx !== -1) {
        const idx = msgs.length - 1 - lastIdx;
        const target = msgs[idx];
        if (target.addressShipping) {
          const existing = target.addressShipping.addresses ?? [];
          msgs[idx] = {
            ...target,
            addressShipping: {
              ...target.addressShipping,
              addresses: [created, ...existing.filter(a => a.id !== created.id)],
            },
          };
        }
      }
      return {
        ...s,
        messages: msgs,
        selectedAddressId: id,
        agenticState: { ...s.agenticState, selectedAddress: created, hasStoredCheckoutDetails: true },
      };
    });
  }, [updateCurrentBasket]);

  // Handle payment selection
  const handlePaymentSelect = useCallback((paymentId: string) => {
    updateCurrentBasket(s => {
      const processingMessage: ChatMessage = {
        id: `processing-${Date.now()}`,
        role: 'assistant',
        content: 'ممنون! 🙏 داریم پرداخت رو پردازش می‌کنیم...',
        timestamp: new Date(),
      };
      return {
        ...s,
        isProcessing: true,
        messages: [...s.messages, processingMessage],
        agenticState: { ...s.agenticState, selectedPayment: paymentId as PaymentMethod, step: 'processing-payment' },
      };
    });

    setTimeout(() => {
      const orderId = `FLC-${Date.now().toString().slice(-6)}`;
      const successMessage: ChatMessage = {
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: `سفارشت با موفقیت ثبت شد! 🎉\n\nشماره سفارش: ${orderId}\n\nمی‌تونی از همین‌جا سفارشت رو پیگیری کنی یا توی پنل کاربریت ببینی.`,
        quickReplies: [
          { id: 'track', label: '📦 پیگیری سفارش', type: 'track-order' },
          { id: 'modify', label: '✏️ ویرایش آدرس', type: 'modify-address' },
          { id: 'invoice', label: '🧾 مشاهده فاکتور', type: 'view-invoice' },
        ],
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({
        ...s,
        messages: [...s.messages, successMessage],
        agenticState: { ...s.agenticState, step: 'order-complete', orderId },
        cartItems: [],
        isProcessing: false,
      }));
    }, 2000);
  }, [updateCurrentBasket]);

  // Handle finalize purchase
  const handleFinalizePurchase = useCallback(() => {
    if (!hasStartedChat) {
      updateCurrentBasket(s => ({ ...s, hasStartedChat: true }));
    }
    if (cartItems.length === 0) {
      const emptyMessage: ChatMessage = {
        id: `empty-${Date.now()}`,
        role: 'assistant',
        content: 'سبد خریدت خالیه! اول یه محصول به سبد اضافه کن.',
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, emptyMessage] }));
      return;
    }
    const orderSummary = calculateOrderSummary(cartItems);
    const confirmMessage: ChatMessage = {
      id: `confirm-${Date.now()}`,
      role: 'assistant',
      content: 'باشه بذار یه نگاه به سبد خریدت بندازیم:',
      orderSummary: orderSummary,
      quickReplies: [
        { id: 'yes', label: '✅ بله، تأیید می‌کنم', type: 'confirm-cart' },
        { id: 'no', label: '➕ نه، محصول بیشتر می‌خوام', type: 'add-more' },
      ],
      timestamp: new Date(),
    };
    updateCurrentBasket(s => ({
      ...s,
      messages: [...s.messages, confirmMessage],
      agenticState: { ...s.agenticState, step: 'cart-confirmation' },
    }));
  }, [cartItems, hasStartedChat, updateCurrentBasket]);

  const handleSendMessage = useCallback((content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    updateCurrentBasket(s => ({ ...s, messages: [...s.messages, userMessage], isProcessing: true }));

    setTimeout(() => {
      let responseContent = '';
      let products: Product[] | undefined;
      let ctaButton: ChatMessage['ctaButton'] | undefined;
      let quickReplies: QuickReply[] | undefined;

      const selectedNumber = parseProductSelection(content);
      const isDirectPayment = content.includes('پرداخت مستقیم') && (content.includes('بخر') || content.includes('خرید'));
      const isBuyAndSend = !isDirectPayment && (content.includes('بخر') || content.includes('بخرید')) &&
                          (content.includes('خانه') || content.includes('بفرست') || content.includes('ارسال'));

      if (selectedNumber && lastRecommendedProducts.length >= selectedNumber) {
        const selectedProduct = lastRecommendedProducts[selectedNumber - 1];

        // Add to cart in basket state
        updateCurrentBasket(s => {
          const existing = s.cartItems.find(item => item.id === selectedProduct.id);
          const newCart = existing
            ? s.cartItems.map(item => item.id === selectedProduct.id ? { ...item, quantity: item.quantity + 1 } : item)
            : [...s.cartItems, { ...selectedProduct, quantity: 1 }];
          return { ...s, cartItems: newCart };
        });

        if (isDirectPayment) {
          if (!agenticState.isLoggedIn) {
            responseContent = 'برای خرید مستقیم، اول باید وارد حسابت بشی. 🔐';
            const assistantMessage: ChatMessage = { id: `assistant-${Date.now()}`, role: 'assistant', content: responseContent, timestamp: new Date() };
            updateCurrentBasket(s => ({ ...s, messages: [...s.messages, assistantMessage], isProcessing: false }));
            return;
          }
          const addedMessage: ChatMessage = {
            id: `added-${Date.now()}`,
            role: 'assistant',
            content: `${selectedProduct.name} به سبدت اضافه شد! ✅\n\nداریم سفارشت رو با پرداخت مستقیم پردازش می‌کنیم...`,
            timestamp: new Date(),
          };
          updateCurrentBasket(s => ({ ...s, messages: [...s.messages, addedMessage] }));
          setTimeout(() => {
            const orderId = `FLC-${Date.now().toString().slice(-6)}`;
            const successMessage: ChatMessage = {
              id: `success-${Date.now()}`,
              role: 'assistant',
              content: `سفارشت با موفقیت ثبت شد! 🎉\n\nشماره سفارش: ${orderId}\n📍 آدرس: ${globalAddresses[0]?.fullAddress || ''}\n💳 پرداخت: درگاه مستقیم\n\nمی‌تونی از همین‌جا سفارشت رو پیگیری کنی.`,
              quickReplies: [
                { id: 'track', label: '📦 پیگیری سفارش', type: 'track-order' },
                { id: 'modify', label: '✏️ ویرایش آدرس', type: 'modify-address' },
                { id: 'invoice', label: '🧾 مشاهده فاکتور', type: 'view-invoice' },
              ],
              timestamp: new Date(),
            };
            updateCurrentBasket(s => ({
              ...s,
              messages: [...s.messages, successMessage],
              agenticState: { ...s.agenticState, step: 'order-complete', orderId, selectedPayment: 'gateway' },
              cartItems: [],
              isProcessing: false,
            }));
          }, 2000);
          updateCurrentBasket(s => ({ ...s, isProcessing: false }));
          return;
        }

        if (isBuyAndSend) {
          if (!agenticState.isLoggedIn) {
            responseContent = 'برای خرید سریع، اول باید وارد حسابت بشی. 🔐';
            const assistantMessage: ChatMessage = { id: `assistant-${Date.now()}`, role: 'assistant', content: responseContent, timestamp: new Date() };
            updateCurrentBasket(s => ({ ...s, messages: [...s.messages, assistantMessage], isProcessing: false }));
            return;
          }
          const addedMessage: ChatMessage = {
            id: `added-${Date.now()}`,
            role: 'assistant',
            content: `${selectedProduct.name} به سبدت اضافه شد! ✅\n\n📍 آدرس تحویل: ${globalAddresses[0]?.fullAddress || ''}\n\nحالا روش پرداخت رو انتخاب کن:`,
            paymentOptions: paymentOptions,
            timestamp: new Date(),
          };
          updateCurrentBasket(s => ({
            ...s,
            messages: [...s.messages, addedMessage],
            agenticState: { ...s.agenticState, step: 'payment-selection' },
            isProcessing: false,
          }));
          return;
        }

        // Default - product added
        responseContent = `${selectedProduct.name} به سبدت اضافه شد! ✅\n\nمحصول دیگه‌ای می‌خوای یا خرید رو نهایی کنیم؟\nمی‌تونی از سبد خریدت تعداد و نوع محصول رو تغییر بدی.`;
        ctaButton = { label: 'نهایی کردن خرید', action: 'finalize', disabled: false };

        // Deactivate previous CTAs
        updateCurrentBasket(s => ({
          ...s,
          messages: s.messages.map(msg =>
            msg.ctaButton
              ? { ...msg, ctaButton: undefined, content: msg.content.split('\n')[0] + '\n\n«سبد خرید به‌روزرسانی شد»' }
              : msg
          ),
          agenticState: { ...s.agenticState, step: 'product-added' },
        }));
      } else if (content.includes('نهایی') || content.includes('انجام بده') || content.includes('تموم')) {
        handleFinalizePurchase();
        updateCurrentBasket(s => ({ ...s, isProcessing: false }));
        return;
      } else if (content.includes('خرید') && content.includes('انجام')) {
        if (cartItems.length > 0) {
          handleFinalizePurchase();
          updateCurrentBasket(s => ({ ...s, isProcessing: false }));
          return;
        } else {
          responseContent = 'سبد خریدت خالیه! اول یه چیزی به سبد اضافه کن.';
        }
      } else if (content.includes('هدفون') || content.includes('ایرپاد') || content.includes('می‌خوام') || content.includes('میخوام')) {
        responseContent = 'این محصولات رو پیدا کردم که فکر می‌کنم بهت می‌خوره:\n\nبرای اضافه کردن به سبد، بگو «محصول شماره X رو اضافه کن»';
        products = mockProducts.filter(p => p.name.includes('هدفون') || p.name.includes('ایرپاد'));
        updateCurrentBasket(s => ({ ...s, lastRecommendedProducts: products! }));
      } else if (content.includes('مقایسه')) {
        responseContent = 'برای مقایسه، محصولات مورد نظرت رو به سبد اضافه کن یا بگو کدوم‌ها رو می‌خوای مقایسه کنم.';
      } else if (content.includes('پیگیری') || content.includes('سفارش')) {
        if (mockOrders.length > 0) {
          responseContent = `سفارش ${mockOrders[0].id} ارسال شده و تا فردا به دستت می‌رسه! 📦`;
        } else {
          responseContent = 'سفارش فعالی نداری. می‌خوای یه خرید جدید شروع کنیم؟';
        }
      } else {
        responseContent = 'بگو دنبال چی می‌گردی تا بهترین گزینه‌ها رو پیدا کنم! می‌تونی بگی مثلاً:\n• هدفون بی‌سیم می‌خوام\n• گوشی با قیمت مناسب\n• لپ‌تاپ برای کار\n\nیا شماره محصول رو بگو تا به سبدت اضافه کنم.';
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        products,
        productIndexStart: products ? 1 : undefined,
        ctaButton,
        quickReplies,
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, assistantMessage], isProcessing: false }));
    }, 1500);
  }, [cartItems.length, lastRecommendedProducts, agenticState, handleFinalizePurchase, updateCurrentBasket, globalAddresses]);

  const handleAddToCart = useCallback((product: Product) => {
    updateCurrentBasket(s => {
      const existing = s.cartItems.find(item => item.id === product.id);
      const newCart = existing
        ? s.cartItems.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...s.cartItems, { ...product, quantity: 1 }];

      // Deactivate previous CTAs
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
  }, [updateCurrentBasket]);

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

  const handleCheckout = useCallback(() => {
    if (cartItems.length > 0) setShowCheckout(true);
  }, [cartItems.length]);

  const handleCheckoutSuccess = useCallback(() => {
    setShowCheckout(false);
    setShowSuccess(true);
    updateCurrentBasket(s => ({ ...s, cartItems: [] }));
  }, [updateCurrentBasket]);

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false);
    const postPurchaseMessage: ChatMessage = {
      id: `post-${Date.now()}`,
      role: 'assistant',
      content: 'خرید با موفقیت انجام شد 🎉\nمی‌خوای پیگیری سفارش رو انجام بدم؟',
      timestamp: new Date(),
    };
    updateCurrentBasket(s => ({ ...s, messages: [...s.messages, postPurchaseMessage] }));
  }, [updateCurrentBasket]);

  // === BASKET MANAGEMENT ===
  const handleCreateBasket = useCallback(() => {
    const existingNewBaskets = baskets.filter(b => b.title.startsWith('سبد جدید') && !b.isSaved);
    let newTitle = 'سبد جدید';
    if (existingNewBaskets.length > 0) {
      newTitle = `سبد جدید ${toPersianNumber(existingNewBaskets.length + 1)}`;
    }
    const newBasket: Basket = {
      id: `basket-${Date.now()}`,
      title: newTitle,
      itemCount: 0,
      lastActivity: 'الان',
      savedItems: [],
      isSaved: false,
    };
    setBaskets(prev => [newBasket, ...prev]);
    setActiveBasketId(newBasket.id);
    // Create fresh isolated state for new basket
    setBasketStates(prev => ({
      ...prev,
      [newBasket.id]: createDefaultBasketState(),
    }));
  }, [baskets]);

  const handleDeleteBasket = useCallback((basketId: string) => {
    setBaskets(prev => prev.filter(b => b.id !== basketId));
    setBasketStates(prev => {
      const next = { ...prev };
      delete next[basketId];
      return next;
    });
    if (basketId === activeBasketId) {
      const remaining = baskets.filter(b => b.id !== basketId && !b.isSaved);
      if (remaining.length > 0) {
        setActiveBasketId(remaining[0].id);
      } else {
        // Create new basket
        const newBasket: Basket = {
          id: `basket-${Date.now()}`,
          title: 'سبد جدید',
          itemCount: 0,
          lastActivity: 'الان',
          savedItems: [],
          isSaved: false,
        };
        setBaskets(prev => [...prev.filter(b => b.id !== basketId), newBasket]);
        setActiveBasketId(newBasket.id);
        setBasketStates(prev => {
          const next = { ...prev };
          delete next[basketId];
          next[newBasket.id] = createDefaultBasketState();
          return next;
        });
      }
    }
  }, [baskets, activeBasketId]);

  const handleMergeBasket = useCallback((sourceId: string, targetId: string) => {
    setBasketStates(prev => {
      const sourceState = prev[sourceId] || createDefaultBasketState();
      const targetState = prev[targetId] || createDefaultBasketState();
      // Merge cart items
      const mergedCart = [...targetState.cartItems];
      sourceState.cartItems.forEach(item => {
        const existing = mergedCart.find(i => i.id === item.id);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          mergedCart.push({ ...item });
        }
      });
      const next = { ...prev };
      next[targetId] = { ...targetState, cartItems: mergedCart };
      delete next[sourceId];
      return next;
    });
    setBaskets(prev => {
      const source = prev.find(b => b.id === sourceId);
      const target = prev.find(b => b.id === targetId);
      if (!source || !target) return prev;
      const mergedSavedItems = [...target.savedItems, ...source.savedItems];
      return prev
        .filter(b => b.id !== sourceId)
        .map(b => b.id === targetId ? { ...b, savedItems: mergedSavedItems, itemCount: b.itemCount + source.itemCount } : b);
    });
    setActiveBasketId(targetId);
  }, []);

  const handleSaveBasket = useCallback((basketId: string) => {
    setBaskets(prev => prev.map(b => b.id === basketId ? { ...b, isSaved: true } : b));
    const remaining = baskets.filter(b => b.id !== basketId && !b.isSaved);
    if (remaining.length > 0) {
      setActiveBasketId(remaining[0].id);
    } else {
      const newBasket: Basket = {
        id: `basket-${Date.now()}`,
        title: 'سبد جدید',
        itemCount: 0,
        lastActivity: 'الان',
        savedItems: [],
        isSaved: false,
      };
      setBaskets(prev => [newBasket, ...prev]);
      setActiveBasketId(newBasket.id);
      setBasketStates(prev => ({ ...prev, [newBasket.id]: createDefaultBasketState() }));
    }
  }, [baskets]);

  const handleResumeBasket = useCallback((basketId: string) => {
    setBaskets(prev => prev.map(b => b.id === basketId ? { ...b, isSaved: false } : b));
    setActiveBasketId(basketId);
  }, []);

  const handleBasketSelect = useCallback((basketId: string) => {
    // Simply switch - state is already stored in basketStates[basketId]
    setActiveBasketId(basketId);
    setActiveSection('active-cart');
  }, []);

  const handleRemoveSavedItem = useCallback((basketId: string, itemId: string) => {
    setBaskets(prev => prev.map(b =>
      b.id === basketId ? { ...b, savedItems: b.savedItems.filter(i => i.id !== itemId) } : b
    ));
  }, []);

  const handleTransferToCart = useCallback((basketId: string, itemId: string) => {
    const basket = baskets.find(b => b.id === basketId);
    const item = basket?.savedItems.find(i => i.id === itemId);
    if (!item) return;
    const product = mockProducts.find(p => p.id === item.productId);
    if (product) {
      updateCurrentBasket(s => {
        const existing = s.cartItems.find(i => i.id === product.id);
        return {
          ...s,
          cartItems: existing
            ? s.cartItems.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
            : [...s.cartItems, { ...product, quantity: 1 }],
        };
      });
    }
    handleRemoveSavedItem(basketId, itemId);
  }, [baskets, handleRemoveSavedItem, updateCurrentBasket]);

  const handleSaveProduct = useCallback((product: Product) => {
    setBaskets(prev => prev.map(b => {
      if (b.id !== activeBasketId) return b;
      const alreadySaved = b.savedItems.some(i => i.productId === product.id);
      if (alreadySaved) {
        return { ...b, savedItems: b.savedItems.filter(i => i.productId !== product.id) };
      }
      const newSavedItem: SavedItem = {
        id: `saved-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      };
      return { ...b, savedItems: [...b.savedItems, newSavedItem] };
    }));
  }, [activeBasketId]);

  // Update basket item count when cart changes
  useEffect(() => {
    setBaskets(prev => prev.map(b =>
      b.id === activeBasketId ? { ...b, itemCount: cartItems.length } : b
    ));
  }, [cartItems.length, activeBasketId]);

  // === ACCOUNT-LEVEL HANDLERS ===
  const handleAccountAddAddress = useCallback((addr: Omit<DeliveryAddress, "id">) => {
    const id = `addr-${Date.now()}`;
    const created: DeliveryAddress = { id, ...addr };
    setGlobalAddresses(prev => [created, ...prev]);
  }, []);

  const handleAccountDeleteAddress = useCallback((addressId: string) => {
    setGlobalAddresses(prev => prev.filter(a => a.id !== addressId));
  }, []);

  const handleAccountUpdateAddress = useCallback((address: DeliveryAddress) => {
    setGlobalAddresses(prev => prev.map(a => a.id === address.id ? address : a));
  }, []);

  // Get address IDs currently in use by active baskets
  const activeAddressIds = Object.values(basketStates)
    .map(s => s.selectedAddressId)
    .filter((id): id is string => !!id);

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const checkoutCartItems = cartItems.map((item) => ({
    id: parseInt(item.id.replace('p', '')),
    name: item.name,
    price: item.price / 100,
    originalPrice: item.originalPrice ? item.originalPrice / 100 : undefined,
    quantity: item.quantity,
    image: item.image,
    inStock: item.inStock,
  }));

  const currentBasket = baskets.find(b => b.id === activeBasketId);
  const savedProductIds = currentBasket?.savedItems.map(i => i.productId) || [];

  // Show account panel when section is 'account' or 'orders'
  const showAccountPanel = activeSection === 'account' || activeSection === 'orders';

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {hasStartedChat && (
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          cartItemCount={cartItems.length}
          activeOrderCount={mockOrders.length}
          baskets={baskets}
          activeBasketId={activeBasketId}
          onBasketSelect={handleBasketSelect}
          onCreateBasket={handleCreateBasket}
          onDeleteBasket={handleDeleteBasket}
          onMergeBasket={handleMergeBasket}
          onRemoveSavedItem={handleRemoveSavedItem}
          onTransferToCart={handleTransferToCart}
          onSaveBasket={handleSaveBasket}
          onResumeBasket={handleResumeBasket}
        />
      )}

      {showAccountPanel ? (
        <AccountPanel
          onBack={() => setActiveSection('active-cart')}
          addresses={globalAddresses}
          onAddAddress={handleAccountAddAddress}
          onDeleteAddress={handleAccountDeleteAddress}
          onUpdateAddress={handleAccountUpdateAddress}
          activeAddressIds={activeAddressIds}
          initialTab={activeSection === 'orders' ? 'orders' : 'profile'}
        />
      ) : (
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onAddToCart={handleAddToCart}
          onCompare={handleCompare}
          onSaveProduct={handleSaveProduct}
          cartItems={cartItems}
          isProcessing={isProcessing}
          onCheckout={handleCheckout}
          hasStartedChat={hasStartedChat}
          onStartChat={handleStartChat}
          isCartOpen={isCartOpen}
          onSignIn={handleCheckout}
          savedProductIds={savedProductIds}
          onInlineProductDetails={handleInlineProductDetails}
          onQuickReply={handleQuickReply}
          onFinalizePurchase={handleFinalizePurchase}
          onAddressConfirm={handleAddressConfirm}
          onAddressSelect={handleAddressSelect}
          selectedAddressId={selectedAddressId}
          merchantShipping={getMerchantShipping()}
          selectedShippingByMerchant={selectedShippingByMerchant}
          onSelectShipping={handleSelectShipping}
          onAddNewAddress={handleAddNewAddress}
          onPaymentSelect={handlePaymentSelect}
          agenticState={agenticState}
        />
      )}

      <RightPanel
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        onAddToCart={handleAddToCart}
        isOpen={isCartOpen}
        onToggle={() => setIsCartOpen(!isCartOpen)}
        onAICheckout={handleFinalizePurchase}
        showAICheckout={!hasStartedChat}
      />

      <CheckoutModalLocalized
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        total={totalPrice / 100}
        onSuccess={handleCheckoutSuccess}
        mode="cross-market-retargeting"
        modeConfig={checkoutModes[0]}
        cartItems={checkoutCartItems}
        upsellProducts={upsellProducts}
        couponTiers={couponTiers}
      />

      <SuccessScreenLocalized
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        orderId={`FLC-${Date.now().toString().slice(-6)}`}
      />

      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerified={handleOTPVerified}
      />
    </div>
  );
};

const GPTCommerce = () => {
  return (
    <LanguageProvider defaultLanguage="fa">
      <GPTCommerceContent />
    </LanguageProvider>
  );
};

export default GPTCommerce;
