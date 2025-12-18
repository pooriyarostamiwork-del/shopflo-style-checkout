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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Product[];
  timestamp: Date;
}

export interface Order {
  id: string;
  status: 'processing' | 'shipped' | 'delivered';
  items: CartItem[];
  total: number;
  date: Date;
}

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
];

export const recentlyViewed: Product[] = [
  mockProducts[0],
  mockProducts[2],
];

export const favorites: Product[] = [
  mockProducts[1],
  mockProducts[3],
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

export const toPersianNumber = (num: number | string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

export const formatPersianPrice = (price: number): string => {
  const formatted = price.toLocaleString('fa-IR');
  return `${formatted} تومان`;
};
