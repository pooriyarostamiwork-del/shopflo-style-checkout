export type CheckoutMode = 
  | "cross-market-retargeting"
  | "floating-cart"
  | "ai-abandonment"
  | "loyalty-network"
  | "smart-upsell"
  | "incentive-strategy";

export interface CheckoutModeConfig {
  id: CheckoutMode;
  name: string;
  description: string;
  tagline: string;
  badge?: string;
  incentiveMessage?: string;
  abandonmentReason?: string;
  loyaltyPoints?: number;
  crossStoreData?: {
    storeName: string;
    itemsInCart: number;
    discount: number;
  };
  header?: {
    title: string;
    subtitle?: string;
  };
}

export interface ProductVariant {
  id: string;
  name: string;
  priceModifier: number;
}

export interface UpsellProduct {
  id: number;
  name: string;
  price: number;
  image: string;
  category?: string;
  variants?: {
    type: string;
    options: ProductVariant[];
  }[];
}

export interface CouponTier {
  threshold: number;
  reward: string;
  type: "shipping" | "discount" | "gift";
  value?: number;
}
