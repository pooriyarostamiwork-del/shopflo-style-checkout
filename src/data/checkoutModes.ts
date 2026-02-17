import { CheckoutModeConfig, UpsellProduct, CouponTier } from "@/types/checkout";

export const checkoutModes: CheckoutModeConfig[] = [
  {
    id: "cross-market-retargeting",
    name: "Smart Cross-Market Retargeting",
    description: "Track users across stores and pull them back with dynamic offers",
    tagline: "Looks like you're still considering those headphones",
    badge: "🎯 Cross-Store Tracking Active",
    incentiveMessage: "Complete your order here and save 10% now",
    crossStoreData: {
      storeName: "TechWorld",
      itemsInCart: 2,
      discount: 10
    },
    header: {
      title: "Complete your order in 10 seconds",
      subtitle: "No login required — fast & secure"
    }
  },
  {
    id: "floating-cart",
    name: "Floating Cart Across Stores",
    description: "Universal cart that follows users across multiple merchants",
    tagline: "Your cart travels with you",
    badge: "🛒 Persistent Cart — Active across stores",
    crossStoreData: {
      storeName: "TechWorld",
      itemsInCart: 3,
      discount: 10
    },
    header: {
      title: "Express Checkout",
      subtitle: "Secure one-step purchase"
    }
  },
  {
    id: "ai-abandonment",
    name: "AI Abandonment Reasoning",
    description: "AI understands why users abandoned and responds intelligently",
    tagline: "We know what stopped you last time",
    badge: "🤖 AI-Powered Recovery",
    abandonmentReason: "Last time you dropped off due to shipping cost. Free shipping applied now!",
    incentiveMessage: "We've fixed the issue that stopped you before",
    header: {
      title: "Fast checkout with free returns",
      subtitle: "Complete your purchase with confidence"
    }
  },
  {
    id: "loyalty-network",
    name: "Loyalty Network (FlowPoints)",
    description: "Earn points across stores, redeem anywhere in the network",
    tagline: "Earn rewards across all your purchases",
    badge: "⭐ FlowPoints Active",
    loyaltyPoints: 35,
    incentiveMessage: "Redeem across 200+ partnered merchants",
    header: {
      title: "Earn FlowPoints with every purchase",
      subtitle: "Redeem anywhere in the network"
    }
  },
  {
    id: "smart-upsell",
    name: "Smart Upsell Optimization",
    description: "AI-driven product recommendations based on purchase probability",
    tagline: "Personalized just for you",
    badge: "🎯 Smart Recommendations",
    incentiveMessage: "Recommended because similar buyers added these",
    header: {
      title: "Personalized Checkout Experience",
      subtitle: "Curated recommendations just for you"
    }
  },
  {
    id: "incentive-strategy",
    name: "Incentive & Coupon Strategy",
    description: "Gamified discount tiers that motivate purchases",
    tagline: "Unlock better rewards as you shop",
    badge: "🎁 Progressive Rewards Active",
    incentiveMessage: "You're close to unlocking the next tier!",
    header: {
      title: "Special holiday checkout",
      subtitle: "Guaranteed delivery by Tuesday"
    }
  }
];

export const upsellProducts: UpsellProduct[] = [
  {
    id: 101,
    name: "Leather Laptop Sleeve",
    price: 299000,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200&h=200&fit=crop",
    category: "Accessories",
    variants: [
      {
        type: "size",
        options: [
          { id: "13inch", name: "۱۳ اینچ", priceModifier: 0 },
          { id: "15inch", name: "۱۵ اینچ", priceModifier: 50000 },
          { id: "17inch", name: "۱۷ اینچ", priceModifier: 100000 }
        ]
      },
      {
        type: "color",
        options: [
          { id: "black", name: "مشکی", priceModifier: 0 },
          { id: "brown", name: "قهوه‌ای", priceModifier: 20000 }
        ]
      }
    ]
  },
  {
    id: 102,
    name: "Wireless Mouse",
    price: 499000,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop",
    category: "Accessories",
    variants: [
      {
        type: "color",
        options: [
          { id: "black", name: "مشکی", priceModifier: 0 },
          { id: "white", name: "سفید", priceModifier: 0 },
          { id: "silver", name: "نقره‌ای", priceModifier: 50000 }
        ]
      }
    ]
  },
  {
    id: 103,
    name: "USB-C Hub",
    price: 799000,
    image: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=200&h=200&fit=crop",
    category: "Accessories",
    variants: [
      {
        type: "pack",
        options: [
          { id: "single", name: "تکی", priceModifier: 0 },
          { id: "pack2", name: "بسته ۲ عددی", priceModifier: 600000 },
          { id: "pack3", name: "بسته ۳ عددی", priceModifier: 1100000 }
        ]
      }
    ]
  },
  {
    id: 104,
    name: "Phone Stand",
    price: 199000,
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200&h=200&fit=crop",
    category: "Accessories",
    variants: [
      {
        type: "color",
        options: [
          { id: "black", name: "مشکی", priceModifier: 0 },
          { id: "white", name: "سفید", priceModifier: 0 },
          { id: "rose-gold", name: "رزگلد", priceModifier: 30000 }
        ]
      }
    ]
  },
  {
    id: 105,
    name: "Cable Organizer",
    price: 149000,
    image: "https://images.unsplash.com/photo-1572461024650-4e4f5e3092c1?w=200&h=200&fit=crop",
    category: "Accessories",
    variants: [
      {
        type: "size",
        options: [
          { id: "small", name: "کوچک (۵ شیار)", priceModifier: 0 },
          { id: "medium", name: "متوسط (۱۰ شیار)", priceModifier: 50000 },
          { id: "large", name: "بزرگ (۱۵ شیار)", priceModifier: 100000 }
        ]
      }
    ]
  }
];

export const couponTiers: CouponTier[] = [
  {
    threshold: 999000,
    reward: "Free Shipping",
    type: "shipping"
  },
  {
    threshold: 1500000,
    reward: "10% OFF",
    type: "discount",
    value: 150000
  },
  {
    threshold: 2000000,
    reward: "Free Gift",
    type: "gift"
  },
  {
    threshold: 3000000,
    reward: "15% OFF",
    type: "discount",
    value: 450000
  }
];
