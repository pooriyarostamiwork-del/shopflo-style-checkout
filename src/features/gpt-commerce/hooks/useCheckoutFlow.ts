import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ChatMessage,
  CartItem,
  Product,
  AgenticState,
  QuickReply,
  PaymentMethod,
  DeliveryAddress,
  paymentOptions,
  calculateOrderSummary,
} from "@/data/gptCommerceData";
import { BasketState, createDefaultBasketState } from "./useBasketState";

interface MerchantShippingMethod {
  id: string;
  label: string;
  deliveryWindow: string;
  priceLabel: string;
  isDefault: boolean;
}

interface MerchantShippingGroup {
  merchant: CartItem['merchant'];
  methods: MerchantShippingMethod[];
}

interface UseCheckoutFlowProps {
  updateCurrentBasket: (updater: (prev: BasketState) => BasketState) => void;
  globalAddresses: DeliveryAddress[];
  isAuthenticated: boolean;
  isOTPVerified: boolean;
  isNewUser: boolean;
  setDbOrders: (orders: any[]) => void;
  cartItems: CartItem[];
  hasStartedChat: boolean;
  agenticState: AgenticState;
  selectedShippingByMerchant: Record<string, string>;
  basketStates: Record<string, BasketState>;
  activeBasketId: string;
  setShowOTPModal: (v: boolean) => void;
  setShowCheckout: (v: boolean) => void;
  setShowSuccess: (v: boolean) => void;
}

export const useCheckoutFlow = ({
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
  setShowCheckout,
  setShowSuccess,
}: UseCheckoutFlowProps) => {

  const getMerchantShipping = useCallback((): MerchantShippingGroup[] => {
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

  // Pre-populate shipping defaults on address step entry
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
        content: 'برای مشاهده و پیگیری سفارش‌هایت، به بخش «سفارش‌ها» مراجعه کن.',
        ctaButton: { label: '📦 مشاهده سفارش‌ها', action: 'view-orders', disabled: false },
        timestamp: new Date(),
      };
      updateCurrentBasket(s => ({ ...s, messages: [...s.messages, trackMessage] }));
    }
  }, [globalAddresses, isNewUser, isOTPVerified, updateCurrentBasket, setShowOTPModal]);

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
  }, [globalAddresses, updateCurrentBasket, setShowOTPModal]);

  const handleAddressSelect = useCallback((addressId: string) => {
    const selectedAddr = globalAddresses.find(a => a.id === addressId);
    updateCurrentBasket(s => ({
      ...s,
      selectedAddressId: addressId,
      agenticState: selectedAddr ? { ...s.agenticState, selectedAddress: selectedAddr } : s.agenticState,
    }));
  }, [globalAddresses, updateCurrentBasket]);

  const handleSelectShipping = useCallback((merchantId: string, shippingId: string) => {
    updateCurrentBasket(s => ({
      ...s,
      selectedShippingByMerchant: { ...s.selectedShippingByMerchant, [merchantId]: shippingId },
    }));
  }, [updateCurrentBasket]);

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

  const handleAddNewAddress = useCallback(async (addr: Omit<DeliveryAddress, "id">) => {
    const id = `addr-${Date.now()}`;
    const created: DeliveryAddress = { id, ...addr, recipientName: addr.recipientName || '', phone: addr.phone || '' };

    if (isAuthenticated) {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      const { data } = await supabase.from('user_addresses').insert({
        user_id: userId,
        title: addr.title,
        full_address: addr.fullAddress,
        recipient_name: addr.recipientName || '',
        phone: addr.phone || '',
        is_default: false,
      }).select().single();
      if (data) created.id = data.id;
    }

    updateCurrentBasket(s => {
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
        selectedAddressId: created.id,
        agenticState: { ...s.agenticState, selectedAddress: created, hasStoredCheckoutDetails: true },
      };
    });
  }, [updateCurrentBasket, isAuthenticated]);

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

    setTimeout(async () => {
      const orderId = `FLC-${Date.now().toString().slice(-6)}`;

      if (isAuthenticated) {
        const currentBasketState = basketStates[activeBasketId] || createDefaultBasketState();
        const orderSummary = calculateOrderSummary(currentBasketState.cartItems);
        const selectedAddr = globalAddresses.find(a => a.id === currentBasketState.selectedAddressId);

        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (userId) {
          await supabase.from('orders').insert({
            user_id: userId,
            order_number: orderId,
            items: currentBasketState.cartItems.map(item => ({
              id: item.id, name: item.name, price: item.price,
              quantity: item.quantity, image: item.image,
            })) as any,
            merchant_groups: orderSummary.vendorSummaries.map(vs => ({
              merchant: vs.merchant,
              items: vs.items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
              shippingMethod: currentBasketState.selectedShippingByMerchant[vs.merchant.id] || 'standard',
              subtotal: vs.subtotal,
              deliveryFee: vs.deliveryFee,
              discount: vs.discount,
              total: vs.total,
            })) as any,
            delivery_address: (selectedAddr ? {
              title: selectedAddr.title,
              fullAddress: selectedAddr.fullAddress,
              recipientName: selectedAddr.recipientName,
              phone: selectedAddr.phone,
            } : {}) as any,
            payment_method: paymentId,
            subtotal: orderSummary.subtotal,
            total_shipping: orderSummary.totalDelivery,
            total_discount: orderSummary.totalDiscount,
            total: orderSummary.grandTotal,
          } as any);
        }

        const { data: updatedOrders } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (updatedOrders) setDbOrders(updatedOrders);
      }

      const successMessage: ChatMessage = {
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: `سفارشت با موفقیت ثبت شد! 🎉\n\nشماره سفارش: ${orderId}\n\nمی‌تونی از بخش «سفارش‌ها» وضعیت سفارشت رو پیگیری کنی.`,
        quickReplies: [
          { id: 'track', label: '📦 پیگیری سفارش', type: 'track-order' },
          { id: 'continue', label: '🛍️ ادامه خرید', type: 'add-more' },
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
  }, [updateCurrentBasket, isAuthenticated, basketStates, activeBasketId, globalAddresses, setDbOrders]);

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

  const handleCheckout = useCallback(() => {
    if (cartItems.length > 0) setShowCheckout(true);
  }, [cartItems.length, setShowCheckout]);

  const handleCheckoutSuccess = useCallback(() => {
    setShowCheckout(false);
    setShowSuccess(true);
    updateCurrentBasket(s => ({ ...s, cartItems: [] }));
  }, [updateCurrentBasket, setShowCheckout, setShowSuccess]);

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false);
    const postPurchaseMessage: ChatMessage = {
      id: `post-${Date.now()}`,
      role: 'assistant',
      content: 'خرید با موفقیت انجام شد 🎉\nمی‌خوای پیگیری سفارش رو انجام بدم؟',
      timestamp: new Date(),
    };
    updateCurrentBasket(s => ({ ...s, messages: [...s.messages, postPurchaseMessage] }));
  }, [updateCurrentBasket, setShowSuccess]);

  return {
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
  };
};
