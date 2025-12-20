import { ChevronLeft, ChevronRight, ShoppingCart, Flame, Heart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, mockProducts, toPersianNumber, formatPersianPrice } from "@/data/gptCommerceData";
import { useRef, useState } from "react";

interface ProductCarouselsProps {
  onAddToCart: (product: Product) => void;
  cartItems: Product[];
}

// Extended products for carousels
const hotDealsProducts: Product[] = [
  ...mockProducts.filter(p => p.originalPrice),
  {
    id: 'p5',
    name: 'ساعت هوشمند شیائومی',
    price: 2800000,
    originalPrice: 3500000,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
    merchant: { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
    rating: 4.4,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'p6',
    name: 'پاوربانک انکر ۲۰۰۰۰',
    price: 1200000,
    originalPrice: 1600000,
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300&h=300&fit=crop',
    merchant: { id: 'm2', name: 'اسنپ‌مارکت', logo: '🟢' },
    rating: 4.6,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
];

const youMayLikeProducts: Product[] = [
  ...mockProducts.slice(1, 4),
  {
    id: 'p7',
    name: 'کیبورد مکانیکی لاجیتک',
    price: 4200000,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&h=300&fit=crop',
    merchant: { id: 'm3', name: 'تکنولایف', logo: '💻' },
    rating: 4.5,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'p8',
    name: 'ماوس گیمینگ ریزر',
    price: 1900000,
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=300&h=300&fit=crop',
    merchant: { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
    rating: 4.7,
    fastDelivery: false,
    returnGuarantee: true,
    inStock: true,
  },
];

const mostPopularProducts: Product[] = [
  mockProducts[0],
  mockProducts[1],
  {
    id: 'p9',
    name: 'گوشی سامسونگ S24',
    price: 45000000,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop',
    merchant: { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
    rating: 4.9,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'p10',
    name: 'لپ‌تاپ مک‌بوک ایر',
    price: 65000000,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop',
    merchant: { id: 'm3', name: 'تکنولایف', logo: '💻' },
    rating: 4.8,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
];

interface CarouselSectionProps {
  title: string;
  icon: React.ReactNode;
  products: Product[];
  onAddToCart: (product: Product) => void;
  cartItems: Product[];
  accentColor: string;
}

const CarouselSection = ({ title, icon, products, onAddToCart, cartItems, accentColor }: CarouselSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'right' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(updateScrollState, 300);
    }
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: accentColor }}
          >
            {icon}
          </div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        
        {/* Navigation Arrows */}
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-200 disabled:opacity-30"
            style={{
              background: 'hsl(0 0% 100% / 0.7)',
              border: '1px solid hsl(0 0% 100% / 0.3)',
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl transition-all duration-200 disabled:opacity-30"
            style={{
              background: 'hsl(0 0% 100% / 0.7)',
              border: '1px solid hsl(0 0% 100% / 0.3)',
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Scroll */}
      <div 
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => {
          const isInCart = cartItems.some(item => item.id === product.id);
          const discountPercent = product.originalPrice 
            ? Math.round((1 - product.price / product.originalPrice) * 100)
            : 0;

          return (
            <div
              key={product.id}
              className="flex-shrink-0 w-[200px] rounded-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] group"
              style={{
                background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.8), hsl(0 0% 100% / 0.6))',
                border: '1px solid hsl(0 0% 100% / 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
              }}
            >
              {/* Image */}
              <div className="relative h-[140px] overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {discountPercent > 0 && (
                  <div 
                    className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                  >
                    {toPersianNumber(discountPercent)}٪
                  </div>
                )}
                {product.fastDelivery && (
                  <div 
                    className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs text-white backdrop-blur-sm"
                    style={{ background: 'hsl(142 70% 45% / 0.9)' }}
                  >
                    ارسال سریع
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3 space-y-2">
                <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
                  {product.name}
                </h4>
                
                {/* Rating */}
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-xs">⭐</span>
                  <span className="text-xs text-muted-foreground">{toPersianNumber(product.rating)}</span>
                  <span className="text-xs text-muted-foreground mr-1">| {product.merchant.logo} {product.merchant.name}</span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">
                    {formatPersianPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPersianPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Add to Cart Button */}
                <Button
                  onClick={() => onAddToCart(product)}
                  disabled={isInCart}
                  size="sm"
                  className="w-full h-9 rounded-xl text-xs font-medium transition-all duration-200"
                  style={{
                    background: isInCart 
                      ? 'hsl(142 70% 45%)' 
                      : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9))',
                    boxShadow: isInCart ? 'none' : '0 4px 16px hsl(var(--primary) / 0.3)',
                  }}
                >
                  <ShoppingCart className="w-3.5 h-3.5 ml-1" />
                  {isInCart ? 'در سبد خرید' : 'افزودن به سبد'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ProductCarousels = ({ onAddToCart, cartItems }: ProductCarouselsProps) => {
  return (
    <div className="w-full max-w-[900px] mx-auto px-6 mt-16 space-y-10 pb-12">
      <CarouselSection
        title="تخفیف‌های ویژه"
        icon={<Flame className="w-4 h-4 text-white" />}
        products={hotDealsProducts}
        onAddToCart={onAddToCart}
        cartItems={cartItems}
        accentColor="linear-gradient(135deg, #ef4444, #f97316)"
      />
      
      <CarouselSection
        title="شاید دوست داشته باشی"
        icon={<Heart className="w-4 h-4 text-white" />}
        products={youMayLikeProducts}
        onAddToCart={onAddToCart}
        cartItems={cartItems}
        accentColor="linear-gradient(135deg, #ec4899, #f472b6)"
      />
      
      <CarouselSection
        title="محبوب‌ترین‌ها"
        icon={<TrendingUp className="w-4 h-4 text-white" />}
        products={mostPopularProducts}
        onAddToCart={onAddToCart}
        cartItems={cartItems}
        accentColor="linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))"
      />
    </div>
  );
};
