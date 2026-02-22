import { useState, useCallback, useEffect } from "react";
import { Sidebar, Basket } from "@/components/gpt-commerce/Sidebar";
import { ChatInterface } from "@/components/gpt-commerce/ChatInterface";
import { RightPanel } from "@/components/gpt-commerce/RightPanel";
import { AccountPanel } from "@/components/gpt-commerce/AccountPanel";
import { CheckoutModalLocalized } from "@/components/CheckoutModalLocalized";
import { SuccessScreenLocalized } from "@/components/SuccessScreenLocalized";
import { OTPModal } from "@/components/gpt-commerce/OTPModal";
import { useAuth } from "@/contexts/AuthContext";
import { toPersianNumber, merchants } from "@/data/gptCommerceData";
import { checkoutModes, upsellProducts, couponTiers } from "@/data/checkoutModes";
import { useBasketState, createDefaultBasketState } from "./hooks/useBasketState";
import { useUserData } from "./hooks/useUserData";
import { useCheckoutFlow } from "./hooks/useCheckoutFlow";
import { useAgentMessages } from "./hooks/useAgentMessages";
import { useCartPersistence } from "./hooks/useCartPersistence";

export const GPTCommerceShell = () => {
  const { isAuthenticated, profile, isNewUser: authIsNewUser, signOut, updateProfileName } = useAuth();

  // ── Layer 2: Business logic hooks ──────────────────────────────────────
  const {
    baskets, setBaskets,
    activeBasketId, setActiveBasketId,
    basketStates, setBasketStates,
    currentState, updateCurrentBasket,
  } = useBasketState();

  const {
    globalAddresses, setGlobalAddresses,
    dbOrders, setDbOrders,
    handleAccountAddAddress,
    handleAccountDeleteAddress,
    handleAccountUpdateAddress,
  } = useUserData({ isAuthenticated });

  // ── Cart persistence (DB sync for authenticated users) ─────────────────
  const { isSyncing } = useCartPersistence({
    isAuthenticated,
    activeBasketId,
    currentState,
    basketStates,
    baskets,
    setBaskets,
    setActiveBasketId,
    setBasketStates,
  });

  // ── UI-only state ─────────────────────────────────────────────────────
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState('active-cart');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpContext, setOtpContext] = useState<'checkout' | 'login'>('login');
  const [pendingNewChat, setPendingNewChat] = useState(false);

  // Derived from current basket state
  const messages = currentState.messages;
  const cartItems = currentState.cartItems;
  const agenticState = currentState.agenticState;
  const selectedAddressId = currentState.selectedAddressId;
  const selectedShippingByMerchant = currentState.selectedShippingByMerchant;
  const lastRecommendedProducts = currentState.lastRecommendedProducts;
  const isProcessing = currentState.isProcessing;
  const hasStartedChat = currentState.hasStartedChat;
  const isOTPVerified = currentState.isOTPVerified || isAuthenticated;
  const isNewUser = currentState.isNewUser || authIsNewUser;

  const {
    getMerchantShipping,
    handleQuickReply,
    handleOTPVerified,
    handleAddressSelect,
    handleSelectShipping,
    handleAddressConfirm,
    handleAddNewAddress,
    handlePaymentSelect,
    handleFinalizePurchase,
    handleCheckout,
    handleCheckoutSuccess,
    handleSuccessClose,
  } = useCheckoutFlow({
    updateCurrentBasket,
    globalAddresses,
    isAuthenticated,
    isOTPVerified,
    isNewUser,
    setDbOrders,
    cartItems,
    hasStartedChat,
    agenticState,
    selectedShippingByMerchant,
    basketStates,
    activeBasketId,
    setShowOTPModal,
    setOtpContext,
    setShowCheckout,
    setShowSuccess,
  });

  const {
    handleSendMessage,
    sendMessageToBasket,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleCompare,
    handleInlineProductDetails,
    handleSaveProduct,
    handleMoreResults,
  } = useAgentMessages({
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
  });

  // Wrap handleQuickReply to intercept more_results
  const handleQuickReplyWrapped = useCallback((reply: any) => {
    if (reply.type === 'custom' && reply.action === 'more_results') {
      handleMoreResults();
      return;
    }
    handleQuickReply(reply);
  }, [handleQuickReply, handleMoreResults]);

  // ── Basket item count sync ──────────────────────────────────────────────
  useEffect(() => {
    setBaskets(prev => prev.map(b =>
      b.id === activeBasketId ? { ...b, itemCount: cartItems.length } : b
    ));
  }, [cartItems.length, activeBasketId, setBaskets]);

  // Open cart when chat starts
  useEffect(() => {
    if (hasStartedChat) setIsCartOpen(true);
  }, [hasStartedChat]);

  // ── Basket lifecycle handlers ───────────────────────────────────────────
  const handleCreateBasket = useCallback(() => {
    // Just switch to pending mode — no basket created until first message
    setPendingNewChat(true);
    setActiveSection('active-cart');
  }, []);

  const handleSendMessageWithPending = useCallback(async (message: string) => {
    if (pendingNewChat) {
      // Officially create the basket now that there's a real message
      const existingNewBaskets = baskets.filter(b => b.title.startsWith('سبد جدید') && !b.isSaved);
      let newTitle = 'سبد جدید';
      if (existingNewBaskets.length > 0) {
        newTitle = `سبد جدید ${toPersianNumber(existingNewBaskets.length + 1)}`;
      }
      const newId = crypto.randomUUID();
      const newBasket: Basket = {
        id: newId,
        title: newTitle,
        itemCount: 0,
        lastActivity: 'الان',
        savedItems: [],
        isSaved: false,
      };
      setBaskets(prev => [newBasket, ...prev]);
      setActiveBasketId(newId);
      setBasketStates(prev => ({
        ...prev,
        [newId]: { ...createDefaultBasketState(), hasStartedChat: true },
      }));
      setPendingNewChat(false);
      // Use sendMessageToBasket with the explicit newId to avoid stale closure on activeBasketId
      sendMessageToBasket(newId, message);
      return;
    }
    handleSendMessage(message);
  }, [pendingNewChat, baskets, setBaskets, setActiveBasketId, setBasketStates, handleSendMessage, sendMessageToBasket]);

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
        const newBasket: Basket = {
          id: crypto.randomUUID(),
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
  }, [baskets, activeBasketId, setBaskets, setActiveBasketId, setBasketStates]);

  const handleMergeBasket = useCallback((sourceId: string, targetId: string) => {
    setBasketStates(prev => {
      const sourceState = prev[sourceId] || createDefaultBasketState();
      const targetState = prev[targetId] || createDefaultBasketState();
      const mergedCart = [...targetState.cartItems];
      sourceState.cartItems.forEach(item => {
        const existing = mergedCart.find(i => i.id === item.id);
        if (existing) existing.quantity += item.quantity;
        else mergedCart.push({ ...item });
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
      return prev
        .filter(b => b.id !== sourceId)
        .map(b => b.id === targetId
          ? { ...b, savedItems: [...target.savedItems, ...source.savedItems], itemCount: b.itemCount + source.itemCount }
          : b
        );
    });
    setActiveBasketId(targetId);
  }, [setBasketStates, setBaskets, setActiveBasketId]);

  const handleSaveBasket = useCallback((basketId: string) => {
    setBaskets(prev => prev.map(b => b.id === basketId ? { ...b, isSaved: true } : b));
    const remaining = baskets.filter(b => b.id !== basketId && !b.isSaved);
    if (remaining.length > 0) {
      setActiveBasketId(remaining[0].id);
    } else {
      const newBasket: Basket = {
        id: crypto.randomUUID(),
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
  }, [baskets, setBaskets, setActiveBasketId, setBasketStates]);

  const handleResumeBasket = useCallback((basketId: string) => {
    setBaskets(prev => prev.map(b => b.id === basketId ? { ...b, isSaved: false } : b));
    setActiveBasketId(basketId);
  }, [setBaskets, setActiveBasketId]);

  const handleBasketSelect = useCallback((basketId: string) => {
    setPendingNewChat(false);
    setActiveBasketId(basketId);
    setActiveSection('active-cart');
    setIsCartOpen(true);
    setBasketStates(prev => {
      const bs = prev[basketId];
      if (bs) return {
        ...prev,
        [basketId]: {
        ...bs,
        hasStartedChat: true,
        agenticState: { ...bs.agenticState, step: 'idle' },
        selectedShippingByMerchant: {},
        selectedAddressId: null,
        messages: bs.messages.filter(
          (m: any) => !m.addressShipping && !m.paymentOptions && !m.addressSelector && !m.addressConfirmation
        ),
      }
      };
      return prev;
    });
  }, [setActiveBasketId, setBasketStates]);

  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
    if (section === 'account' || section === 'orders' || section === 'flowclub') {
      setIsCartOpen(false);
    } else if (section === 'active-cart') {
      setIsCartOpen(true);
    }
  }, []);

  const handleRemoveSavedItem = useCallback((basketId: string, itemId: string) => {
    setBaskets(prev => prev.map(b =>
      b.id === basketId ? { ...b, savedItems: b.savedItems.filter(i => i.id !== itemId) } : b
    ));
  }, [setBaskets]);

  const handleTransferToCart = useCallback((basketId: string, itemId: string) => {
    const basket = baskets.find(b => b.id === basketId);
    const item = basket?.savedItems.find(i => i.id === itemId);
    if (!item) return;
    // Build a minimal CartItem from the saved item data (no mockProducts dependency)
    const cartItem = {
      id: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      originalPrice: undefined,
      merchant: merchants[0],
      rating: 4.0,
      fastDelivery: false,
      returnGuarantee: false,
      inStock: true,
      quantity: 1,
    };
    updateCurrentBasket(s => {
      const existing = s.cartItems.find(i => i.id === cartItem.id);
      return {
        ...s,
        cartItems: existing
          ? s.cartItems.map(i => i.id === cartItem.id ? { ...i, quantity: i.quantity + 1 } : i)
          : [...s.cartItems, cartItem],
      };
    });
    handleRemoveSavedItem(basketId, itemId);
  }, [baskets, handleRemoveSavedItem, updateCurrentBasket]);

  // ── Derived values ──────────────────────────────────────────────────────
  const activeAddressIds = Object.values(basketStates)
    .map(s => s.selectedAddressId)
    .filter((id): id is string => !!id);

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const checkoutCartItems = cartItems.map(item => ({
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
  const showAccountPanel = activeSection === 'account' || activeSection === 'orders';

  const handleStartChat = useCallback(() => {
    updateCurrentBasket(s => ({ ...s, hasStartedChat: true }));
  }, [updateCurrentBasket]);

  const handleSignInClick = useCallback(() => {
    if (isAuthenticated) {
      // Enter chat mode directly — don't redirect to account
      updateCurrentBasket(s => ({ ...s, hasStartedChat: true }));
    } else {
      setOtpContext('login');
      setShowOTPModal(true);
    }
  }, [isAuthenticated, updateCurrentBasket]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {(hasStartedChat || pendingNewChat) && (
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          cartItemCount={cartItems.length}
          activeOrderCount={dbOrders.length}
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
          onStartNewChat={() => { handleCreateBasket(); setActiveSection('active-cart'); }}
          orders={dbOrders}
          userProfile={profile ? { name: profile.full_name || '', phone: profile.phone, email: '' } : undefined}
          isAuthenticated={isAuthenticated}
          onSignOut={signOut}
          onUpdateProfileName={updateProfileName}
        />
      ) : (
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessageWithPending}
          onAddToCart={handleAddToCart}
          onCompare={handleCompare}
          onSaveProduct={handleSaveProduct}
          cartItems={cartItems}
          isProcessing={isProcessing}
          onCheckout={handleCheckout}
          hasStartedChat={pendingNewChat ? true : hasStartedChat}
          isPendingNewChat={pendingNewChat}
          onStartChat={handleStartChat}
          isCartOpen={isCartOpen}
          onSignIn={handleSignInClick}
          savedProductIds={savedProductIds}
          onInlineProductDetails={handleInlineProductDetails}
          onQuickReply={handleQuickReplyWrapped}
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
          isAuthenticated={isAuthenticated}
          userFirstName={profile?.full_name?.split(' ')[0]}
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
        onVerified={(isNewUser) => {
          if (otpContext === 'checkout') {
            handleOTPVerified(isNewUser);
          } else {
            // Plain login — just close, no checkout injection
            setShowOTPModal(false);
          }
        }}
      />
    </div>
  );
};
