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

export interface MerchantShippingMethod {
  id: string;
  label: string;
  deliveryWindow: string;
  priceLabel: string;
}

export interface MerchantShipping {
  merchantId: string;
  methods: MerchantShippingMethod[];
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
  inlineProduct?: Product; // Product details shown inline in chat (not modal)
  timestamp: Date;
  isCtaActive?: boolean; // Whether this CTA is currently active (only one should be active at a time)
}

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface OrderMerchantGroup {
  merchant: Merchant;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  shippingMethod: string;
  trackingNumber?: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  items: CartItem[];
  total: number;
  date: Date;
  // Extended fields for detail view
  merchantGroups: OrderMerchantGroup[];
  paymentMethod: string;
  deliveryAddress: DeliveryAddress;
  subtotal: number;
  totalShipping: number;
  totalDiscount: number;
}

// Mock data
export const merchants: Merchant[] = [
  { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
  { id: 'm2', name: 'اسنپ‌مارکت', logo: '🟢' },
  { id: 'm3', name: 'تکنولایف', logo: '💻' },
  { id: 'm4', name: 'آرایشی‌بهداشتی آنلاین', logo: '💄' },
  { id: 'm5', name: 'کالای ورزشی پرو', logo: '🏋️' },
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

// Skincare / Beauty products
export const skincareProducts: Product[] = [
  {
    id: 'sk1', name: 'ست مراقبت پوست سراوی (CeraVe)', price: 2800000,
    image: 'https://images.unsplash.com/photo-1570194065650-d99fb4a38c0a?w=300&h=300&fit=crop',
    merchant: merchants[3], rating: 4.7, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'sk2', name: 'سرم ویتامین C اوردینری', price: 1900000,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop',
    merchant: merchants[3], rating: 4.8, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'sk3', name: 'کرم مرطوب‌کننده لاروش پوزای', price: 3500000, originalPrice: 4000000,
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&h=300&fit=crop',
    merchant: merchants[0], rating: 4.9, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'sk4', name: 'ماسک ورقه‌ای کره‌ای (بسته ۱۰ عددی)', price: 850000,
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=300&h=300&fit=crop',
    merchant: merchants[3], rating: 4.5, fastDelivery: false, returnGuarantee: true, inStock: true,
  },
  {
    id: 'sk5', name: 'ست هدیه بادی شاپ', price: 4200000, originalPrice: 4800000,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=300&fit=crop',
    merchant: merchants[3], rating: 4.6, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'sk6', name: 'روغن آرگان خالص', price: 1200000,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300&h=300&fit=crop',
    merchant: merchants[1], rating: 4.4, fastDelivery: false, returnGuarantee: false, inStock: true,
  },
];

// Coffee & Kitchen products
export const coffeeProducts: Product[] = [
  {
    id: 'cf1', name: 'اسپرسوساز دلونگی', price: 18500000, originalPrice: 21000000,
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=300&h=300&fit=crop',
    merchant: merchants[0], rating: 4.8, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'cf2', name: 'آسیاب قهوه باراتزا', price: 8900000,
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=300&fit=crop',
    merchant: merchants[2], rating: 4.7, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'cf3', name: 'قهوه تازه‌رست ایلی (۱ کیلو)', price: 1400000,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop',
    merchant: merchants[1], rating: 4.6, fastDelivery: true, returnGuarantee: false, inStock: true,
  },
  {
    id: 'cf4', name: 'فنجان اسپرسو ست ۶ تایی', price: 950000,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=300&h=300&fit=crop',
    merchant: merchants[0], rating: 4.4, fastDelivery: false, returnGuarantee: true, inStock: true,
  },
  {
    id: 'cf5', name: 'تمپر و توزیع‌کننده قهوه', price: 650000,
    image: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=300&h=300&fit=crop',
    merchant: merchants[2], rating: 4.3, fastDelivery: false, returnGuarantee: false, inStock: true,
  },
  {
    id: 'cf6', name: 'کتابچه آموزش باریستا', price: 350000,
    image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=300&h=300&fit=crop',
    merchant: merchants[1], rating: 4.5, fastDelivery: true, returnGuarantee: false, inStock: true,
  },
];

// Gaming Setup products
export const gamingProducts: Product[] = [
  {
    id: 'gm1', name: 'مانیتور گیمینگ ایسوس ۲۷ اینچ', price: 9800000, originalPrice: 11500000,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop',
    merchant: merchants[2], rating: 4.8, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'gm2', name: 'کیبورد مکانیکی ریزر', price: 3200000,
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=300&h=300&fit=crop',
    merchant: merchants[0], rating: 4.7, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'gm3', name: 'موس گیمینگ لاجیتک G Pro', price: 2800000,
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=300&h=300&fit=crop',
    merchant: merchants[2], rating: 4.6, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'gm4', name: 'هدست گیمینگ هایپرایکس', price: 2500000, originalPrice: 3000000,
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=300&h=300&fit=crop',
    merchant: merchants[0], rating: 4.5, fastDelivery: false, returnGuarantee: true, inStock: true,
  },
  {
    id: 'gm5', name: 'پد موس بزرگ RGB', price: 850000,
    image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=300&h=300&fit=crop',
    merchant: merchants[1], rating: 4.3, fastDelivery: true, returnGuarantee: false, inStock: true,
  },
  {
    id: 'gm6', name: 'صندلی گیمینگ DXRacer', price: 12500000,
    image: 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=300&h=300&fit=crop',
    merchant: merchants[0], rating: 4.4, fastDelivery: false, returnGuarantee: true, inStock: true,
  },
];

// Baby & Kids products
export const babyProducts: Product[] = [
  {
    id: 'bb1', name: 'صندلی غذای کودک چیکو', price: 7200000, originalPrice: 8500000,
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=300&h=300&fit=crop',
    merchant: merchants[0], rating: 4.8, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'bb2', name: 'ست ظرف غذای بامبو', price: 1100000,
    image: 'https://images.unsplash.com/photo-1604006852748-903f12068286?w=300&h=300&fit=crop',
    merchant: merchants[1], rating: 4.6, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'bb3', name: 'قاشق سیلیکونی حساس به دما (ست ۴ تایی)', price: 450000,
    image: 'https://images.unsplash.com/photo-1590080876351-941da357d5e0?w=300&h=300&fit=crop',
    merchant: merchants[1], rating: 4.5, fastDelivery: false, returnGuarantee: true, inStock: true,
  },
  {
    id: 'bb4', name: 'پیش‌بند سیلیکونی با جیب', price: 380000,
    image: 'https://images.unsplash.com/photo-1606791405792-1004f1718d0c?w=300&h=300&fit=crop',
    merchant: merchants[0], rating: 4.4, fastDelivery: true, returnGuarantee: false, inStock: true,
  },
  {
    id: 'bb5', name: 'لیوان آموزشی ۳۶۰ درجه', price: 550000,
    image: 'https://images.unsplash.com/photo-1584839404428-3f8f0554cc34?w=300&h=300&fit=crop',
    merchant: merchants[1], rating: 4.7, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'bb6', name: 'کتاب راهنمای تغذیه تکمیلی', price: 280000,
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=300&fit=crop',
    merchant: merchants[0], rating: 4.3, fastDelivery: false, returnGuarantee: false, inStock: true,
  },
];

// Fitness & Wellness products
export const fitnessProducts: Product[] = [
  {
    id: 'ft1', name: 'دمبل قابل تنظیم ست', price: 4500000, originalPrice: 5200000,
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=300&h=300&fit=crop',
    merchant: merchants[4], rating: 4.7, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'ft2', name: 'مت یوگا حرفه‌ای', price: 1200000,
    image: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=300&h=300&fit=crop',
    merchant: merchants[4], rating: 4.6, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'ft3', name: 'کش مقاومتی ست ۵ تایی', price: 650000,
    image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=300&h=300&fit=crop',
    merchant: merchants[4], rating: 4.5, fastDelivery: false, returnGuarantee: true, inStock: true,
  },
  {
    id: 'ft4', name: 'ساعت هوشمند شیائومی Band 8', price: 2800000,
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=300&h=300&fit=crop',
    merchant: merchants[0], rating: 4.8, fastDelivery: true, returnGuarantee: true, inStock: true,
  },
  {
    id: 'ft5', name: 'بطری آب ورزشی ۱ لیتری', price: 350000,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&h=300&fit=crop',
    merchant: merchants[1], rating: 4.3, fastDelivery: true, returnGuarantee: false, inStock: true,
  },
  {
    id: 'ft6', name: 'پودر پروتئین وی ۱ کیلویی', price: 1800000,
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2c4d8?w=300&h=300&fit=crop',
    merchant: merchants[4], rating: 4.4, fastDelivery: false, returnGuarantee: true, inStock: true,
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
    id: '#۱۲۳۴۵',
    status: 'shipped',
    items: [{ ...mockProducts[0], quantity: 1 }, { ...mockProducts[2], quantity: 2 }],
    total: 21500000,
    date: new Date(Date.now() - 86400000 * 2),
    merchantGroups: [
      {
        merchant: merchants[0],
        items: [{ ...mockProducts[0], quantity: 1 }],
        subtotal: 12500000,
        deliveryFee: 0,
        discount: 1500000,
        total: 12500000,
        shippingMethod: 'ارسال اکسپرس',
        trackingNumber: '۹۸۷۶۵۴۳۲۱',
      },
      {
        merchant: merchants[1],
        items: [{ ...mockProducts[2], quantity: 2 }],
        subtotal: 9000000,
        deliveryFee: 55000,
        discount: 1400000,
        total: 9055000,
        shippingMethod: 'ارسال عادی',
      },
    ],
    paymentMethod: 'درگاه پرداخت',
    deliveryAddress: mockAddresses[0],
    subtotal: 21500000,
    totalShipping: 55000,
    totalDiscount: 2900000,
  },
  {
    id: '#۱۲۳۴۰',
    status: 'delivered',
    items: [{ ...mockProducts[1], quantity: 1 }],
    total: 9800000,
    date: new Date(Date.now() - 86400000 * 10),
    merchantGroups: [
      {
        merchant: merchants[2],
        items: [{ ...mockProducts[1], quantity: 1 }],
        subtotal: 9800000,
        deliveryFee: 0,
        discount: 0,
        total: 9800000,
        shippingMethod: 'ارسال اکسپرس',
        trackingNumber: '۱۲۳۴۵۶۷۸۹',
      },
    ],
    paymentMethod: 'کیف پول',
    deliveryAddress: mockAddresses[0],
    subtotal: 9800000,
    totalShipping: 0,
    totalDiscount: 0,
  },
  {
    id: '#۱۲۳۳۵',
    status: 'cancelled',
    items: [{ ...mockProducts[4], quantity: 1 }],
    total: 8900000,
    date: new Date(Date.now() - 86400000 * 15),
    merchantGroups: [
      {
        merchant: merchants[2],
        items: [{ ...mockProducts[4], quantity: 1 }],
        subtotal: 8900000,
        deliveryFee: 0,
        discount: 1600000,
        total: 8900000,
        shippingMethod: 'ارسال عادی',
      },
    ],
    paymentMethod: 'درگاه پرداخت',
    deliveryAddress: mockAddresses[1],
    subtotal: 8900000,
    totalShipping: 0,
    totalDiscount: 1600000,
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
