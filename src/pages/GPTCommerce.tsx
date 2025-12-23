import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "@/components/gpt-commerce/Sidebar";
import { ChatInterface } from "@/components/gpt-commerce/ChatInterface";
import { RightPanel } from "@/components/gpt-commerce/RightPanel";
import { CheckoutModalLocalized } from "@/components/CheckoutModalLocalized";
import { SuccessScreenLocalized } from "@/components/SuccessScreenLocalized";
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
  calculateOrderSummary,
} from "@/data/gptCommerceData";
import { checkoutModes, upsellProducts, couponTiers } from "@/data/checkoutModes";

const GPTCommerceContent = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState('active-cart');
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Agentic state
  const [agenticState, setAgenticState] = useState<AgenticState>({
    step: 'idle',
    isLoggedIn: true, // Mock: user is logged in
    hasStoredCheckoutDetails: true, // Mock: user has stored checkout details
    selectedAddress: mockAddresses[0],
    selectedPayment: null,
    orderId: null,
  });
  
  // Selected address ID for address selector
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(mockAddresses[0].id);

  // Track recommended products for number reference
  const [lastRecommendedProducts, setLastRecommendedProducts] = useState<Product[]>([]);

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
      // Show address selector with multiple addresses
      const addressMessage: ChatMessage = {
        id: `addr-${Date.now()}`,
        role: 'assistant',
        content: 'عالی! لطفاً آدرس تحویل رو انتخاب کن:',
        addressSelector: mockAddresses, // Show all addresses to choose from
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, addressMessage]);
      setAgenticState(prev => ({ ...prev, step: 'address-confirmation' }));
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
  }, [agenticState.orderId]);

  // Handle address selection
  const handleAddressSelect = useCallback((addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddr = mockAddresses.find(a => a.id === addressId);
    if (selectedAddr) {
      setAgenticState(prev => ({ ...prev, selectedAddress: selectedAddr }));
    }
  }, []);

  // Handle address confirmation
  const handleAddressConfirm = useCallback(() => {
    const selectedAddr = mockAddresses.find(a => a.id === selectedAddressId) || mockAddresses[0];
    
    // Show payment selection
    const paymentMessage: ChatMessage = {
      id: `payment-${Date.now()}`,
      role: 'assistant',
      content: `آدرس "${selectedAddr.title}" تأیید شد ✅\n\nحالا روش پرداخت رو انتخاب کن:`,
      paymentOptions: paymentOptions,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, paymentMessage]);
    setAgenticState(prev => ({ ...prev, step: 'payment-selection' }));
  }, [selectedAddressId]);

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

  // Handle CTA button click (Finalize Purchase)
  const handleFinalizePurchase = useCallback(() => {
    if (!agenticState.isLoggedIn) {
      const loginMessage: ChatMessage = {
        id: `login-${Date.now()}`,
        role: 'assistant',
        content: 'برای نهایی کردن خرید، اول باید وارد حسابت بشی. 🔐',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, loginMessage]);
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

    // Show cart confirmation
    const orderSummary = calculateOrderSummary(cartItems);
    const confirmMessage: ChatMessage = {
      id: `confirm-${Date.now()}`,
      role: 'assistant',
      content: 'باشه! بذار یه نگاه به سبد خریدت بندازیم:',
      orderSummary: orderSummary,
      quickReplies: [
        { id: 'yes', label: '✅ بله، تأیید می‌کنم', type: 'confirm-cart' },
        { id: 'no', label: '➕ نه، محصول بیشتر می‌خوام', type: 'add-more' },
      ],
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMessage]);
    setAgenticState(prev => ({ ...prev, step: 'cart-confirmation' }));
  }, [agenticState.isLoggedIn, cartItems]);

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

        // Default flow - product added, show finalize CTA
        responseContent = `${selectedProduct.name} به سبدت اضافه شد! ✅\n\nمحصول دیگه‌ای می‌خوای یا خرید رو نهایی کنیم؟\nمی‌تونی از سبد خریدت تعداد و نوع محصول رو تغییر بدی.`;
        
        ctaButton = {
          label: 'نهایی کردن خرید',
          action: 'finalize',
          disabled: !agenticState.hasStoredCheckoutDetails,
          disabledReason: !agenticState.hasStoredCheckoutDetails 
            ? 'برای خرید سریع، اول اطلاعات پرداخت رو ذخیره کن' 
            : undefined,
        };
        
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

    const confirmMessage: ChatMessage = {
      id: `confirm-${Date.now()}`,
      role: 'assistant',
      content: `${product.name} به سبدت اضافه شد! ✅\n\nمحصول دیگه‌ای می‌خوای یا خرید رو نهایی کنیم؟\nمی‌تونی از سبد خریدت تعداد و نوع محصول رو تغییر بدی.`,
      ctaButton: {
        label: 'نهایی کردن خرید',
        action: 'finalize',
        disabled: !agenticState.hasStoredCheckoutDetails,
        disabledReason: !agenticState.hasStoredCheckoutDetails 
          ? 'برای خرید سریع، اول اطلاعات پرداخت رو ذخیره کن' 
          : undefined,
      },
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMessage]);
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

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {hasStartedChat && (
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          cartItemCount={cartItems.length}
          activeOrderCount={mockOrders.length}
        />
      )}

      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        onAddToCart={handleAddToCart}
        onCompare={handleCompare}
        cartItems={cartItems}
        isProcessing={isProcessing}
        onCheckout={handleCheckout}
        hasStartedChat={hasStartedChat}
        onStartChat={handleStartChat}
        isCartOpen={isCartOpen}
        onSignIn={handleCheckout}
        onQuickReply={handleQuickReply}
        onFinalizePurchase={handleFinalizePurchase}
        onAddressConfirm={handleAddressConfirm}
        onAddressSelect={handleAddressSelect}
        onPaymentSelect={handlePaymentSelect}
        agenticState={agenticState}
        selectedAddressId={selectedAddressId}
      />

      <RightPanel
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        onAddToCart={handleAddToCart}
        isOpen={isCartOpen}
        onToggle={() => setIsCartOpen(!isCartOpen)}
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