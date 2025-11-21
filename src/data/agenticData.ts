export interface Merchant {
  id: string;
  name: string;
  logo: string;
  type: "marketplace" | "d2c";
  SLA_score: number;
  delivery_time: string;
  promotion_bid: number;
  eNAMAD_verified: boolean;
  story?: string;
  benefits?: string[];
  customHeader?: {
    title: string;
    subtitle?: string;
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  merchant_id: string;
  rating: number;
  reviews_count: number;
  pros?: string[];
  cons?: string[];
  category: string;
  delivery_days: number;
  stock: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  products?: Product[];
  action?: "show_products" | "order_confirmation" | "order_status";
}

export const merchants: Merchant[] = [
  {
    id: "m1",
    name: "QuickMart Electronics",
    logo: "🏪",
    type: "marketplace",
    SLA_score: 4.2,
    delivery_time: "2-3 days",
    promotion_bid: 2.5,
    eNAMAD_verified: true,
  },
  {
    id: "m2",
    name: "TechHub Direct",
    logo: "🔧",
    type: "marketplace",
    SLA_score: 4.5,
    delivery_time: "1-2 days",
    promotion_bid: 3.0,
    eNAMAD_verified: true,
  },
  {
    id: "m3",
    name: "Premium Audio Co.",
    logo: "🎵",
    type: "d2c",
    SLA_score: 4.8,
    delivery_time: "2-4 days",
    promotion_bid: 4.5,
    eNAMAD_verified: true,
    story: "Premium brand since 2010 – Over 2M happy customers worldwide",
    benefits: [
      "2-year warranty on all products",
      "Hand-crafted with premium materials",
      "30-day money-back guarantee",
    ],
    customHeader: {
      title: "Thank you for choosing Premium Audio!",
      subtitle: "Experience the difference in quality",
    },
  },
  {
    id: "m4",
    name: "SportPro Athletics",
    logo: "⚡",
    type: "d2c",
    SLA_score: 4.7,
    delivery_time: "3-5 days",
    promotion_bid: 3.8,
    eNAMAD_verified: true,
    story: "Trusted by athletes since 2015 – 500K+ fitness enthusiasts",
    benefits: [
      "Designed by professional athletes",
      "Free lifetime support",
      "Eco-friendly materials",
    ],
    customHeader: {
      title: "Ready to elevate your performance?",
      subtitle: "Join the SportPro community",
    },
  },
  {
    id: "m5",
    name: "BudgetBuy Store",
    logo: "💰",
    type: "marketplace",
    SLA_score: 3.9,
    delivery_time: "4-6 days",
    promotion_bid: 1.5,
    eNAMAD_verified: false,
  },
  {
    id: "m6",
    name: "Elite Gadgets",
    logo: "👑",
    type: "d2c",
    SLA_score: 4.9,
    delivery_time: "1-3 days",
    promotion_bid: 5.0,
    eNAMAD_verified: true,
    story: "Innovation leader since 2008 – Featured in Tech Awards 2023",
    benefits: [
      "Exclusive technology patents",
      "White-glove delivery service",
      "VIP customer support 24/7",
    ],
    customHeader: {
      title: "Welcome to Elite Excellence",
      subtitle: "Where innovation meets luxury",
    },
  },
];

export const products: Product[] = [
  // Headphones
  {
    id: "p1",
    name: "JBL Tune 510BT Wireless Headphones",
    price: 2499,
    originalPrice: 3499,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    merchant_id: "m1",
    rating: 4.3,
    reviews_count: 1250,
    category: "headphones",
    delivery_days: 2,
    stock: 45,
    pros: ["Great battery life", "Comfortable fit", "Good value"],
    cons: ["Average sound quality", "Plastic build"],
  },
  {
    id: "p2",
    name: "Sony WH-1000XM5 Premium Noise Cancelling",
    price: 4999,
    originalPrice: 5999,
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400",
    merchant_id: "m3",
    rating: 4.9,
    reviews_count: 3420,
    category: "headphones",
    delivery_days: 3,
    stock: 28,
    pros: ["Exceptional sound", "Best-in-class ANC", "Premium build"],
    cons: ["Expensive", "Heavy for long use"],
  },
  {
    id: "p3",
    name: "Budget BT550 Wireless Headphones",
    price: 899,
    image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400",
    merchant_id: "m5",
    rating: 3.8,
    reviews_count: 580,
    category: "headphones",
    delivery_days: 5,
    stock: 120,
    pros: ["Very affordable", "Decent battery"],
    cons: ["Poor sound quality", "Cheap materials", "No noise cancellation"],
  },
  // Running Shoes
  {
    id: "p4",
    name: "Nike Air Zoom Pegasus 40",
    price: 3299,
    originalPrice: 4500,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
    merchant_id: "m4",
    rating: 4.6,
    reviews_count: 2140,
    category: "shoes",
    delivery_days: 4,
    stock: 67,
    pros: ["Excellent cushioning", "Durable", "Great for long runs"],
    cons: ["Runs small", "Pricey"],
  },
  {
    id: "p5",
    name: "Adidas Ultraboost Light Running Shoes",
    price: 4799,
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400",
    merchant_id: "m2",
    rating: 4.7,
    reviews_count: 1890,
    category: "shoes",
    delivery_days: 2,
    stock: 34,
    pros: ["Lightweight", "Responsive", "Stylish design"],
    cons: ["Expensive", "Not for trail running"],
  },
  {
    id: "p6",
    name: "SportPro Runner Pro Max",
    price: 2199,
    originalPrice: 2999,
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400",
    merchant_id: "m4",
    rating: 4.5,
    reviews_count: 945,
    category: "shoes",
    delivery_days: 3,
    stock: 89,
    pros: ["Great value", "Comfortable", "Good grip"],
    cons: ["Less durable than premium brands"],
  },
  // Laptops
  {
    id: "p7",
    name: "MacBook Air M2 13-inch",
    price: 89999,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    merchant_id: "m6",
    rating: 4.9,
    reviews_count: 5670,
    category: "laptop",
    delivery_days: 2,
    stock: 15,
    pros: ["Exceptional performance", "Long battery life", "Premium design"],
    cons: ["Very expensive", "Limited ports"],
  },
  {
    id: "p8",
    name: "Dell Inspiron 15 Laptop",
    price: 45999,
    originalPrice: 52999,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
    merchant_id: "m2",
    rating: 4.2,
    reviews_count: 1340,
    category: "laptop",
    delivery_days: 3,
    stock: 23,
    pros: ["Good value", "Reliable performance", "Upgradable"],
    cons: ["Average build quality", "Heavy"],
  },
  {
    id: "p9",
    name: "HP Pavilion Gaming Laptop",
    price: 62999,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400",
    merchant_id: "m1",
    rating: 4.4,
    reviews_count: 890,
    category: "laptop",
    delivery_days: 2,
    stock: 31,
    pros: ["Good gaming performance", "Decent display", "Fair price"],
    cons: ["Gets hot", "Battery life could be better"],
  },
  // Smartphones
  {
    id: "p10",
    name: "iPhone 15 Pro 256GB",
    price: 129999,
    image: "https://images.unsplash.com/photo-1592286927505-b0e2cd0e1789?w=400",
    merchant_id: "m6",
    rating: 4.8,
    reviews_count: 8920,
    category: "smartphone",
    delivery_days: 1,
    stock: 42,
    pros: ["Top-tier performance", "Excellent camera", "Premium build"],
    cons: ["Very expensive", "No charger included"],
  },
  {
    id: "p11",
    name: "Samsung Galaxy S24 Ultra",
    price: 119999,
    originalPrice: 134999,
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400",
    merchant_id: "m2",
    rating: 4.7,
    reviews_count: 6540,
    category: "smartphone",
    delivery_days: 2,
    stock: 28,
    pros: ["S Pen included", "Great display", "Versatile camera"],
    cons: ["Large and heavy", "Pricey"],
  },
  {
    id: "p12",
    name: "OnePlus 12R 5G",
    price: 39999,
    originalPrice: 45999,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    merchant_id: "m1",
    rating: 4.5,
    reviews_count: 3210,
    category: "smartphone",
    delivery_days: 2,
    stock: 67,
    pros: ["Fast charging", "Good performance", "Value for money"],
    cons: ["No wireless charging", "Average camera"],
  },
];

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter((p) => p.category === category);
};

export const getMerchantById = (merchantId: string): Merchant | undefined => {
  return merchants.find((m) => m.id === merchantId);
};

export const searchProducts = (
  query: string,
  filters?: {
    maxPrice?: number;
    minRating?: number;
    eNAMADOnly?: boolean;
    fastestFirst?: boolean;
    cheapestFirst?: boolean;
  }
): Product[] => {
  const queryLower = query.toLowerCase();
  
  // Find matching products
  let results = products.filter((p) => {
    const nameMatch = p.name.toLowerCase().includes(queryLower);
    const categoryMatch = p.category.toLowerCase().includes(queryLower);
    return nameMatch || categoryMatch;
  });

  // Apply filters
  if (filters?.maxPrice) {
    results = results.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters?.minRating) {
    results = results.filter((p) => p.rating >= filters.minRating!);
  }

  if (filters?.eNAMADOnly) {
    results = results.filter((p) => {
      const merchant = getMerchantById(p.merchant_id);
      return merchant?.eNAMAD_verified;
    });
  }

  // Sort results
  if (filters?.cheapestFirst) {
    results.sort((a, b) => a.price - b.price);
  } else if (filters?.fastestFirst) {
    results.sort((a, b) => a.delivery_days - b.delivery_days);
  } else {
    // Default: sort by relevance score (promotion_bid + SLA + rating)
    results.sort((a, b) => {
      const merchantA = getMerchantById(a.merchant_id);
      const merchantB = getMerchantById(b.merchant_id);
      
      const scoreA = (merchantA?.promotion_bid || 0) * 10 + 
                     (merchantA?.SLA_score || 0) * 5 + 
                     a.rating * 2;
      const scoreB = (merchantB?.promotion_bid || 0) * 10 + 
                     (merchantB?.SLA_score || 0) * 5 + 
                     b.rating * 2;
      
      return scoreB - scoreA;
    });
  }

  return results.slice(0, 6); // Return top 6 results
};
