import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowUp, Zap, ChevronDown, ChevronUp, Plus, Minus, Heart, Share2, Check, ShoppingCart, Info, Truck, RotateCcw, Shield, Paperclip, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  ChatMessage, 
  Product, 
  CartItem, 
  mockProducts, 
  mockAddresses, 
  paymentOptions,
  formatPersianPrice,
  toPersianNumber,
  calculateOrderSummary,
  QuickReply,
  PaymentMethod,
} from "@/data/gptCommerceData";
import { ChatProductCard } from "@/components/gpt-commerce/ChatProductCard";
import { RightPanel } from "@/components/gpt-commerce/RightPanel";
import { OTPModal } from "@/components/gpt-commerce/OTPModal";
import { 
  QuickReplyButtons, 
  CTAButton, 
  CartSummaryCard, 
  PaymentSelector 
} from "@/components/gpt-commerce/AgenticMessageComponents";
import { AddressShippingSelector, MerchantShipping } from "@/components/gpt-commerce/AddressShippingSelector";
import { LanguageProvider } from "@/i18n/LanguageContext";

// Get product by ID or default to first product
const getAnchoredProduct = (productId?: string): Product => {
  if (productId) {
    const found = mockProducts.find(p => p.id === productId);
    if (found) return found;
  }
  return mockProducts[0];
};

const PDPChatContent = () => {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product') || undefined;
  const anchoredProduct = getAnchoredProduct(productId);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-pdp',
      role: 'assistant',
      content: `این محصولیه که دنبالش بودی.\nمی‌تونیم دقیق بررسیش کنیم، مقایسه‌اش کنیم، یا اگه خواستی محصولات دیگه رو هم با هم ببینیم.`,
      timestamp: new Date(),
    }
  ]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(true);
  const [isPdpCollapsed, setIsPdpCollapsed] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState("default");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedShippingByMerchant, setSelectedShippingByMerchant] = useState<Record<string, string>>({});
  const [checkoutAddresses, setCheckoutAddresses] = useState(() => mockAddresses);
  const [agenticStep, setAgenticStep] = useState<string>('idle');
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Build merchant shipping from cart items
  const getMerchantShipping = useCallback((): MerchantShipping[] => {
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

  const handleAddToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);

    // Add message with CTA
    const confirmMessage: ChatMessage = {
      id: `confirm-${Date.now()}`,
      role: 'assistant',
      content: `${product.name} به سبدت اضافه شد! ✅\n\nمحصول دیگه‌ای می‌خوای یا خرید رو نهایی کنیم؟`,
      ctaButton: {
        label: 'نهایی کردن خرید',
        action: 'finalize',
        disabled: false,
      },
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMessage]);
  }, []);

  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      setCartItems((prev) => prev.filter((item) => item.id !== productId));
    } else {
      setCartItems((prev) =>
        prev.map((item) => item.id === productId ? { ...item, quantity } : item)
      );
    }
  }, []);

  const handleRemoveItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const handleQuickReply = useCallback((reply: QuickReply) => {
    if (reply.type === 'confirm-cart') {
      if (!isOTPVerified) {
        setShowOTPModal(true);
        return;
      }
      // Go to address selection
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
      setAgenticStep('address-confirmation');
      if (!isNewUser && checkoutAddresses[0]) {
        setSelectedAddressId(checkoutAddresses[0].id);
      }
      setSelectedShippingByMerchant({});
    } else if (reply.type === 'add-more') {
      const moreMessage: ChatMessage = {
        id: `more-${Date.now()}`,
        role: 'assistant',
        content: 'باشه! بگو دنبال چی می‌گردی تا پیداش کنم.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, moreMessage]);
      setAgenticStep('idle');
    }
  }, [isOTPVerified, isNewUser, checkoutAddresses]);

  const handleOTPVerified = useCallback((newUser: boolean) => {
    setShowOTPModal(false);
    setIsOTPVerified(true);
    setIsNewUser(newUser);

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
    setAgenticStep('address-confirmation');
    if (!newUser && checkoutAddresses[0]) {
      setSelectedAddressId(checkoutAddresses[0].id);
    }
    setSelectedShippingByMerchant({});
  }, [checkoutAddresses]);

  const handleFinalizePurchase = useCallback(() => {
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

    const orderSummary = calculateOrderSummary(cartItems);
    const confirmMessage: ChatMessage = {
      id: `confirm-${Date.now()}`,
      role: 'assistant',
      content: 'باشه، اول یه مرور سریع روی سبد خریدت داشته باشیم:',
      orderSummary: orderSummary,
      quickReplies: [
        { id: 'yes', label: '✅ بله، تأیید می‌کنم', type: 'confirm-cart' },
        { id: 'no', label: '➕ نه، محصول بیشتر می‌خوام', type: 'add-more' },
      ],
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMessage]);
    setAgenticStep('cart-confirmation');
  }, [cartItems]);

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
    setMessages(prev => [...prev, paymentMessage]);
    setAgenticStep('payment-selection');
  }, [selectedShippingByMerchant, getMerchantShipping]);

  const handlePaymentSelect = useCallback((paymentId: string) => {
    setSelectedPayment(paymentId);
    setIsProcessing(true);
    
    const processingMessage: ChatMessage = {
      id: `processing-${Date.now()}`,
      role: 'assistant',
      content: 'ممنون! 🙏 داریم پرداخت رو پردازش می‌کنیم...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, processingMessage]);

    setTimeout(() => {
      const orderId = `FLC-${Date.now().toString().slice(-6)}`;
      const successMessage: ChatMessage = {
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: `سفارشت با موفقیت ثبت شد! 🎉\n\nشماره سفارش: ${orderId}`,
        quickReplies: [
          { id: 'track', label: '📦 پیگیری سفارش', type: 'track-order' },
          { id: 'continue', label: '🛒 ادامه خرید', type: 'add-more' },
        ],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, successMessage]);
      setCartItems([]);
      setIsProcessing(false);
      setAgenticStep('order-complete');
    }, 2000);
  }, []);

  const handleAddNewAddress = useCallback((addr: Omit<typeof mockAddresses[0], "id">) => {
    const id = `addr-${Date.now()}`;
    const created = { id, ...addr, recipientName: addr.recipientName || '', phone: addr.phone || '' };
    setCheckoutAddresses((prev) => [created, ...prev]);
    setSelectedAddressId(id);
  }, []);

  const handleSendMessage = useCallback((content: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    setTimeout(() => {
      let responseContent = '';
      let products: Product[] | undefined;

      if (content.includes('مقایسه')) {
        responseContent = `برای مقایسه ${anchoredProduct.name} با محصولات مشابه، این گزینه‌ها رو داریم:`;
        products = mockProducts.filter(p => p.id !== anchoredProduct.id).slice(0, 3);
      } else if (content.includes('هدفون') || content.includes('محصول') || content.includes('دیگه')) {
        responseContent = 'این محصولات مشابه رو پیدا کردم:';
        products = mockProducts.filter(p => p.id !== anchoredProduct.id).slice(0, 4);
      } else {
        responseContent = `درباره ${anchoredProduct.name}:\n\n• کیفیت صدای عالی با فناوری نویز کنسلینگ\n• باتری ۳۰ ساعته\n• اتصال بلوتوث ۵.۰\n\nسوال دیگه‌ای داری؟`;
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        products,
        productIndexStart: products ? 1 : undefined,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 1500);
  }, [anchoredProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isProcessing) {
      handleSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const isInCart = cartItems.some(item => item.id === anchoredProduct.id);

  // Mock product images for gallery
  const productImages = [
    anchoredProduct.image,
    anchoredProduct.image,
    anchoredProduct.image,
  ];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* Main Chat Area */}
      <div 
        className="flex-1 flex flex-col h-screen" 
        dir="rtl"
        style={{
          marginLeft: isCartOpen ? '340px' : '0',
          transition: 'margin-left 0.3s ease-out'
        }}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[820px] mx-auto p-6 space-y-6">
            
            {/* Anchored Product PDP Component */}
            <div 
              className="rounded-2xl overflow-hidden animate-fade-in"
              style={{
                background: 'hsl(0 0% 100%)',
                border: '1px solid hsl(0 0% 0% / 0.08)',
              }}
            >
              {/* Context Label */}
              <div 
                className="px-4 py-2 flex items-center justify-between"
                style={{ 
                  background: 'hsl(var(--primary) / 0.05)',
                  borderBottom: '1px solid hsl(0 0% 0% / 0.05)'
                }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-xs text-primary font-medium">شروع گفتگو از این محصول</span>
                </div>
                <button
                  onClick={() => setIsPdpCollapsed(!isPdpCollapsed)}
                  className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {isPdpCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>

              {/* Collapsible Content */}
              {!isPdpCollapsed && (
                <div className="p-4 space-y-4">
                  {/* Product Layout */}
                  <div className="flex gap-6">
                    {/* Image Gallery */}
                    <div className="w-56 flex-shrink-0 space-y-2">
                      <div 
                        className="aspect-square rounded-xl overflow-hidden"
                        style={{ border: '1px solid hsl(0 0% 0% / 0.06)' }}
                      >
                        <img 
                          src={productImages[activeImageIndex]} 
                          alt={anchoredProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Thumbnail indicators */}
                      <div className="flex justify-center gap-1.5">
                        {productImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              idx === activeImageIndex ? 'bg-primary' : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">{anchoredProduct.merchant.logo} {anchoredProduct.merchant.name}</span>
                        </div>
                        <h1 className="text-lg font-bold text-foreground">{anchoredProduct.name}</h1>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-primary">{formatPersianPrice(anchoredProduct.price)}</span>
                        {anchoredProduct.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPersianPrice(anchoredProduct.originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        {anchoredProduct.fastDelivery && (
                          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700">
                            <Truck className="w-3 h-3" />
                            ارسال سریع
                          </span>
                        )}
                        {anchoredProduct.returnGuarantee && (
                          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700">
                            <RotateCcw className="w-3 h-3" />
                            ضمانت بازگشت
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary">
                          <Shield className="w-3 h-3" />
                          گارانتی اصالت
                        </span>
                      </div>

                      {/* Availability */}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${anchoredProduct.inStock ? 'text-green-600' : 'text-red-500'}`}>
                          {anchoredProduct.inStock ? '✓ موجود در انبار' : '✗ ناموجود'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleAddToCart(anchoredProduct)}
                          disabled={!anchoredProduct.inStock || isInCart}
                          className="flex-1 h-11 rounded-xl"
                        >
                          {isInCart ? (
                            <>
                              <Check className="w-4 h-4 ml-2" />
                              در سبد خرید
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 ml-2" />
                              افزودن به سبد
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Sections */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="description" className="border-b-0">
                      <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        توضیحات محصول
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                        این هدفون با فناوری پیشرفته نویز کنسلینگ، تجربه‌ای بی‌نظیر از گوش دادن به موسیقی را فراهم می‌کند. 
                        طراحی ارگونومیک و بالشتک‌های نرم، راحتی طولانی‌مدت را تضمین می‌کنند.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="specs" className="border-b-0">
                      <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        مشخصات فنی
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">نوع اتصال</span>
                            <span>بلوتوث ۵.۰</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">عمر باتری</span>
                            <span>۳۰ ساعت</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">وزن</span>
                            <span>۲۵۰ گرم</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">رنگ</span>
                            <span>مشکی</span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="shipping" className="border-b-0">
                      <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                        شرایط ارسال
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                        ارسال رایگان برای سفارش‌های بالای ۵۰۰ هزار تومان. 
                        زمان تحویل: ۲ تا ۵ روز کاری در تهران و ۳ تا ۷ روز کاری در سایر شهرها.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}

              {/* Collapsed Summary */}
              {isPdpCollapsed && (
                <div className="px-4 py-3 flex items-center gap-3">
                  <img 
                    src={anchoredProduct.image} 
                    alt={anchoredProduct.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">{anchoredProduct.name}</h3>
                    <p className="text-xs text-primary font-medium">{formatPersianPrice(anchoredProduct.price)}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(anchoredProduct)}
                    disabled={!anchoredProduct.inStock || isInCart}
                    className="rounded-lg"
                  >
                    {isInCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </div>

            {/* Chat Messages */}
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-4 animate-fade-in">
                {/* Message Bubble */}
                <div
                  className={`flex gap-3 ${
                    msg.role === 'user' ? 'justify-start flex-row-reverse' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                      }}
                    >
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] px-4 py-3 ${
                      msg.role === 'user'
                        ? 'rounded-[16px_16px_4px_16px]'
                        : 'rounded-[16px_16px_16px_4px]'
                    }`}
                    style={{
                      background: msg.role === 'user' 
                        ? 'hsl(var(--primary) / 0.1)'
                        : 'hsl(0 0% 100%)',
                      border: '1px solid hsl(0 0% 0% / 0.06)',
                    }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {msg.content}
                    </p>
                  </div>
                </div>

                {/* Products */}
                {msg.products && msg.products.length > 0 && (
                  <div className="flex flex-wrap gap-4 mr-11">
                    {msg.products.map((product, index) => (
                      <ChatProductCard
                        key={product.id}
                        product={product}
                        index={(msg.productIndexStart || 1) + index}
                        onAddToCart={handleAddToCart}
                        onCompare={() => {}}
                        isInCart={cartItems.some(item => item.id === product.id)}
                        isSaved={false}
                      />
                    ))}
                  </div>
                )}

                {/* Order Summary */}
                {msg.orderSummary && (
                  <div className="mr-11 max-w-[480px]">
                    <CartSummaryCard orderSummary={msg.orderSummary} />
                  </div>
                )}

                {/* Address + Shipping Selector */}
                {msg.addressShipping && (
                  <div className="mr-11 max-w-[560px]">
                    <AddressShippingSelector
                      mode={msg.addressShipping.mode}
                      addresses={checkoutAddresses}
                      selectedAddressId={selectedAddressId}
                      onSelectAddressId={setSelectedAddressId}
                      merchantShipping={getMerchantShipping()}
                      selectedShippingByMerchant={selectedShippingByMerchant}
                      onSelectShipping={(mId, sId) => setSelectedShippingByMerchant(prev => ({ ...prev, [mId]: sId }))}
                      onSubmitNewAddress={handleAddNewAddress}
                      onAddNewAddress={handleAddNewAddress}
                      onConfirm={handleAddressConfirm}
                    />
                  </div>
                )}

                {/* Payment Options */}
                {msg.paymentOptions && (
                  <div className="mr-11 max-w-[400px]">
                    <PaymentSelector
                      options={msg.paymentOptions}
                      selectedPayment={selectedPayment}
                      onSelect={handlePaymentSelect}
                    />
                  </div>
                )}

                {/* Quick Reply Buttons */}
                {msg.quickReplies && (
                  <div className="mr-11">
                    <QuickReplyButtons 
                      replies={msg.quickReplies} 
                      onSelect={handleQuickReply}
                    />
                  </div>
                )}

                {/* CTA Button */}
                {msg.ctaButton && (
                  <div className="mr-11 max-w-[300px]">
                    <CTAButton
                      label={msg.ctaButton.label}
                      onClick={handleFinalizePurchase}
                      disabled={msg.ctaButton.disabled}
                      disabledReason={msg.ctaButton.disabledReason}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex gap-3 animate-fade-in">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                  }}
                >
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div 
                  className="rounded-[16px_16px_16px_4px] px-4 py-3"
                  style={{
                    background: 'hsl(0 0% 100%)',
                    border: '1px solid hsl(0 0% 0% / 0.06)',
                  }}
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Bottom Input Area */}
        <div 
          className="border-t"
          style={{
            background: 'hsl(0 0% 100%)',
            borderColor: 'hsl(0 0% 0% / 0.06)',
          }}
        >
          <form onSubmit={handleSubmit} className="max-w-[820px] mx-auto p-4">
            <div 
              className="flex items-end gap-3 p-3 rounded-xl"
              style={{
                background: 'hsl(0 0% 100%)',
                border: '1px solid hsl(0 0% 0% / 0.08)',
              }}
            >
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="سوالی داری؟ بپرس یا محصول دیگه‌ای بخواه..."
                disabled={isProcessing}
                className="flex-1 min-h-[48px] max-h-[160px] bg-transparent border-none focus:outline-none focus:ring-0 text-right resize-none py-3 px-2"
                style={{ lineHeight: '1.6' }}
                dir="rtl"
              />
              
              <div className="flex items-center gap-2 pb-1">
                <button
                  type="button"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{
                    background: 'hsl(0 0% 98%)',
                    border: '1px solid hsl(0 0% 0% / 0.06)',
                  }}
                  title="ارسال فایل"
                >
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                </button>
                
                <button
                  type="button"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{
                    background: 'hsl(0 0% 98%)',
                    border: '1px solid hsl(0 0% 0% / 0.06)',
                  }}
                  title="پیام صوتی"
                >
                  <Mic className="w-4 h-4 text-muted-foreground" />
                </button>

                <Button
                  type="submit"
                  disabled={!inputValue.trim() || isProcessing}
                  className="h-10 w-10 rounded-xl"
                >
                  <ArrowUp className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <RightPanel
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {}}
        onAddToCart={handleAddToCart}
        isOpen={isCartOpen}
        onToggle={() => setIsCartOpen(!isCartOpen)}
        showAICheckout={false}
      />

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerified={handleOTPVerified}
      />
    </div>
  );
};

const PDPChat = () => {
  return (
    <LanguageProvider defaultLanguage="fa">
      <PDPChatContent />
    </LanguageProvider>
  );
};

export default PDPChat;
