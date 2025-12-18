import { useState, useCallback } from "react";
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
} from "@/data/gptCommerceData";
import { checkoutModes, upsellProducts, couponTiers } from "@/data/checkoutModes";

const GPTCommerceContent = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState('active-cart');

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

      // Check for checkout intent
      if (content.includes('خرید') && content.includes('انجام')) {
        if (cartItems.length > 0) {
          setShowCheckout(true);
          responseContent = 'باشه! دارم پرداخت رو باز می‌کنم... 🛒';
        } else {
          responseContent = 'سبد خریدت خالیه! اول یه چیزی به سبد اضافه کن.';
        }
      }
      // Check for product search
      else if (content.includes('هدفون') || content.includes('ایرپاد')) {
        responseContent = 'این هدفون‌ها رو پیدا کردم که فکر می‌کنم بهت می‌خوره:';
        products = mockProducts.filter(p => 
          p.name.includes('هدفون') || p.name.includes('ایرپاد')
        );
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
        responseContent = 'بگو دنبال چی می‌گردی تا بهترین گزینه‌ها رو پیدا کنم! می‌تونی بگی مثلاً:\n• هدفون بی‌سیم می‌خوام\n• گوشی با قیمت مناسب\n• لپ‌تاپ برای کار';
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        products,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 1500);
  }, [cartItems.length]);

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

    // Add confirmation message
    const confirmMessage: ChatMessage = {
      id: `confirm-${Date.now()}`,
      role: 'assistant',
      content: `${product.name} به سبد اضافه شد! ✅`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMessage]);
  }, []);

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
    // Add post-purchase message
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

  // Convert cart items to format expected by checkout modal
  const checkoutCartItems = cartItems.map((item) => ({
    id: parseInt(item.id.replace('p', '')),
    name: item.name,
    price: item.price / 100, // Convert to display format
    originalPrice: item.originalPrice ? item.originalPrice / 100 : undefined,
    quantity: item.quantity,
    image: item.image,
    inStock: item.inStock,
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Left Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        cartItemCount={cartItems.length}
        activeOrderCount={mockOrders.length}
      />

      {/* Center Chat */}
      <ChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        onAddToCart={handleAddToCart}
        onCompare={handleCompare}
        cartItems={cartItems}
        isProcessing={isProcessing}
        onCheckout={handleCheckout}
      />

      {/* Right Panel */}
      <RightPanel
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        onAddToCart={handleAddToCart}
      />

      {/* Checkout Modal */}
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

      {/* Success Screen */}
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
