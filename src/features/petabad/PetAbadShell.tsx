import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Sidebar, Basket } from "@/components/petabad/Sidebar";
import { ChatInterface } from "@/components/petabad/ChatInterface";
import { RightPanel } from "@/components/petabad/RightPanel";
import { AccountPanel } from "@/components/petabad/AccountPanel";
import { CheckoutModalLocalized } from "@/components/CheckoutModalLocalized";
import { SuccessScreenLocalized } from "@/components/SuccessScreenLocalized";
import { OTPModal } from "@/components/petabad/OTPModal";
import { useAuth } from "@/contexts/AuthContext";
import { toPersianNumber, merchants } from "@/data/petabadData";
import { checkoutModes, upsellProducts, couponTiers } from "@/data/checkoutModes";
import { useBasketState, createDefaultBasketState } from "./hooks/useBasketState";
import { useUserData } from "./hooks/useUserData";
import { useCheckoutFlow } from "./hooks/useCheckoutFlow";
import { useAgentMessages, type CheckoutBridge } from "./hooks/useAgentMessages";
import { useCartPersistence } from "./hooks/useCartPersistence";
import "./petabad-theme.css";
import { Product } from "@/data/petabadData";
import { mapDbProduct } from "@/components/petabad/ProductCarousels";
import { supabase } from "@/integrations/supabase/client";
import { seedProductConversation } from "@/lib/productConversation";
import { useTelegramSession } from "./hooks/useTelegramSession";

export const PetAbadShell = () => {
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
  const isCreatingBasketRef = useRef(false);
  const handledProductDeepLinkRef = useRef<string | null>(null);
  const [pendingOwnedC, setPendingOwnedC] = useState<string | null>(null);
  // Lazy session: a product-entry conversation stays a local draft (no history, no DB) until the first real interaction.
  const commitDraft = useCallback(() => {
    setBaskets(prev => prev.some(b => b.id === activeBasketId && b.isDraft)
      ? prev.map(b => b.id === activeBasketId ? { ...b, isDraft: false } : b)
      : prev);
  }, [activeBasketId, setBaskets]);
  const activeBasketMeta = baskets.find(b => b.id === activeBasketId);
  const isDraftActive = !!activeBasketMeta?.isDraft;

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
    applyCheckoutDirective,
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
    onFinalizeBasket: useCallback(() => {
      // Mark current basket as finalized; create a new one in the background but stay on current
      setBaskets(prev => prev.map(b => b.id === activeBasketId ? { ...b, isSaved: true } : b));
      const newBasket: Basket = {
        id: crypto.randomUUID(),
        title: 'سبد جدید',
        itemCount: 0,
        lastActivity: 'الان',
        savedItems: [],
        isSaved: false,
      };
      setBaskets(prev => [newBasket, ...prev]);
      setBasketStates(prev => ({ ...prev, [newBasket.id]: createDefaultBasketState() }));
      // Don't switch to new basket — user stays on finalized basket to see success message
    }, [activeBasketId, setBaskets, setBasketStates]),
  });

  // Chat commands («بفرست خونه»، «با اکسپرس»، «از کیف پول») read and drive the live checkout through this bridge.
  const checkoutBridgeRef = useRef<CheckoutBridge | null>(null);
  checkoutBridgeRef.current = {
    loggedIn: isOTPVerified,
    addresses: globalAddresses,
    selectedAddressId,
    shippingId: Object.values(selectedShippingByMerchant || {})[0] || null,
    paymentId: agenticState.selectedPayment,
    step: agenticState.step,
    apply: applyCheckoutDirective,
    confirmCart: () => handleQuickReply({ id: 'yes', label: '✅ بله، تأیید می‌کنم', type: 'confirm-cart' } as any),
    confirmAddress: () => handleAddressConfirm(),
  };

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
    handleChoice,
    handleStop,
    handleResend,
    handleFeedback,
  } = useAgentMessages({
    checkoutBridge: checkoutBridgeRef,
    surface: 'web',
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
    productMemory: currentState.productMemory,
    shoppingContext: currentState.shoppingContext,
  });

  // Wrap handleQuickReply to intercept more_results and disambiguation
  // Native screens chat may point to (profile/addresses, orders); set below once their state exists.
  const navRef = useRef<(target: string) => void>(() => {});
  navRef.current = (target: string) => {
    setLandingOverride(false);
    setIsCartOpen(false);
    setActiveSection(target === 'open_orders' ? 'orders' : 'account');
  };
  const handleCtaAction = useCallback((action?: string) => {
    if (action?.startsWith('pay:')) { handlePaymentSelect(action.slice(4)); return; }
    if (action === 'view-orders') { navRef.current('open_orders'); return; }
    handleFinalizePurchase();
  }, [handlePaymentSelect, handleFinalizePurchase]);

  const handleQuickReplyWrapped = useCallback((reply: any) => {
    const chosen = handleChoice(reply);
    if (chosen) {
      if (typeof chosen === 'object') navRef.current(chosen.nav);
      return;
    }
    if (reply.type === 'custom' && reply.action === 'more_results') {
      handleMoreResults();
      return;
    }
    // Handle disambiguation quick-reply: add_product_{id}_qty_{n}
    if (reply.type === 'custom' && typeof reply.action === 'string' && reply.action.startsWith('add_product_')) {
      const match = reply.action.match(/^add_product_(.+)_qty_(\d+)$/);
      if (match) {
        const productId = match[1];
        const qty = parseInt(match[2]) || 1;
        const product = lastRecommendedProducts.find(p => p.id === productId);
        if (product) {
          handleAddToCart(product, qty);
          return;
        }
      }
    }
    handleQuickReply(reply);
  }, [handleQuickReply, handleMoreResults, lastRecommendedProducts, handleAddToCart, handleChoice]);

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

  const handleSendMessageWithPending = useCallback(async (message: string, forceNew?: boolean) => {
    commitDraft();
    if (pendingNewChat || forceNew) {
      // Duplicate-submit guard: prevent rapid double Enter/click from creating two baskets
      if (isCreatingBasketRef.current) return;
      isCreatingBasketRef.current = true;

      // Atomically: create basket + seed state + activate + send message
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
      setIsCartOpen(true);
      setActiveSection('active-cart');
      // Use sendMessageToBasket with the explicit newId to avoid stale closure on activeBasketId
      sendMessageToBasket(newId, message);

      // Release guard after a tick so React state settles
      setTimeout(() => { isCreatingBasketRef.current = false; }, 100);
      return;
    }
    handleSendMessage(message);
  }, [commitDraft, pendingNewChat, baskets, setBaskets, setActiveBasketId, setBasketStates, handleSendMessage, sendMessageToBasket]);

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
    setPendingNewChat(true);
  }, []);

  const handleLandingProductSelect = useCallback((product: Product) => {
    if (isCreatingBasketRef.current) return;
    isCreatingBasketRef.current = true;
    const newId = crypto.randomUUID();
    const newBasket: Basket = {
      id: newId,
      title: product.name,
      productId: product.id,
      isDraft: true,
      itemCount: 0,
      lastActivity: 'الان',
      savedItems: [],
      isSaved: false,
    };
    handledProductDeepLinkRef.current = product.id;
    const initialState = createDefaultBasketState();
    setBaskets(prev => [newBasket, ...prev.filter(b => !b.isDraft)]);
    setBasketStates(prev => ({
      ...prev,
      [newId]: seedProductConversation(initialState, product, 'پت آباد'),
    }));
    setActiveBasketId(newId);
    setPendingNewChat(false);
    setLandingOverride(false);
    setActiveSection('active-cart');
    setIsCartOpen(true);
    setTimeout(() => { isCreatingBasketRef.current = false; }, 100);
  }, [setActiveBasketId, setBasketStates, setBaskets]);

  const handleAddToCartCommitted = useCallback((...args: Parameters<typeof handleAddToCart>) => {
    commitDraft();
    return handleAddToCart(...args);
  }, [commitDraft, handleAddToCart]);

  const handleSignInClick = useCallback(() => {
    if (isAuthenticated) {
      setPendingNewChat(true);
      return;
    }
    setOtpContext('login');
    setShowOTPModal(true);
  }, [isAuthenticated]);

  // ── Deep linking: URL <-> view state ───────────────────────────────────
  // Landing: no params · New chat: ?chat=new · Chat: ?c=<basketId> · Account: ?tab=profile|orders
  useTelegramSession({ baskets, setBaskets, setActiveBasketId, setBasketStates, onOpened: handleBasketSelect });
  const [searchParams, setSearchParams] = useSearchParams();
  const [landingOverride, setLandingOverride] = useState(false);
  const lastSyncedRef = useRef<string | null>(null);
  const prevViewKeyRef = useRef<string | null>(null);
  const searchKey = searchParams.toString();
  const [urlOrderId, setUrlOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (searchKey === lastSyncedRef.current) return;
    lastSyncedRef.current = searchKey;
    const tab = searchParams.get('tab');
    const c = searchParams.get('c');
    const order = searchParams.get('order');
    const productId = searchParams.get('p');
    setUrlOrderId(order);
    if (productId && !(c && baskets.some(b => b.id === c))) return;
    if (order) {
      setLandingOverride(false);
      setPendingNewChat(false);
      setActiveSection('orders');
      setIsCartOpen(false);
    } else if (tab === 'orders' || tab === 'profile') {
      setLandingOverride(false);
      setPendingNewChat(false);
      setActiveSection(tab === 'orders' ? 'orders' : 'account');
      setIsCartOpen(false);
    } else if (searchParams.get('chat') === 'new') {
      setLandingOverride(false);
      setActiveSection('active-cart');
      setPendingNewChat(true);
    } else if (c && baskets.some(b => b.id === c)) {
      setLandingOverride(false);
      handleBasketSelect(c);
    } else {
      setActiveSection('active-cart');
      setPendingNewChat(false);
      setLandingOverride(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  useEffect(() => {
    const productId = searchParams.get('p');
    if (!productId || handledProductDeepLinkRef.current === productId) return;
    handledProductDeepLinkRef.current = productId;
    const c = searchParams.get('c');
    if (c && baskets.some(b => b.id === c)) return; // owner's own session
    const openFreshPdp = () => {
      void supabase.from('pet_products').select('*').eq('id', productId).maybeSingle().then(({ data, error }) => {
        if (error || !data) {
          handledProductDeepLinkRef.current = null;
          setSearchParams({}, { replace: true });
          return;
        }
        handleLandingProductSelect(mapDbProduct(data));
      });
    };
    if (!c) { openFreshPdp(); return; }
    // Shared ?p&c link: RLS only returns the basket to its owner; anyone else gets a fresh PDP.
    void supabase.from('baskets').select('id').eq('id', c).maybeSingle().then(({ data }) => {
      if (data) setPendingOwnedC(c);
      else openFreshPdp();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleLandingProductSelect, searchParams, setSearchParams]);

  useEffect(() => {
    if (!pendingOwnedC || !baskets.some(b => b.id === pendingOwnedC)) return;
      setLandingOverride(false);
      handleBasketSelect(pendingOwnedC);
    setPendingOwnedC(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOwnedC, baskets]);

  const inChat = !landingOverride && hasStartedChat;
  useEffect(() => {
    const viewKey = [activeSection, pendingNewChat, inChat, activeBasketId, urlOrderId, isDraftActive].join('|');
    const isFirst = prevViewKeyRef.current === null;
    const unchanged = prevViewKeyRef.current === viewKey;
    prevViewKeyRef.current = viewKey;
    if (isFirst || unchanged) return;
    const next = new URLSearchParams();
    if (activeSection === 'orders' && urlOrderId) next.set('order', urlOrderId);
    else if (activeSection === 'orders') next.set('tab', 'orders');
    else if (activeSection === 'account') next.set('tab', 'profile');
    else if (pendingNewChat) next.set('chat', 'new');
    else if (inChat) {
      if (activeBasketMeta?.productId) next.set('p', activeBasketMeta.productId);
      if (!isDraftActive) next.set('c', activeBasketId);
    }
    const nextKey = next.toString();
    if (nextKey === searchKey) return;
    lastSyncedRef.current = nextKey;
    setSearchParams(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, pendingNewChat, inChat, activeBasketId, urlOrderId, isDraftActive]);

  const handleSendFromUI = useCallback((message: string, forceNew?: boolean) => {
    const force = forceNew || landingOverride;
    setLandingOverride(false);
    handleSendMessageWithPending(message, force);
  }, [landingOverride, handleSendMessageWithPending]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="petabad-theme flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {(inChat || pendingNewChat) && (
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          cartItemCount={cartItems.length}
          activeOrderCount={dbOrders.length}
          baskets={baskets.filter(b => !b.isDraft)}
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
          initialOrderId={urlOrderId}
          onSelectedOrderChange={setUrlOrderId}
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
          onSendMessage={handleSendFromUI}
            onStop={handleStop}
            onResend={handleResend}
            onFeedback={handleFeedback}
          onAddToCart={handleAddToCartCommitted}
          onCompare={handleCompare}
          onSaveProduct={handleSaveProduct}
          cartItems={cartItems}
          isProcessing={isProcessing}
          onCheckout={handleCheckout}
          hasStartedChat={pendingNewChat ? true : inChat}
          isPendingNewChat={pendingNewChat}
          onStartChat={handleStartChat}
          isCartOpen={isCartOpen}
          onSignIn={handleSignInClick}
          savedProductIds={savedProductIds}
          onInlineProductDetails={handleInlineProductDetails}
          onQuickReply={handleQuickReplyWrapped}
          onFinalizePurchase={handleCtaAction}
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
          onProductSelect={handleLandingProductSelect}
        />
      )}

      {inChat && (
        <RightPanel
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
          onAddToCart={handleAddToCartCommitted}
          isOpen={isCartOpen}
          onToggle={() => setIsCartOpen(!isCartOpen)}
          onAICheckout={handleFinalizePurchase}
          showAICheckout={false}
        />
      )}

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
