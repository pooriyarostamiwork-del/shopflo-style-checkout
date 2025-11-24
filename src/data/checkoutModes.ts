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
    price: 299,
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200&h=200&fit=crop",
    category: "Accessories",
    variants: [
      {
        type: "size",
        options: [
          { id: "13inch", name: "13 inch", priceModifier: 0 },
          { id: "15inch", name: "15 inch", priceModifier: 50 },
          { id: "17inch", name: "17 inch", priceModifier: 100 }
        ]
      },
      {
        type: "color",
        options: [
          { id: "black", name: "Black", priceModifier: 0 },
          { id: "brown", name: "Brown", priceModifier: 20 }
        ]
      }
    ]
  },
  {
    id: 102,
    name: "Wireless Mouse",
    price: 499,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop",
    category: "Accessories",
    variants: [
      {
        type: "color",
        options: [
          { id: "black", name: "Black", priceModifier: 0 },
          { id: "white", name: "White", priceModifier: 0 },
          { id: "silver", name: "Silver", priceModifier: 50 }
        ]
      }
    ]
  },
  {
    id: 103,
    name: "USB-C Hub",
    price: 799,
    image: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=200&h=200&fit=crop",
    category: "Accessories",
    variants: [
      {
        type: "pack",
        options: [
          { id: "single", name: "Single", priceModifier: 0 },
          { id: "pack2", name: "Pack of 2", priceModifier: 600 },
          { id: "pack3", name: "Pack of 3", priceModifier: 1100 }
        ]
      }
    ]
  },
  {
    id: 104,
    name: "Phone Stand",
    price: 199,
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200&h=200&fit=crop",
    category: "Accessories",
    variants: [
      {
        type: "color",
        options: [
          { id: "black", name: "Black", priceModifier: 0 },
          { id: "white", name: "White", priceModifier: 0 },
          { id: "rose-gold", name: "Rose Gold", priceModifier: 30 }
        ]
      }
    ]
  },
  {
    id: 105,
    name: "Cable Organizer",
    price: 149,
    image: "https://images.unsplash.com/photo-1572461024650-4e4f5e3092c1?w=200&h=200&fit=crop",
    category: "Accessories",
    variants: [
      {
        type: "size",
        options: [
          { id: "small", name: "Small (5 slots)", priceModifier: 0 },
          { id: "medium", name: "Medium (10 slots)", priceModifier: 50 },
          { id: "large", name: "Large (15 slots)", priceModifier: 100 }
        ]
      }
    ]
  }
];

export const couponTiers: CouponTier[] = [
  {
    threshold: 999,
    reward: "Free Shipping",
    type: "shipping"
  },
  {
    threshold: 1500,
    reward: "10% OFF",
    type: "discount",
    value: 10
  },
  {
    threshold: 2000,
    reward: "Free Gift",
    type: "gift"
  },
  {
    threshold: 3000,
    reward: "15% OFF",
    type: "discount",
    value: 15
  }
];
