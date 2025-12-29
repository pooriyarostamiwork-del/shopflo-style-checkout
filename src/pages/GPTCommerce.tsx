import { useState, useCallback, useEffect } from "react";
import { Sidebar, Basket, SavedItem } from "@/components/gpt-commerce/Sidebar";
import { ChatInterface } from "@/components/gpt-commerce/ChatInterface";
import { RightPanel } from "@/components/gpt-commerce/RightPanel";
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
  ShippingMethod,
  calculateOrderSummary,
  toPersianNumber,
} from "@/data/gptCommerceData";
import { checkoutModes, upsellProducts, couponTiers } from "@/data/checkoutModes";

// localStorage key for baskets
const BASKETS_STORAGE_KEY = 'flowcart-baskets';
const ACTIVE_BASKET_KEY = 'flowcart-active-basket';

// Get initial baskets from localStorage or use default
const getInitialBaskets = (): Basket[] => {
  try {
    const stored = localStorage.getItem(BASKETS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load baskets from localStorage:', e);
  }
  return [{ id: 'basket-1', title: 'هدفون‌های بی‌سیم', itemCount: 0, lastActivity: 'الان', savedItems: [] }];
};

const getInitialActiveBasketId = (): string => {
  try {
    const stored = localStorage.getItem(ACTIVE_BASKET_KEY);
    if (stored) return stored;
  } catch (e) {
    console.error('Failed to load active basket from localStorage:', e);
  }
  return 'basket-1';
};

const GPTCommerceContent = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState('active-cart');
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Basket state - persisted to localStorage
  const [baskets, setBaskets] = useState<Basket[]>(() => getInitialBaskets());
  const [activeBasketId, setActiveBasketId] = useState<string>(() => getInitialActiveBasketId());
  
  // Agentic state - default to guest (not logged in for OTP flow demo)
  const [agenticState, setAgenticState] = useState<AgenticState>({
    step: 'idle',
    isLoggedIn: false, // Default: guest user - will be verified via OTP
    hasStoredCheckoutDetails: false,
    selectedAddress: null,
    selectedPayment: null,
    orderId: null,
  });
  
  // Selected address ID + shipping per merchant
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedShippingByMerchant, setSelectedShippingByMerchant] = useState<Record<string, string>>({});

  // Addresses for checkout (mutable in demo; starts with mockAddresses)
  const [checkoutAddresses, setCheckoutAddresses] = useState(() => mockAddresses);

  // Build merchant shipping from cart items with default marking
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

  // Auto-select default shipping method for each merchant when cart changes
  // This aligns visual state with validation state
  useEffect(() => {
    const merchantShipping = getMerchantShipping();
    const newSelections: Record<string, string> = { ...selectedShippingByMerchant };
    let hasChanges = false;
    
    merchantShipping.forEach(ms => {
      if (!newSelections[ms.merchant.id]) {
        const defaultMethod = ms.methods.find(m => m.isDefault) || ms.methods[0];
        if (defaultMethod) {
          newSelections[ms.merchant.id] = defaultMethod.id;
          hasChanges = true;
        }
      }
    });
    
    if (hasChanges) {
      setSelectedShippingByMerchant(newSelections);
    }
  }, [cartItems, getMerchantShipping]);

  // Track recommended products for number reference
  const [lastRecommendedProducts, setLastRecommendedProducts] = useState<Product[]>([]);

  // Persist baskets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BASKETS_STORAGE_KEY, JSON.stringify(baskets));
    } catch (e) {
      console.error('Failed to save baskets to localStorage:', e);
    }
  }, [baskets]);

  // Persist active basket ID to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_BASKET_KEY, activeBasketId);
    } catch (e) {
      console.error('Failed to save active basket ID to localStorage:', e);
    }
  }, [activeBasketId]);

  // Open cart by default when chat has started
  useEffect(() => {
    if (hasStartedChat) {
      setIsCartOpen(true);
    }
  }, [hasStartedChat]);

  const handleStartChat = useCallback(() => {
    setHasStartedChat(true);
  }, []);

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

  // Handle quick reply selection
  const handleQuickReply = useCallback((reply: QuickReply) => {
    if (reply.type === 'confirm-cart') {
      // If user is not OTP verified, show OTP modal first
      if (!isOTPVerified) {
        setShowOTPModal(true);
        return;
      }

      // Verified -> go directly to address + shipping selection
      const addressMessage: ChatMessage = {
        id: `addr-${Date.now()}`,
        role: 'assistant',
        content: 'آدرس و نحوه ارسال را انتخاب کنید:',
        addressShipping: {
          mode: isNewUser ? 'new' : 'existing',
          addresses: isNewUser ? [] : checkoutAddresses,
          shippingMethods: [],
        },
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, addressMessage]);
      setAgenticState((prev) => ({ ...prev, step: 'address-confirmation' }));

      if (!isNewUser && checkoutAddresses[0]) {
        setSelectedAddressId(checkoutAddresses[0].id);
        setAgenticState((prev) => ({
          ...prev,
          selectedAddress: checkoutAddresses[0],
          isLoggedIn: true,
          hasStoredCheckoutDetails: true,
        }));
      }

      // Reset shipping selection when entering this step
      setSelectedShippingByMerchant({});
    } else if (reply.type === 'add-more') {
      const moreMessage: ChatMessage = {
        id: `more-${Date.now()}`,
        role: 'assistant',
        content: 'باشه! بگو دنبال چی می‌گردی تا پیداش کنم.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, moreMessage]);
      setAgenticState(prev => ({ ...prev, step: 'idle' }));
    } else if (reply.type === 'track-order') {
      const trackMessage: ChatMessage = {
        id: `track-${Date.now()}`,
        role: 'assistant',
        content: `سفارش ${agenticState.orderId} در حال پردازش هست و تا ۲ روز آینده به دستت می‌رسه! 📦`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, trackMessage]);
    }
  }, [agenticState.orderId, checkoutAddresses, isNewUser, isOTPVerified]);

  // Handle OTP verification complete
  const handleOTPVerified = useCallback((newUser: boolean) => {
    setShowOTPModal(false);
    setIsOTPVerified(true);
    setIsNewUser(newUser);
    setAgenticState(prev => ({ ...prev, isLoggedIn: true }));

    // After OTP, continue directly to address + shipping (NOT cart confirmation again)
    const addressMessage: ChatMessage = {
      id: `addr-${Date.now()}`,
      role: 'assistant',
      content: 'آدرس و نحوه ارسال را انتخاب کنید:',
      addressShipping: {
        mode: newUser ? 'new' : 'existing',
        addresses: newUser ? [] : checkoutAddresses,
        shippingMethods: [],
      },
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, addressMessage]);
    setAgenticState(prev => ({ ...prev, step: 'address-confirmation' }));

    if (!newUser && checkoutAddresses[0]) {
      setSelectedAddressId(checkoutAddresses[0].id);
      setAgenticState(prev => ({
        ...prev,
        selectedAddress: checkoutAddresses[0],
        hasStoredCheckoutDetails: true,
      }));
    }

    setSelectedShippingByMerchant({});
  }, [checkoutAddresses]);

  // Handle address selection
  const handleAddressSelect = useCallback((addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddr = checkoutAddresses.find(a => a.id === addressId);
    if (selectedAddr) {
      setAgenticState(prev => ({ ...prev, selectedAddress: selectedAddr }));
    }
  }, [checkoutAddresses]);

  // Handle shipping selection per merchant
  const handleSelectShipping = useCallback((merchantId: string, shippingId: string) => {
    setSelectedShippingByMerchant(prev => ({ ...prev, [merchantId]: shippingId }));
  }, []);

  // Handle address confirmation - combined with shipping
  const handleAddressConfirm = useCallback(() => {
    const merchantShipping = getMerchantShipping();
    const allSelected = merchantShipping.every(ms => selectedShippingByMerchant[ms.merchant.id]);
    if (!allSelected) return;

    // Show payment selection with updated confirmation message
    const paymentMessage: ChatMessage = {
      id: `payment-${Date.now()}`,
      role: 'assistant',
      content: `✅ آدرس و نحوه ارسال تأیید شد\n\nحالا روش پرداخت رو انتخاب کن:`,
      paymentOptions: paymentOptions,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, paymentMessage]);
    setAgenticState(prev => ({ ...prev, step: 'payment-selection' }));
  }, [selectedShippingByMerchant, getMerchantShipping]);

  const handleAddNewAddress = useCallback((addr: Omit<typeof mockAddresses[0], "id">) => {
    const id = `addr-${Date.now()}`;
    const created: typeof mockAddresses[0] = { id, ...addr, recipientName: addr.recipientName || '', phone: addr.phone || '' };
    setCheckoutAddresses((prev) => [created, ...prev]);
    setSelectedAddressId(id);
    setAgenticState((prev) => ({ ...prev, selectedAddress: created, hasStoredCheckoutDetails: true }));
  }, []);

  // Handle payment selection
  const handlePaymentSelect = useCallback((paymentId: string) => {
    setAgenticState(prev => ({ ...prev, selectedPayment: paymentId as PaymentMethod }));
    
    // Process payment
    setIsProcessing(true);
    const processingMessage: ChatMessage = {
      id: `processing-${Date.now()}`,
      role: 'assistant',
      content: 'ممنون! 🙏 داریم پرداخت رو پردازش می‌کنیم...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, processingMessage]);
    setAgenticState(prev => ({ ...prev, step: 'processing-payment' }));

    // Simulate payment processing
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
      
      setMessages(prev => [...prev, successMessage]);
      setAgenticState(prev => ({ 
        ...prev, 
        step: 'order-complete',
        orderId,
      }));
      setCartItems([]);
      setIsProcessing(false);
    }, 2000);
  }, []);

  // Handle CTA button click (Finalize Purchase) - also handles first page AI checkout
  const handleFinalizePurchase = useCallback(() => {
    // If on first page (not in chat mode), start chat mode first
    if (!hasStartedChat) {
      setHasStartedChat(true);
    }

    if (cartItems.length === 0) {
      const emptyMessage: ChatMessage = {
        id: `empty-${Date.now()}`,
        role: 'assistant',
        content: 'سبد خریدت خالیه! اول یه محصول به سبد اضافه کن.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, emptyMessage]);
      return;
    }

    if (cartItems.length === 0) {
      const emptyMessage: ChatMessage = {
        id: `empty-${Date.now()}`,
        role: 'assistant',
        content: 'سبد خریدت خالیه! اول یه محصول به سبد اضافه کن.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, emptyMessage]);
      return;
    }

    // Show cart confirmation - this is the entry point from first page CTA
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
    setMessages(prev => [...prev, confirmMessage]);
    setAgenticState(prev => ({ ...prev, step: 'cart-confirmation' }));
  }, [cartItems, hasStartedChat]);

  const handleSendMessage = useCallback((content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    // Simulate AI response
    setTimeout(() => {
      let responseContent = '';
      let products: Product[] | undefined;
      let ctaButton: ChatMessage['ctaButton'] | undefined;
      let quickReplies: QuickReply[] | undefined;

      // Check for product selection by number
      const selectedNumber = parseProductSelection(content);
      
      // Detect direct payment command: "با پرداخت مستقیم بخر و به خانه بفرست"
      const isDirectPayment = content.includes('پرداخت مستقیم') && (content.includes('بخر') || content.includes('خرید'));
      
      // Detect buy and send command: "بخر و به خانه بفرست" (without direct payment)
      const isBuyAndSend = !isDirectPayment && (content.includes('بخر') || content.includes('بخرید')) && 
                          (content.includes('خانه') || content.includes('بفرست') || content.includes('ارسال'));
      
      if (selectedNumber && lastRecommendedProducts.length >= selectedNumber) {
        const selectedProduct = lastRecommendedProducts[selectedNumber - 1];
        
        // Add to cart
        setCartItems((prev) => {
          const existing = prev.find((item) => item.id === selectedProduct.id);
          if (existing) {
            return prev.map((item) =>
              item.id === selectedProduct.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          }
          return [...prev, { ...selectedProduct, quantity: 1 }];
        });

        // Handle direct payment flow - skip to order confirmation
        if (isDirectPayment) {
          if (!agenticState.isLoggedIn) {
            responseContent = 'برای خرید مستقیم، اول باید وارد حسابت بشی. 🔐';
            const assistantMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: responseContent,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setIsProcessing(false);
            return;
          }
          
          // Add product confirmation
          const addedMessage: ChatMessage = {
            id: `added-${Date.now()}`,
            role: 'assistant',
            content: `${selectedProduct.name} به سبدت اضافه شد! ✅\n\nداریم سفارشت رو با پرداخت مستقیم پردازش می‌کنیم...`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, addedMessage]);
          
          // Simulate processing and go directly to order confirmation
          setTimeout(() => {
            const orderId = `FLC-${Date.now().toString().slice(-6)}`;
            
            const successMessage: ChatMessage = {
              id: `success-${Date.now()}`,
              role: 'assistant',
              content: `سفارشت با موفقیت ثبت شد! 🎉\n\nشماره سفارش: ${orderId}\n📍 آدرس: ${mockAddresses[0].fullAddress}\n💳 پرداخت: درگاه مستقیم\n\nمی‌تونی از همین‌جا سفارشت رو پیگیری کنی.`,
              quickReplies: [
                { id: 'track', label: '📦 پیگیری سفارش', type: 'track-order' },
                { id: 'modify', label: '✏️ ویرایش آدرس', type: 'modify-address' },
                { id: 'invoice', label: '🧾 مشاهده فاکتور', type: 'view-invoice' },
              ],
              timestamp: new Date(),
            };
            
            setMessages((prev) => [...prev, successMessage]);
            setAgenticState(prev => ({ 
              ...prev, 
              step: 'order-complete',
              orderId,
              selectedPayment: 'gateway',
            }));
            setCartItems([]);
            setIsProcessing(false);
          }, 2000);
          
          setIsProcessing(false);
          return;
        }
        
        // Handle buy and send flow - skip to payment selection
        if (isBuyAndSend) {
          if (!agenticState.isLoggedIn) {
            responseContent = 'برای خرید سریع، اول باید وارد حسابت بشی. 🔐';
            const assistantMessage: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: responseContent,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setIsProcessing(false);
            return;
          }
          
          // Add product and show payment selection directly
          const addedMessage: ChatMessage = {
            id: `added-${Date.now()}`,
            role: 'assistant',
            content: `${selectedProduct.name} به سبدت اضافه شد! ✅\n\n📍 آدرس تحویل: ${mockAddresses[0].fullAddress}\n\nحالا روش پرداخت رو انتخاب کن:`,
            paymentOptions: paymentOptions,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, addedMessage]);
          setAgenticState(prev => ({ ...prev, step: 'payment-selection' }));
          setIsProcessing(false);
          return;
        }

        // Default flow - product added, deactivate previous CTAs and show new finalize CTA
        responseContent = `${selectedProduct.name} به سبدت اضافه شد! ✅\n\nمحصول دیگه‌ای می‌خوای یا خرید رو نهایی کنیم؟\nمی‌تونی از سبد خریدت تعداد و نوع محصول رو تغییر بدی.`;
        
        ctaButton = {
          label: 'نهایی کردن خرید',
          action: 'finalize',
          disabled: false,
        };
        
        // Deactivate previous CTAs
        setMessages(prev => prev.map(msg => {
          if (msg.ctaButton) {
            return {
              ...msg,
              ctaButton: undefined,
              content: msg.content.split('\n')[0] + '\n\n«سبد خرید به‌روزرسانی شد»'
            };
          }
          return msg;
        }));
        
        setAgenticState(prev => ({ ...prev, step: 'product-added' }));
      }
      // Check for finalize intent
      else if (content.includes('نهایی') || content.includes('انجام بده') || content.includes('تموم')) {
        handleFinalizePurchase();
        setIsProcessing(false);
        return;
      }
      // Check for checkout intent
      else if (content.includes('خرید') && content.includes('انجام')) {
        if (cartItems.length > 0) {
          handleFinalizePurchase();
          setIsProcessing(false);
          return;
        } else {
          responseContent = 'سبد خریدت خالیه! اول یه چیزی به سبد اضافه کن.';
        }
      }
      // Check for product search
      else if (content.includes('هدفون') || content.includes('ایرپاد') || content.includes('می‌خوام') || content.includes('میخوام')) {
        responseContent = 'این محصولات رو پیدا کردم که فکر می‌کنم بهت می‌خوره:\n\nبرای اضافه کردن به سبد، بگو «محصول شماره X رو اضافه کن»';
        products = mockProducts.filter(p => 
          p.name.includes('هدفون') || p.name.includes('ایرپاد')
        );
        setLastRecommendedProducts(products);
      }
      // Check for comparison
      else if (content.includes('مقایسه')) {
        responseContent = 'برای مقایسه، محصولات مورد نظرت رو به سبد اضافه کن یا بگو کدوم‌ها رو می‌خوای مقایسه کنم.';
      }
      // Check for tracking
      else if (content.includes('پیگیری') || content.includes('سفارش')) {
        if (mockOrders.length > 0) {
          responseContent = `سفارش ${mockOrders[0].id} ارسال شده و تا فردا به دستت می‌رسه! 📦`;
        } else {
          responseContent = 'سفارش فعالی نداری. می‌خوای یه خرید جدید شروع کنیم؟';
        }
      }
      // Default response
      else {
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
      setMessages((prev) => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 1500);
  }, [cartItems.length, lastRecommendedProducts, agenticState, handleFinalizePurchase]);

  const handleAddToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    setIsCartOpen(true);

    // Deactivate all previous CTAs and add new message with active CTA
    setMessages((prev) => {
      // Mark all previous CTAs as inactive (replace with update message)
      const updatedMessages = prev.map(msg => {
        if (msg.ctaButton) {
          return {
            ...msg,
            ctaButton: undefined,
            content: msg.content.split('\n')[0] + '\n\n«سبد خرید به‌روزرسانی شد»'
          };
        }
        return msg;
      });
      
      // Add new message with active CTA
      const confirmMessage: ChatMessage = {
        id: `confirm-${Date.now()}`,
        role: 'assistant',
        content: `${product.name} به سبدت اضافه شد! ✅\n\nمحصول دیگه‌ای می‌خوای یا خرید رو نهایی کنیم؟\nمی‌تونی از سبد خریدت تعداد و نوع محصول رو تغییر بدی.`,
        ctaButton: {
          label: 'نهایی کردن خرید',
          action: 'finalize',
          disabled: false,
        },
        timestamp: new Date(),
      };
      
      return [...updatedMessages, confirmMessage];
    });
    
    setAgenticState(prev => ({ ...prev, step: 'product-added' }));
  }, [agenticState.hasStoredCheckoutDetails]);

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      setCartItems((prev) => prev.filter((item) => item.id !== productId));
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const handleRemoveItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const handleCompare = useCallback((product: Product) => {
    const compareMessage: ChatMessage = {
      id: `compare-${Date.now()}`,
      role: 'assistant',
      content: `می‌خوای ${product.name} رو با چی مقایسه کنم؟`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, compareMessage]);
  }, []);

  // Handle inline product details - inject into chat as a message
  const handleInlineProductDetails = useCallback((product: Product) => {
    const detailsMessage: ChatMessage = {
      id: `details-${Date.now()}`,
      role: 'assistant',
      content: `جزئیات کامل محصول ${product.name}:`,
      inlineProduct: product,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, detailsMessage]);
  }, []);

  const handleCheckout = useCallback(() => {
    if (cartItems.length > 0) {
      setShowCheckout(true);
    }
  }, [cartItems.length]);

  const handleCheckoutSuccess = useCallback(() => {
    setShowCheckout(false);
    setShowSuccess(true);
    setCartItems([]);
  }, []);

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false);
    const postPurchaseMessage: ChatMessage = {
      id: `post-${Date.now()}`,
      role: 'assistant',
      content: 'خرید با موفقیت انجام شد 🎉\nمی‌خوای پیگیری سفارش رو انجام بدم؟',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, postPurchaseMessage]);
  }, []);

  // === BASKET MANAGEMENT ===
  const handleCreateBasket = useCallback(() => {
    // Generate unique name
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
    
    // Reset chat for new basket
    setMessages([{
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: 'این یک سبد جدیده. بگو چی می‌خوای بخرم یا مقایسه کنم.',
      timestamp: new Date(),
    }]);
    setCartItems([]);
  }, [baskets]);

  const handleDeleteBasket = useCallback((basketId: string) => {
    setBaskets(prev => prev.filter(b => b.id !== basketId));
    
    // If deleting active basket, switch to first remaining active basket
    if (basketId === activeBasketId) {
      const remaining = baskets.filter(b => b.id !== basketId && !b.isSaved);
      if (remaining.length > 0) {
        setActiveBasketId(remaining[0].id);
      } else {
        // Create a new basket if none remain
        handleCreateBasket();
      }
    }
  }, [baskets, activeBasketId, handleCreateBasket]);

  const handleMergeBasket = useCallback((sourceId: string, targetId: string) => {
    setBaskets(prev => {
      const source = prev.find(b => b.id === sourceId);
      const target = prev.find(b => b.id === targetId);
      if (!source || !target) return prev;
      
      // Merge saved items
      const mergedSavedItems = [...target.savedItems, ...source.savedItems];
      
      return prev
        .filter(b => b.id !== sourceId)
        .map(b => b.id === targetId 
          ? { ...b, savedItems: mergedSavedItems, itemCount: b.itemCount + source.itemCount }
          : b
        );
    });
    
    // Switch to target basket
    setActiveBasketId(targetId);
  }, []);

  const handleSaveBasket = useCallback((basketId: string) => {
    setBaskets(prev => prev.map(b => 
      b.id === basketId ? { ...b, isSaved: true } : b
    ));
    
    // Switch to another active basket or create new one
    const remaining = baskets.filter(b => b.id !== basketId && !b.isSaved);
    if (remaining.length > 0) {
      setActiveBasketId(remaining[0].id);
    } else {
      // Create a new basket
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
      setMessages([{
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: 'این یک سبد جدیده. بگو چی می‌خوای بخرم یا مقایسه کنم.',
        timestamp: new Date(),
      }]);
      setCartItems([]);
    }
  }, [baskets]);

  const handleResumeBasket = useCallback((basketId: string) => {
    setBaskets(prev => prev.map(b => 
      b.id === basketId ? { ...b, isSaved: false } : b
    ));
    setActiveBasketId(basketId);
  }, []);

  const handleBasketSelect = useCallback((basketId: string) => {
    setActiveBasketId(basketId);
  }, []);

  const handleRemoveSavedItem = useCallback((basketId: string, itemId: string) => {
    setBaskets(prev => prev.map(b => 
      b.id === basketId 
        ? { ...b, savedItems: b.savedItems.filter(i => i.id !== itemId) }
        : b
    ));
  }, []);

  const handleTransferToCart = useCallback((basketId: string, itemId: string) => {
    const basket = baskets.find(b => b.id === basketId);
    const item = basket?.savedItems.find(i => i.id === itemId);
    if (!item) return;
    
    // Find the product and add to cart
    const product = mockProducts.find(p => p.id === item.productId);
    if (product) {
      setCartItems(prev => {
        const existing = prev.find(i => i.id === product.id);
        if (existing) {
          return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, { ...product, quantity: 1 }];
      });
    }
    
    // Remove from saved
    handleRemoveSavedItem(basketId, itemId);
  }, [baskets, handleRemoveSavedItem]);

  const handleSaveProduct = useCallback((product: Product) => {
    setBaskets(prev => prev.map(b => {
      if (b.id !== activeBasketId) return b;
      
      // Check if already saved
      const alreadySaved = b.savedItems.some(i => i.productId === product.id);
      if (alreadySaved) {
        // Unsave
        return { ...b, savedItems: b.savedItems.filter(i => i.productId !== product.id) };
      }
      
      // Save
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

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const checkoutCartItems = cartItems.map((item) => ({
    id: parseInt(item.id.replace('p', '')),
    name: item.name,
    price: item.price / 100,
    originalPrice: item.originalPrice ? item.originalPrice / 100 : undefined,
    quantity: item.quantity,
    image: item.image,
    inStock: item.inStock,
  }));

  // Get current basket's saved product IDs for checking save state
  const currentBasket = baskets.find(b => b.id === activeBasketId);
  const savedProductIds = currentBasket?.savedItems.map(i => i.productId) || [];

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