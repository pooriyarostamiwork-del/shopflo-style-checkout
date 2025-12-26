export interface Merchant {
  id: string;
  name: string;
  logo: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  merchant: Merchant;
  rating: number;
  fastDelivery: boolean;
  returnGuarantee: boolean;
  inStock: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

// Agentic checkout types
export type QuickReplyType = 
  | 'confirm-cart'
  | 'add-more'
  | 'track-order'
  | 'modify-address'
  | 'view-invoice'
  | 'custom';

export interface QuickReply {
  id: string;
  label: string;
  type: QuickReplyType;
  action?: string;
}

export type PaymentMethod = 'wallet' | 'direct-debit' | 'gateway' | 'bnpl';

export interface PaymentOption {
  id: PaymentMethod;
  label: string;
  icon: string;
  available: boolean;
  tooltip?: string;
  description?: string;
}

export interface DeliveryAddress {
  id: string;
  title: string;
  fullAddress: string;
  recipientName: string;
  phone: string;
  isDefault?: boolean;
}

export interface ShippingMethod {
  id: string;
  label: string;
  description: string;
  priceLabel: string;
  etaLabel: string;
}

export interface VendorOrderSummary {
  merchant: Merchant;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
}

export interface OrderSummary {
  vendorSummaries: VendorOrderSummary[];
  totalItems: number;
  subtotal: number;
  totalDelivery: number;
  totalDiscount: number;
  grandTotal: number;
}

export type CheckoutStep =
  | 'idle'
  | 'product-added'
  | 'awaiting-finalize'
  | 'cart-confirmation'
  | 'address-confirmation'
  | 'payment-selection'
  | 'processing-payment'
  | 'order-complete';

export interface AgenticState {
  step: CheckoutStep;
  isLoggedIn: boolean;
  hasStoredCheckoutDetails: boolean;
  selectedAddress: DeliveryAddress | null;
  selectedPayment: PaymentMethod | null;
  orderId: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  productIndexStart?: number; // For numbering products in chat
  quickReplies?: QuickReply[];
  ctaButton?: {
    label: string;
    action: string;
    disabled?: boolean;
    disabledReason?: string;
  };
  orderSummary?: OrderSummary;
  addressConfirmation?: DeliveryAddress;
  addressSelector?: DeliveryAddress[]; // Multiple addresses to choose from (legacy)
  addressShipping?: {
    mode: 'existing' | 'new';
    addresses: DeliveryAddress[];
    shippingMethods: ShippingMethod[];
  };
  paymentOptions?: PaymentOption[];
  showCartSummary?: boolean;
  timestamp: Date;
  isCtaActive?: boolean; // Whether this CTA is currently active (only one should be active at a time)
}

export interface Order {
  id: string;
  status: 'processing' | 'shipped' | 'delivered';
  items: CartItem[];
  total: number;
  date: Date;
}

// Mock data
export const merchants: Merchant[] = [
  { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
  { id: 'm2', name: 'اسنپ‌مارکت', logo: '🟢' },
  { id: 'm3', name: 'تکنولایف', logo: '💻' },
];

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'هدفون بی‌سیم سونی WH-1000XM5',
    price: 12500000,
    originalPrice: 14000000,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    merchant: merchants[0],
    rating: 4.8,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'p2',
    name: 'ایرپاد پرو ۲ اپل',
    price: 9800000,
    image: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=300&h=300&fit=crop',
    merchant: merchants[2],
    rating: 4.7,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'p3',
    name: 'هدفون گیمینگ ریزر',
    price: 4500000,
    originalPrice: 5200000,
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=300&h=300&fit=crop',
    merchant: merchants[1],
    rating: 4.5,
    fastDelivery: false,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'p4',
    name: 'هدفون JBL Tune 760NC',
    price: 3200000,
    image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=300&h=300&fit=crop',
    merchant: merchants[0],
    rating: 4.3,
    fastDelivery: true,
    returnGuarantee: false,
    inStock: true,
  },
  {
    id: 'p5',
    name: 'هدفون بیتس استودیو ۳',
    price: 8900000,
    originalPrice: 10500000,
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&h=300&fit=crop',
    merchant: merchants[2],
    rating: 4.6,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'p6',
    name: 'هدفون Audio-Technica ATH-M50x',
    price: 6200000,
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop',
    merchant: merchants[1],
    rating: 4.9,
    fastDelivery: false,
    returnGuarantee: true,
    inStock: true,
  },
];

export const recentlyViewed: Product[] = [
  mockProducts[0],
  mockProducts[2],
];

export const favorites: Product[] = [
  mockProducts[1],
  mockProducts[3],
];

export const mockAddresses: DeliveryAddress[] = [
  {
    id: 'addr1',
    title: 'خانه',
    fullAddress: 'تهران، منطقه ۳، خیابان ولیعصر، کوچه گلستان، پلاک ۱۲، واحد ۴',
    recipientName: 'علی محمدی',
    phone: '۰۹۱۲۳۴۵۶۷۸۹',
    isDefault: true,
  },
  {
    id: 'addr2',
    title: 'محل کار',
    fullAddress: 'تهران، میدان آرژانتین، خیابان احمد قصیر، ساختمان برج آبی، طبقه ۵',
    recipientName: 'علی محمدی',
    phone: '۰۹۱۲۳۴۵۶۷۸۹',
  },
];

export const paymentOptions: PaymentOption[] = [
  {
    id: 'wallet',
    label: 'کیف پول',
    icon: '💰',
    available: true,
  },
  {
    id: 'direct-debit',
    label: 'برداشت مستقیم',
    icon: '🏦',
    available: false,
    tooltip: 'این روش در حال حاضر فعال نیست',
  },
  {
    id: 'gateway',
    label: 'درگاه پرداخت',
    icon: '💳',
    available: true,
  },
  {
    id: 'bnpl',
    label: 'پرداخت در ۴ قسط با فلوپی',
    icon: '📅',
    available: true,
    description: 'خرید الان، پرداخت اقساطی',
  },
];

export const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'سلام! 👋 من دستیار خرید هوشمند فلوکارت هستم. چطور می‌تونم کمکت کنم؟\n\nمی‌تونی بگی دنبال چی می‌گردی، یا از من بخوای محصولات رو مقایسه کنم.',
    timestamp: new Date(),
  },
];

export const mockOrders: Order[] = [
  {
    id: 'ORD-۱۲۳۴',
    status: 'shipped',
    items: [{ ...mockProducts[0], quantity: 1 }],
    total: 12500000,
    date: new Date(Date.now() - 86400000 * 2),
  },
];

// Utility functions
export const toPersianNumber = (num: number | string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

export const formatPersianPrice = (price: number): string => {
  const formatted = price.toLocaleString('fa-IR');
  return `${formatted} تومان`;
};

// Calculate order summary from cart items
export const calculateOrderSummary = (cartItems: CartItem[]): OrderSummary => {
  const vendorMap = new Map<string, VendorOrderSummary>();
  
  cartItems.forEach(item => {
    const merchantId = item.merchant.id;
    if (!vendorMap.has(merchantId)) {
      vendorMap.set(merchantId, {
        merchant: item.merchant,
        items: [],
        subtotal: 0,
        deliveryFee: item.fastDelivery ? 0 : 35000, // Free delivery for fast delivery items
        discount: 0,
        total: 0,
      });
    }
    
    const vendor = vendorMap.get(merchantId)!;
    vendor.items.push(item);
    vendor.subtotal += item.price * item.quantity;
    
    // Calculate discount if original price exists
    if (item.originalPrice) {
      vendor.discount += (item.originalPrice - item.price) * item.quantity;
    }
  });
  
  // Calculate totals per vendor
  vendorMap.forEach(vendor => {
    vendor.total = vendor.subtotal + vendor.deliveryFee;
  });
  
  const vendorSummaries = Array.from(vendorMap.values());
  
  return {
    vendorSummaries,
    totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: vendorSummaries.reduce((sum, v) => sum + v.subtotal, 0),
    totalDelivery: vendorSummaries.reduce((sum, v) => sum + v.deliveryFee, 0),
    totalDiscount: vendorSummaries.reduce((sum, v) => sum + v.discount, 0),
    grandTotal: vendorSummaries.reduce((sum, v) => sum + v.total, 0),
  };
};
