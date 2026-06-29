// Single-vendor data layer for /shift. Re-exports gpt-commerce types/helpers
// but collapses the multi-merchant model into a single store derived from
// SHIFT_STORE config. UI code reads `merchants[0]` everywhere it used to
// pick a vendor, so every product/cart row/order group resolves to one store.

import { SHIFT_STORE } from "@/features/shift/config/store";
import type {
  Merchant,
  Product,
  CartItem,
  OrderSummary,
  VendorOrderSummary,
} from "@/features/shift/data/shiftData";

export * from "@/features/shift/data/shiftData";

// The single store, masquerading as a Merchant so existing types keep working.
export const SHIFT_MERCHANT: Merchant = {
  id: "shift-store",
  name: SHIFT_STORE.name_fa,
  logo: "🏬",
};

// Override merchants list — single entry. Any code that did
// `merchants[idx]` now resolves to the same store.
export const merchants: Merchant[] = [SHIFT_MERCHANT];

// Flat single-vendor order summary. Still returns the OrderSummary shape so
// existing renderers keep compiling, but vendorSummaries always has length 1.
export const calculateOrderSummary = (cartItems: CartItem[]): OrderSummary => {
  const items = cartItems.map((it) => ({ ...it, merchant: SHIFT_MERCHANT }));
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = items.some((i) => !i.fastDelivery) ? 35000 : 0;
  const discount = items.reduce((s, i) => {
    if (i.originalPrice && i.originalPrice > i.price) {
      return s + (i.originalPrice - i.price) * i.quantity;
    }
    return s;
  }, 0);
  const total = subtotal + deliveryFee;
  const vendor: VendorOrderSummary = {
    merchant: SHIFT_MERCHANT,
    items,
    subtotal,
    deliveryFee,
    discount,
    total,
  };
  return {
    vendorSummaries: items.length > 0 ? [vendor] : [],
    totalItems: items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    totalDelivery: deliveryFee,
    totalDiscount: discount,
    grandTotal: total,
  };
};

// Helper to force any product onto the single store. Used by mapDbProduct
// in shift hooks/components so DB rows that lack merchant_id still resolve.
export const withShiftMerchant = <T extends { merchant?: Merchant }>(p: T): T => ({
  ...p,
  merchant: SHIFT_MERCHANT,
});
