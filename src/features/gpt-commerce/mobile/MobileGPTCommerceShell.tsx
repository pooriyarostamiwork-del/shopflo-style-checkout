import { useState, useCallback, useEffect, useRef } from "react";
import { Zap, SquarePen } from "lucide-react";
import { CategorySelector } from "@/components/gpt-commerce/CategorySelector";
import { Basket } from "@/components/gpt-commerce/Sidebar";
import { AccountPanel } from "@/components/gpt-commerce/AccountPanel";
import { CheckoutModalLocalized } from "@/components/CheckoutModalLocalized";
import { SuccessScreenLocalized } from "@/components/SuccessScreenLocalized";
import { OTPModal } from "@/components/gpt-commerce/OTPModal";
import { useAuth } from "@/contexts/AuthContext";
import { toPersianNumber, merchants } from "@/data/gptCommerceData";
import { checkoutModes, upsellProducts, couponTiers } from "@/data/checkoutModes";
import { useBasketState, createDefaultBasketState } from "../hooks/useBasketState";
import { useUserData } from "../hooks/useUserData";
import { useCheckoutFlow } from "../hooks/useCheckoutFlow";
import { useAgentMessages } from "../hooks/useAgentMessages";
import { useCartPersistence } from "../hooks/useCartPersistence";
import { MobileChatLanding } from "./MobileChatLanding";
import { MobileChatThread } from "./MobileChatThread";
import { MobileBottomSheet, MobileSheetTab } from "./MobileBottomSheet";

export const MobileGPTCommerceShell = () => {
  const { isAuthenticated, profile, isNewUser: authIsNewUser, signOut, updateProfileName } = useAuth();

  const {
    baskets, setBaskets,
    activeBasketId, setActiveBasketId,
    basketStates, setBasketStates,
    currentState, updateCurrentBasket,
  } = useBasketState();

  const {
    globalAddresses,
    dbOrders, setDbOrders,
    handleAccountAddAddress,
    handleAccountDeleteAddress,
    handleAccountUpdateAddress,
  } = useUserData({ isAuthenticated });

  useCartPersistence({
    isAuthenticated,
    activeBasketId,
    currentState,
    basketStates,
    baskets,
    setBaskets,
    setActiveBasketId,
    setBasketStates,
  });

  // UI state
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpContext, setOtpContext] = useState<"checkout" | "login">("login");
  const [pendingNewChat, setPendingNewChat] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<MobileSheetTab>("cart");
  const [showAccountFull, setShowAccountFull] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const isCreatingBasketRef = useRef(false);

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

  // Use a noop "setIsCartOpen" — the checkout flow opens the sheet via our wrapper
  const noopSetCartOpen = useCallback(() => {}, []);

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
    onFinalizeBasket: useCallback(() => {
      setBaskets(prev => prev.map(b => b.id === activeBasketId ? { ...b, isSaved: true } : b));
      const newBasket: Basket = {
        id: crypto.randomUUID(),
        title: "سبد جدید",
        itemCount: 0,
        lastActivity: "الان",
        savedItems: [],
        isSaved: false,
      };
      setBaskets(prev => [newBasket, ...prev]);
      setBasketStates(prev => ({ ...prev, [newBasket.id]: createDefaultBasketState() }));
    }, [activeBasketId, setBaskets, setBasketStates]),
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
    setIsCartOpen: noopSetCartOpen,
    setShowOTPModal,
    setOtpContext,
    cartItems,
    messages,
    lastRecommendedProducts,
  });

  const handleQuickReplyWrapped = useCallback((reply: any) => {
    if (reply.type === "custom" && reply.action === "more_results") {
      handleMoreResults();
      return;
    }
    if (reply.type === "custom" && typeof reply.action === "string" && reply.action.startsWith("add_product_")) {
      const m = reply.action.match(/^add_product_(.+)_qty_(\d+)$/);
      if (m) {
        const productId = m[1];
        const qty = parseInt(m[2]) || 1;
        const product = lastRecommendedProducts.find(p => p.id === productId);
        if (product) {
          handleAddToCart(product, qty);
          return;
        }
      }
    }
    handleQuickReply(reply);
  }, [handleQuickReply, handleMoreResults, lastRecommendedProducts, handleAddToCart]);

  // Sync basket item counts
  useEffect(() => {
    setBaskets(prev => prev.map(b =>
      b.id === activeBasketId ? { ...b, itemCount: cartItems.length } : b
    ));
  }, [cartItems.length, activeBasketId, setBaskets]);

  // Send message; also creates a new basket if needed
  const handleSendMessageWithPending = useCallback(async (message: string, forceNew?: boolean) => {
    if (pendingNewChat || forceNew || !hasStartedChat) {
      if (isCreatingBasketRef.current) return;
      isCreatingBasketRef.current = true;
      const existingNew = baskets.filter(b => b.title.startsWith("سبد جدید") && !b.isSaved);
      let newTitle = "سبد جدید";
      if (existingNew.length > 0) {
        newTitle = `سبد جدید ${toPersianNumber(existingNew.length + 1)}`;
      }
      const newId = crypto.randomUUID();
      const newBasket: Basket = {
        id: newId,
        title: newTitle,
        itemCount: 0,
        lastActivity: "الان",
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
      sendMessageToBasket(newId, message);
      setTimeout(() => { isCreatingBasketRef.current = false; }, 100);
      return;
    }
    handleSendMessage(message);
  }, [pendingNewChat, hasStartedChat, baskets, setBaskets, setActiveBasketId, setBasketStates, handleSendMessage, sendMessageToBasket]);

  const handleCreateBasket = useCallback(() => {
    setPendingNewChat(true);
    // After the next message, a new basket will be created
    // For now, reset to the landing-like state by clearing active basket reference
    // We use pendingNewChat flag to render landing
  }, []);

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
        setPendingNewChat(true);
      }
    }
  }, [baskets, activeBasketId, setBaskets, setActiveBasketId, setBasketStates]);

  const handleBasketSelect = useCallback((basketId: string) => {
    setPendingNewChat(false);
    setActiveBasketId(basketId);
    setBasketStates(prev => {
      const bs = prev[basketId];
      if (bs) return {
        ...prev,
        [basketId]: {
          ...bs,
          hasStartedChat: true,
          agenticState: { ...bs.agenticState, step: "idle" },
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

  const handleSignInClick = useCallback(() => {
    if (isAuthenticated) return;
    setOtpContext("login");
    setShowOTPModal(true);
  }, [isAuthenticated]);

  const totalPrice = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const checkoutCartItems = cartItems.map(item => ({
    id: parseInt(item.id.replace("p", "")),
    name: item.name,
    price: item.price / 100,
    originalPrice: item.originalPrice ? item.originalPrice / 100 : undefined,
    quantity: item.quantity,
    image: item.image,
    inStock: item.inStock,
  }));

  const activeAddressIds = Object.values(basketStates)
    .map(s => s.selectedAddressId)
    .filter((id): id is string => !!id);

  const onLanding = pendingNewChat || !hasStartedChat;

  // ── Account full screen overlay ────────────────────────────────────────
  if (showAccountFull) {
    return (
      <div className="h-[100dvh] overflow-y-auto bg-background" dir="rtl">
        <AccountPanel
          onBack={() => setShowAccountFull(false)}
          addresses={globalAddresses}
          onAddAddress={handleAccountAddAddress}
          onDeleteAddress={handleAccountDeleteAddress}
          onUpdateAddress={handleAccountUpdateAddress}
          activeAddressIds={activeAddressIds}
          initialTab="profile"
          onStartNewChat={() => {
            setShowAccountFull(false);
            setPendingNewChat(true);
          }}
          orders={dbOrders}
          userProfile={profile ? { name: profile.full_name || "", phone: profile.phone, email: "" } : undefined}
          isAuthenticated={isAuthenticated}
          onSignOut={signOut}
          onUpdateProfileName={updateProfileName}
        />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-b from-background via-background to-primary/5" dir="rtl">
      {/* Mobile top header */}
      <header
        className="flex items-center justify-between px-3 py-2.5 border-b flex-shrink-0"
        style={{
          background: "hsl(0 0% 100%)",
          borderColor: "hsl(0 0% 0% / 0.06)",
          paddingTop: "max(0.625rem, env(safe-area-inset-top))",
        }}
      >
        <div className="flex items-center gap-2 mobile-cat-selector">
          <CategorySelector
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          <style>{`
            /* Trigger chip — 35% bigger than previous mobile-shrunk size */
            .mobile-cat-selector > button {
              padding: 0.405rem 0.74rem !important;
              font-size: 0.84rem !important;
              font-weight: 400 !important;
              letter-spacing: -0.01em !important;
              border-radius: 0.74rem !important;
              gap: 0.47rem !important;
              line-height: 1.1 !important;
              box-shadow: none !important;
              border: 1px solid hsl(0 0% 0% / 0.12) !important;
              background: hsl(0 0% 100%) !important;
              height: 2.25rem !important;
            }
            .mobile-cat-selector > button svg { width: 0.945rem !important; height: 0.945rem !important; }
            /* New-chat button: same vertical size + matching stroke */
            .mobile-new-chat-btn {
              height: 2.25rem !important;
              width: 2.25rem !important;
              padding: 0 !important;
              border-radius: 0.74rem !important;
              border: 1px solid hsl(0 0% 0% / 0.12) !important;
              background: hsl(0 0% 100%) !important;
              box-shadow: none !important;
            }
            /* Dropdown menu — 40% smaller (mobile only) */
            @media (max-width: 640px) {
              [data-radix-popper-content-wrapper] [role="menu"] {
                min-width: 0 !important;
                width: 8.4rem !important;
                padding: 0.3rem !important;
              }
              [data-radix-popper-content-wrapper] [role="menuitem"] {
                padding: 0.36rem 0.6rem !important;
                min-height: 1.65rem !important;
                font-size: 0.7rem !important;
                gap: 0.45rem !important;
                border-radius: 0.4rem !important;
              }
              [data-radix-popper-content-wrapper] [role="menuitem"] svg {
                width: 0.8rem !important;
                height: 0.8rem !important;
              }
              [data-radix-popper-content-wrapper] [role="menuitem"] span {
                font-size: 0.72rem !important;
              }
            }
          `}</style>
        </div>
        <div className="flex items-center gap-2">
          {!onLanding && (
            <>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                }}
              >
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold">Flowcart</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPendingNewChat(true)}
            className="mobile-new-chat-btn flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            aria-label="چت جدید"
            title="چت جدید"
          >
            <MessageSquarePlus style={{ width: "1.25rem", height: "1.25rem" }} className="text-foreground/80" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {onLanding ? (
          <MobileChatLanding
            onSendMessage={handleSendMessageWithPending}
            onAddToCart={handleAddToCart}
            cartItems={cartItems}
            isProcessing={isProcessing}
            isAuthenticated={isAuthenticated}
            userFirstName={profile?.full_name?.split(" ")[0]}
            onOpenBaskets={() => { setSheetTab("baskets"); setSheetOpen(true); }}
            onOpenCart={() => { setSheetTab("cart"); setSheetOpen(true); }}
            onOpenAccount={() => { setSheetTab("account"); setSheetOpen(true); }}
          />
        ) : (
          <MobileChatThread
            messages={messages}
            onSendMessage={handleSendMessageWithPending}
            onAddToCart={handleAddToCart}
            onCompare={handleCompare}
            onSaveProduct={handleSaveProduct}
            cartItems={cartItems}
            isProcessing={isProcessing}
            savedProductIds={baskets.find(b => b.id === activeBasketId)?.savedItems.map(i => i.productId) || []}
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
            onBack={() => setPendingNewChat(true)}
            onNewChat={() => setPendingNewChat(true)}
            onOpenBaskets={() => { setSheetTab("baskets"); setSheetOpen(true); }}
            onOpenCart={() => { setSheetTab("cart"); setSheetOpen(true); }}
            onOpenAccount={() => { setSheetTab("account"); setSheetOpen(true); }}
          />
        )}
      </div>

      {/* Bottom sheet */}
      <MobileBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tab={sheetTab}
        onTabChange={setSheetTab}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        onAICheckout={handleFinalizePurchase}
        showAICheckout={!hasStartedChat}
        baskets={baskets.filter(b => !b.isSaved)}
        activeBasketId={activeBasketId}
        onBasketSelect={handleBasketSelect}
        onCreateBasket={handleCreateBasket}
        onDeleteBasket={handleDeleteBasket}
        isAuthenticated={isAuthenticated}
        userFirstName={profile?.full_name?.split(" ")[0]}
        onSignIn={handleSignInClick}
        onSignOut={signOut}
        onOpenAccountFull={() => setShowAccountFull(true)}
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
        onVerified={(isNew) => {
          if (otpContext === "checkout") {
            handleOTPVerified(isNew);
          } else {
            setShowOTPModal(false);
          }
        }}
      />
    </div>
  );
};
