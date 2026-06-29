// Single-vendor data layer for /shift. Re-exports gpt-commerce types/helpers
// but collapses the multi-merchant model into a single store derived from
// SHIFT_STORE config.
import { SHIFT_STORE } from "@/features/shift/config/store";
import * as GPT from "@/data/gptCommerceData";

export * from "@/data/gptCommerceData";

// The single store, masquerading as a Merchant so existing types keep working.
export const SHIFT_MERCHANT: GPT.Merchant = {
  id: "shift-store",
  name: SHIFT_STORE.name_fa,
  logo: "🏬",
};

// Override merchants list — single entry. Any code that did
// `merchants[idx]` now resolves to the same store.
export const merchants: GPT.Merchant[] = [SHIFT_MERCHANT];

// Flat single-vendor order summary.
export const calculateOrderSummary = (cartItems: GPT.CartItem[]): GPT.OrderSummary => {
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
  const vendor: GPT.VendorOrderSummary = {
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

// Helper to force any product onto the single store.
export const withShiftMerchant = <T extends { merchant?: GPT.Merchant }>(p: T): T => ({
  ...p,
  merchant: SHIFT_MERCHANT,
});
