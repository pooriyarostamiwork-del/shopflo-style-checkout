import { ChevronLeft, ChevronRight, Plus, Info, Flame, Heart, TrendingUp, Grid2X2 } from "lucide-react";
import { Product, mockProducts, toPersianNumber, formatPersianPrice } from "@/data/gptCommerceData";
import { useRef, useState } from "react";
import { useHomepageSettings, BannerConfigs } from "@/contexts/HomepageSettingsContext";

interface ProductCarouselsProps {
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onAskAbout: (productName: string) => void;
  cartItems: Product[];
}

// Product images with white/solid backgrounds (ecommerce style)
const ecommerceImages = {
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&bg=white",
  airpods: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop&bg=white",
  watch: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&bg=white",
  powerbank: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop&bg=white",
  keyboard: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop&bg=white",
  mouse: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop&bg=white",
  phone: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&bg=white",
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&bg=white",
};

// Extended products for carousels with white background images
const hotDealsProducts: Product[] = [
  {
    id: 'hd1',
    name: 'هدفون سونی WH-1000XM5',
    price: 8500000,
    originalPrice: 12000000,
    image: ecommerceImages.headphones,
    merchant: { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
    rating: 4.8,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'hd2',
    name: 'ایرپاد پرو ۲',
    price: 9200000,
    originalPrice: 11000000,
    image: ecommerceImages.airpods,
    merchant: { id: 'm2', name: 'اسنپ‌مارکت', logo: '🟢' },
    rating: 4.9,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'hd3',
    name: 'ساعت هوشمند شیائومی',
    price: 2800000,
    originalPrice: 3500000,
    image: ecommerceImages.watch,
    merchant: { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
    rating: 4.4,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'hd4',
    name: 'پاوربانک انکر ۲۰۰۰۰',
    price: 1200000,
    originalPrice: 1600000,
    image: ecommerceImages.powerbank,
    merchant: { id: 'm2', name: 'اسنپ‌مارکت', logo: '🟢' },
    rating: 4.6,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'hd5',
    name: 'اسپیکر بلوتوث JBL',
    price: 3500000,
    originalPrice: 4200000,
    image: ecommerceImages.headphones,
    merchant: { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
    rating: 4.5,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'hd6',
    name: 'شارژر وایرلس سامسونگ',
    price: 980000,
    originalPrice: 1500000,
    image: ecommerceImages.powerbank,
    merchant: { id: 'm2', name: 'اسنپ‌مارکت', logo: '🟢' },
    rating: 4.3,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'hd7',
    name: 'کیس ایرپاد پرو',
    price: 450000,
    originalPrice: 650000,
    image: ecommerceImages.airpods,
    merchant: { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
    rating: 4.7,
    fastDelivery: false,
    returnGuarantee: true,
    inStock: true,
  },
];

const youMayLikeProducts: Product[] = [
  {
    id: 'yl1',
    name: 'کیبورد مکانیکی لاجیتک',
    price: 4200000,
    image: ecommerceImages.keyboard,
    merchant: { id: 'm3', name: 'تکنولایف', logo: '💻' },
    rating: 4.5,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'yl2',
    name: 'ماوس گیمینگ ریزر',
    price: 1900000,
    image: ecommerceImages.mouse,
    merchant: { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
    rating: 4.7,
    fastDelivery: false,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'yl3',
    name: 'هدفون بیتس Solo Pro',
    price: 7500000,
    image: ecommerceImages.headphones,
    merchant: { id: 'm2', name: 'اسنپ‌مارکت', logo: '🟢' },
    rating: 4.6,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'yl4',
    name: 'ساعت اپل واچ سری ۹',
    price: 18500000,
    image: ecommerceImages.watch,
    merchant: { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
    rating: 4.9,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'yl5',
    name: 'وب‌کم لاجیتک C920',
    price: 2800000,
    image: ecommerceImages.laptop,
    merchant: { id: 'm3', name: 'تکنولایف', logo: '💻' },
    rating: 4.6,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'yl6',
    name: 'هاب USB-C انکر',
    price: 1200000,
    image: ecommerceImages.powerbank,
    merchant: { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
    rating: 4.4,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'yl7',
    name: 'پد ماوس گیمینگ',
    price: 350000,
    image: ecommerceImages.mouse,
    merchant: { id: 'm2', name: 'اسنپ‌مارکت', logo: '🟢' },
    rating: 4.2,
    fastDelivery: false,
    returnGuarantee: true,
    inStock: true,
  },
];

const mostPopularProducts: Product[] = [
  {
    id: 'mp1',
    name: 'گوشی سامسونگ S24',
    price: 45000000,
    image: ecommerceImages.phone,
    merchant: { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
    rating: 4.9,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'mp2',
    name: 'لپ‌تاپ مک‌بوک ایر',
    price: 65000000,
    image: ecommerceImages.laptop,
    merchant: { id: 'm3', name: 'تکنولایف', logo: '💻' },
    rating: 4.8,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'mp3',
    name: 'آیفون ۱۵ پرو مکس',
    price: 75000000,
    image: ecommerceImages.phone,
    merchant: { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
    rating: 4.9,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'mp4',
    name: 'ایرپاد مکس',
    price: 24000000,
    image: ecommerceImages.headphones,
    merchant: { id: 'm2', name: 'اسنپ‌مارکت', logo: '🟢' },
    rating: 4.7,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'mp5',
    name: 'تبلت آیپد پرو',
    price: 52000000,
    image: ecommerceImages.laptop,
    merchant: { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
    rating: 4.8,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'mp6',
    name: 'گوشی پیکسل ۸ پرو',
    price: 38000000,
    image: ecommerceImages.phone,
    merchant: { id: 'm3', name: 'تکنولایف', logo: '💻' },
    rating: 4.6,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
  {
    id: 'mp7',
    name: 'لپ‌تاپ ایسوس ROG',
    price: 85000000,
    image: ecommerceImages.laptop,
    merchant: { id: 'm1', name: 'دیجی‌کالا', logo: '🛒' },
    rating: 4.9,
    fastDelivery: true,
    returnGuarantee: true,
    inStock: true,
  },
];

// Category filters for each carousel
const carouselCategories = {
  hotDeals: ['همه', 'هدفون', 'ساعت هوشمند', 'لوازم جانبی'],
  youMayLike: ['همه', 'کیبورد', 'ماوس', 'هدفون', 'ساعت'],
  popular: ['همه', 'موبایل', 'لپ‌تاپ', 'هدفون'],
};

interface CarouselSectionProps {
  title: string;
  icon: React.ReactNode;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onAskAbout: (productName: string) => void;
  cartItems: Product[];
  accentColor: string;
  categories: string[];
  bannerKey: keyof BannerConfigs;
}

const CarouselSection = ({ 
  title, 
  icon, 
  products, 
  onAddToCart, 
  onQuickView,
  onAskAbout,
  cartItems, 
  accentColor,
  categories,
  bannerKey
}: CarouselSectionProps) => {
  const { getProductImage, getBanner } = useHomepageSettings();
  const banner = getBanner(bannerKey);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeFilter, setActiveFilter] = useState('همه');

  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      // Scroll by card width + gap
      const cardWidth = 220;
      const gap = 16;
      const scrollAmount = cardWidth + gap;
      scrollRef.current.scrollBy({
        left: direction === 'right' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(updateScrollState, 300);
    }
  };

  // Filter products based on active filter (mock filtering)
  const filteredProducts = activeFilter === 'همه' 
    ? products 
    : products.filter(p => p.name.includes(activeFilter) || activeFilter === 'لوازم جانبی');

  return (
    <div className="relative">
      {/* Header with Title and Category Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4 px-1">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: accentColor }}
          >
            {icon}
          </div>
          <h3 className="font-semibold text-foreground whitespace-nowrap">{title}</h3>
        </div>
        
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                activeFilter === category
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{
                background: activeFilter === category 
                  ? 'hsl(var(--primary) / 0.1)' 
                  : 'transparent',
                border: activeFilter === category 
                  ? '1px solid hsl(var(--primary) / 0.2)' 
                  : '1px solid hsl(0 0% 0% / 0.06)',
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Navigation Arrows */}
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30"
            style={{
              background: 'hsl(0 0% 100%)',
              border: '1px solid hsl(0 0% 0% / 0.08)',
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30"
            style={{
              background: 'hsl(0 0% 100%)',
              border: '1px solid hsl(0 0% 0% / 0.08)',
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Grid with Promo Banner */}
      <div className="flex gap-4">
        {/* Promotional Banner - Fixed on left (appears first in RTL) - NO divider above */}
        <div 
          className="hidden lg:flex flex-shrink-0 w-[140px] h-[380px] rounded-xl overflow-hidden flex-col items-center justify-center text-center p-4 cursor-pointer transition-all duration-200 hover:border-primary/20 relative"
          style={{
            background: banner.imageUrl 
              ? `url(${banner.imageUrl}) center/cover`
              : 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.15))',
            border: '1px solid hsl(0 0% 0% / 0.08)',
          }}
          onClick={() => console.log('Promo clicked')}
        >
          {/* Overlay for text readability when image is set */}
          {banner.imageUrl && banner.showText && (
            <div className="absolute inset-0 bg-black/30" />
          )}
          
          {/* Text Content - only show if showText is true */}
          {banner.showText && (
            <div className="relative z-10 space-y-2">
              <p 
                className="text-xs font-medium mb-1"
                style={{ color: banner.imageUrl ? 'white' : 'hsl(var(--foreground))' }}
              >
                {banner.title}
              </p>
              <div 
                className="text-2xl font-bold"
                style={{ color: banner.imageUrl ? 'white' : 'hsl(var(--primary))' }}
              >
                {banner.subtitle}
              </div>
              <span 
                className="text-xs underline"
                style={{ color: banner.imageUrl ? 'white' : 'hsl(var(--muted-foreground))' }}
              >
                {banner.ctaText}
              </span>
            </div>
          )}
        </div>

        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex-1 grid grid-flow-col auto-cols-[220px] gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            scrollSnapType: 'x mandatory',
          }}
        >
          {filteredProducts.map((product) => {
            const isInCart = cartItems.some(item => item.id === product.id);
            const discountPercent = product.originalPrice 
              ? Math.round((1 - product.price / product.originalPrice) * 100)
              : 0;

            return (
              <div
                key={product.id}
                className="flex-shrink-0 w-[220px] h-[380px] rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer hover:border-primary/20 flex flex-col"
                style={{
                  background: 'hsl(0 0% 100%)',
                  border: '1px solid hsl(0 0% 0% / 0.08)',
                  scrollSnapAlign: 'start',
                }}
                onClick={() => onQuickView(product)}
              >
                {/* Image with white background - fixed height with aspect ratio */}
                <div 
                  className="relative h-[180px] w-full overflow-hidden flex items-center justify-center"
                  style={{ background: 'hsl(0 0% 98%)' }}
                >
                  <img
                    src={getProductImage(product.id, product.image)}
                    alt={product.name}
                    className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                  />
                  {discountPercent > 0 && (
                    <div 
                      className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                    >
                      {toPersianNumber(discountPercent)}٪
                    </div>
                  )}
                  {product.fastDelivery && (
                    <div 
                      className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs text-white"
                      style={{ background: 'hsl(142 70% 45% / 0.9)' }}
                    >
                      ارسال سریع
                    </div>
                  )}
                </div>

                {/* Divider between image and content */}
                <div className="w-full h-px" style={{ background: 'hsl(0 0% 0% / 0.06)' }} />

                {/* Content */}
                <div className="p-3 space-y-2 flex-1 flex flex-col">
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

                  {/* Action Buttons - Bottom */}
                  <div className="flex items-center gap-2 pt-1 mt-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      disabled={isInCart}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                      style={{
                        background: isInCart 
                          ? 'hsl(142 70% 45%)' 
                          : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9))',
                      }}
                      title="افزودن سریع"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickView(product);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:border-primary/20"
                      style={{
                        background: 'hsl(0 0% 100%)',
                        border: '1px solid hsl(0 0% 0% / 0.08)',
                      }}
                      title={`جزئیات ${product.name}`}
                    >
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">مشاهده جزئیات</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Terminal Card - View All */}
          <div
            className="flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer hover:border-primary/20"
            style={{
              background: 'hsl(0 0% 98%)',
              border: '1px solid hsl(0 0% 0% / 0.08)',
              scrollSnapAlign: 'start',
              minWidth: 'calc(25% - 12px)',
            }}
            onClick={() => console.log('View all clicked')}
          >
            <div 
              className="relative aspect-square overflow-hidden flex items-center justify-center"
              style={{ background: 'hsl(0 0% 96%)' }}
            >
              {/* Blurred background effect */}
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  backdropFilter: 'blur(8px)',
                  background: 'hsl(0 0% 100% / 0.7)',
                }}
              >
                <Grid2X2 className="w-12 h-12 text-primary/40 group-hover:text-primary/60 transition-colors duration-200" />
              </div>
            </div>
            <div className="p-4 flex flex-col items-center justify-center min-h-[120px] text-center">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                مشاهده
              </p>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                همه
              </p>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                محصولات
              </p>
              <ChevronLeft className="w-5 h-5 text-primary mt-2 group-hover:translate-x-[-4px] transition-transform duration-200" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export const ProductCarousels = ({ onAddToCart, onQuickView, onAskAbout, cartItems }: ProductCarouselsProps) => {
  return (
    <div className="w-full max-w-[960px] mx-auto px-4 mt-16 space-y-10 pb-16">
      <CarouselSection
        title="تخفیف‌های ویژه"
        icon={<Flame className="w-4 h-4 text-white" />}
        products={hotDealsProducts}
        onAddToCart={onAddToCart}
        onQuickView={onQuickView}
        onAskAbout={onAskAbout}
        cartItems={cartItems}
        accentColor="linear-gradient(135deg, #ef4444, #f97316)"
        categories={carouselCategories.hotDeals}
        bannerKey="hotDeals"
      />
      
      <CarouselSection
        title="شاید دوست داشته باشی"
        icon={<Heart className="w-4 h-4 text-white" />}
        products={youMayLikeProducts}
        onAddToCart={onAddToCart}
        onQuickView={onQuickView}
        onAskAbout={onAskAbout}
        cartItems={cartItems}
        accentColor="linear-gradient(135deg, #ec4899, #f472b6)"
        categories={carouselCategories.youMayLike}
        bannerKey="youMayLike"
      />
      
      <CarouselSection
        title="محبوب‌ترین‌ها"
        icon={<TrendingUp className="w-4 h-4 text-white" />}
        products={mostPopularProducts}
        onAddToCart={onAddToCart}
        onQuickView={onQuickView}
        onAskAbout={onAskAbout}
        cartItems={cartItems}
        accentColor="linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))"
        categories={carouselCategories.popular}
        bannerKey="mostPopular"
      />
    </div>
  );
};
