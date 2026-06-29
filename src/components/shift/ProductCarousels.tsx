import { ChevronLeft, ChevronRight, Plus, Info, Grid2X2, Star, Store } from "lucide-react";
import { Product, toPersianNumber, formatPersianPrice, merchants } from "@/features/shift/data/shiftData";
import { useRef, useState } from "react";
import { useHomepageSettings, BannerConfigs, HorizontalBannerConfigs } from "@/contexts/HomepageSettingsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductCarouselsProps {
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onAskAbout: (productName: string) => void;
  cartItems: Product[];
}

// Subcategory config for carousel sections
const subcategoryConfig: {
  subcategory: string;
  title: string;
  emoji: string;
  accentColor: string;
  bannerKey: keyof BannerConfigs;
}[] = [
  { subcategory: 'هدفون، هدست و هندزفری', title: 'هدفون و هندزفری', emoji: '🎧', accentColor: 'linear-gradient(135deg, #ef4444, #f97316)', bannerKey: 'hotDeals' },
  { subcategory: 'ساعت و مچ‌بند هوشمند', title: 'ساعت هوشمند', emoji: '⌚', accentColor: 'linear-gradient(135deg, #ec4899, #f472b6)', bannerKey: 'youMayLike' },
  { subcategory: 'گوشی موبایل', title: 'گوشی موبایل', emoji: '📱', accentColor: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))', bannerKey: 'mostPopular' },
  { subcategory: 'لپ تاپ', title: 'لپ‌تاپ', emoji: '💻', accentColor: 'linear-gradient(135deg, #6366f1, #818cf8)', bannerKey: 'hotDeals' },
  { subcategory: 'لوازم جانبی گوشی موبایل', title: 'لوازم جانبی موبایل', emoji: '🔌', accentColor: 'linear-gradient(135deg, #14b8a6, #2dd4bf)', bannerKey: 'youMayLike' },
  { subcategory: 'هارد اکسترنال', title: 'هارد اکسترنال', emoji: '💾', accentColor: 'linear-gradient(135deg, #92400e, #b45309)', bannerKey: 'mostPopular' },
  { subcategory: 'دوربین دیجیتال', title: 'دوربین دیجیتال', emoji: '📷', accentColor: 'linear-gradient(135deg, #a855f7, #d946ef)', bannerKey: 'hotDeals' },
  { subcategory: 'کیبورد و ماوس', title: 'کیبورد و ماوس', emoji: '⌨️', accentColor: 'linear-gradient(135deg, #16a34a, #22c55e)', bannerKey: 'youMayLike' },
];

const merchantMap: Record<string, typeof merchants[0]> = {
  m1: merchants[0],
  m2: merchants[1],
  m3: merchants[2] || { id: 'm3', name: 'تکنولایف', logo: '💻' },
};

function mapDbProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    originalPrice: row.original_price || undefined,
    image: row.image_url,
    imageUrls: row.image_urls || undefined,
    description: row.description || undefined,
    merchant: merchantMap[row.merchant_id] || merchants[0],
    rating: Number(row.rating) || 4.0,
    fastDelivery: row.fast_delivery,
    returnGuarantee: row.return_guarantee,
    inStock: row.in_stock,
  };
}

interface CarouselSectionProps {
  title: string;
  icon: React.ReactNode;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onAskAbout: (productName: string) => void;
  cartItems: Product[];
  accentColor: string;
  bannerKey: keyof BannerConfigs;
  isLoading?: boolean;
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
  bannerKey,
  isLoading,
}: CarouselSectionProps) => {
  const { getProductImage, getBanner, getCarouselName, getProductName } = useHomepageSettings();
  const banner = getBanner(bannerKey);
  const displayTitle = getCarouselName(bannerKey, title);
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

  return (
    <div className="relative">
      {/* Header with Title */}
      <div className="flex flex-wrap items-center gap-3 mb-4 px-1">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: accentColor }}
          >
            {icon}
          </div>
          <h3 className="font-semibold text-foreground whitespace-nowrap">{displayTitle}</h3>
        </div>

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
        {/* Promotional Banner */}
        <div 
          className="hidden lg:flex flex-shrink-0 w-[140px] h-[420px] rounded-xl overflow-hidden flex-col items-center justify-center text-center p-4 cursor-pointer transition-all duration-200 hover:border-primary/20 relative"
          style={{
            background: banner.imageUrl 
              ? `url(${banner.imageUrl}) center/cover`
              : 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.15))',
          }}
          onClick={() => console.log('Promo clicked')}
        >
          {banner.imageUrl && banner.showText && (
            <div className="absolute inset-0 bg-black/30" />
          )}
          {banner.showText && (
            <div className="relative z-10 space-y-2">
              <p className="text-xs font-medium mb-1" style={{ color: banner.imageUrl ? 'white' : 'hsl(var(--foreground))' }}>
                {banner.title}
              </p>
              <div className="text-2xl font-bold" style={{ color: banner.imageUrl ? 'white' : 'hsl(var(--primary))' }}>
                {banner.subtitle}
              </div>
              <span className="text-xs underline" style={{ color: banner.imageUrl ? 'white' : 'hsl(var(--muted-foreground))' }}>
                {banner.ctaText}
              </span>
            </div>
          )}
        </div>

        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex-1 grid grid-flow-col auto-cols-[220px] gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory' }}
        >
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[220px] h-[420px] rounded-xl overflow-hidden" style={{ border: '1px solid hsl(0 0% 0% / 0.08)' }}>
                <Skeleton className="w-full aspect-square" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))
          ) : (
            <>
              {products.map((product) => {
                const isInCart = cartItems.some(item => item.id === product.id);
                const discountPercent = product.originalPrice 
                  ? Math.round((1 - product.price / product.originalPrice) * 100)
                  : 0;

                return (
                  <div
                    key={product.id}
                    className="flex-shrink-0 w-[220px] h-[420px] rounded-xl overflow-hidden transition-all duration-200 group cursor-pointer hover:border-primary/20 flex flex-col"
                    style={{
                      background: 'hsl(0 0% 100%)',
                      border: '1px solid hsl(0 0% 0% / 0.08)',
                      scrollSnapAlign: 'start',
                    }}
                    onClick={() => onQuickView(product)}
                  >
                    <div className="relative w-full flex-shrink-0 aspect-square" style={{ background: 'hsl(0 0% 98%)' }}>
                      <img
                        src={getProductImage(product.id, product.image)}
                        alt={getProductName(product.id, product.name)}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                      {discountPercent > 0 && (
                        <div className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                          {toPersianNumber(discountPercent)}٪
                        </div>
                      )}
                      {product.fastDelivery && (
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs text-white" style={{ background: 'hsl(142 70% 45% / 0.9)' }}>
                          ارسال سریع
                        </div>
                      )}
                    </div>

                    <div className="w-full h-px flex-shrink-0" style={{ background: 'hsl(0 0% 0% / 0.06)' }} />

                    <div className="p-3 flex-1 flex flex-col min-h-0">
                      <h4 className="text-sm font-medium text-foreground line-clamp-3 leading-relaxed flex-shrink-0" style={{ minHeight: '3.75rem' }}>
                        {getProductName(product.id, product.name)}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0 mt-2">
                        <Star className="w-3 h-3 fill-current text-amber-400" />
                        <span className="text-xs text-muted-foreground">{toPersianNumber(product.rating)}</span>
                        <span className="mx-1 text-xs text-muted-foreground/60">|</span>
                        <Store className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{product.merchant.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 mt-2">
                        <span className="text-sm font-bold text-foreground">{formatPersianPrice(product.price)}</span>
                        {product.originalPrice && (
                          <span className="text-xs text-muted-foreground line-through">{formatPersianPrice(product.originalPrice)}</span>
                        )}
                      </div>
                      <div className="flex-1" />
                    </div>

                    <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0 border-t" style={{ borderColor: 'hsl(0 0% 0% / 0.04)', height: '56px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                        disabled={isInCart}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 flex-shrink-0"
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
                        onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:border-primary/20"
                        style={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(0 0% 0% / 0.08)' }}
                        title={`جزئیات ${product.name}`}
                      >
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">جزئیات</span>
                      </button>
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
                <div className="relative aspect-square overflow-hidden flex items-center justify-center" style={{ background: 'hsl(0 0% 96%)' }}>
                  <div className="absolute inset-0 flex items-center justify-center" style={{ backdropFilter: 'blur(8px)', background: 'hsl(0 0% 100% / 0.7)' }}>
                    <Grid2X2 className="w-12 h-12 text-primary/40 group-hover:text-primary/60 transition-colors duration-200" />
                  </div>
                </div>
                <div className="p-4 flex flex-col items-center justify-center min-h-[120px] text-center">
                  <p className="text-sm font-medium text-foreground leading-relaxed">مشاهده</p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">همه</p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">محصولات</p>
                  <ChevronLeft className="w-5 h-5 text-primary mt-2 group-hover:translate-x-[-4px] transition-transform duration-200" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Horizontal promotional banner component between carousels
const HorizontalPromoBanner = ({ position }: { position: keyof HorizontalBannerConfigs }) => {
  // Feature flag — flip to true to re-enable promotional banners between carousels.
  const SHOW_PROMO_BANNERS = false;
  if (!SHOW_PROMO_BANNERS) return null;

  const { getHorizontalBanner } = useHomepageSettings();
  const banner = getHorizontalBanner(position);
  
  if (!banner.enabled) return null;
  
  return (
    <div 
      className="w-full h-[145px] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:opacity-95"
      style={{
        background: banner.imageUrl 
          ? `url(${banner.imageUrl}) center/cover`
          : 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.15))',
        border: '1px solid hsl(0 0% 0% / 0.08)',
      }}
      onClick={() => console.log('Horizontal promo clicked')}
    >
      {!banner.imageUrl && (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
          بنر تبلیغاتی (از پنل مدیریت تنظیم کنید)
        </div>
      )}
    </div>
  );
};

export const ProductCarousels = ({ onAddToCart, onQuickView, onAskAbout, cartItems }: ProductCarouselsProps) => {
  // Fetch hot deals — cross-category products with highest discount %
  const { data: hotDealsProducts, isLoading: isLoadingDeals } = useQuery({
    queryKey: ['carousel-hot-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .not('original_price', 'is', null)
        .order('original_price', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Sort by discount percentage descending, take top 15
      const withDiscount = (data || [])
        .filter(r => r.original_price && r.original_price > r.price)
        .sort((a, b) => {
          const discA = 1 - a.price / (a.original_price || a.price);
          const discB = 1 - b.price / (b.original_price || b.price);
          return discB - discA;
        })
        .slice(0, 15);
      
      return withDiscount.map(mapDbProduct);
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch products grouped by subcategory
  const { data: productsBySubcategory, isLoading } = useQuery({
    queryKey: ['carousel-products'],
    queryFn: async () => {
      const results: Record<string, Product[]> = {};
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('subcategory', subcategoryConfig.map(s => s.subcategory))
        .eq('in_stock', true)
        .order('rating', { ascending: false })
        .limit(200);
      
      if (error) throw error;
      
      for (const row of data || []) {
        const sub = row.subcategory || '';
        if (!results[sub]) results[sub] = [];
        if (results[sub].length < 15) {
          results[sub].push(mapDbProduct(row));
        }
      }
      
      return results;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="w-full max-w-[960px] mx-auto px-4 mt-16 space-y-8 pb-16">
      {/* 🔥 Hot Deals — cross-category promotional carousel */}
      {(isLoadingDeals || (hotDealsProducts && hotDealsProducts.length > 0)) && (
        <CarouselSection
          title="داغ‌ترین تخفیف‌ها"
          icon={<span className="text-sm">🔥</span>}
          products={hotDealsProducts || []}
          onAddToCart={onAddToCart}
          onQuickView={onQuickView}
          onAskAbout={onAskAbout}
          cartItems={cartItems}
          accentColor="linear-gradient(135deg, #ef4444, #f97316)"
          bannerKey="hotDeals"
          isLoading={isLoadingDeals}
        />
      )}

      {subcategoryConfig.map((config, index) => {
        const products = productsBySubcategory?.[config.subcategory] || [];
        
        if (!isLoading && products.length === 0) return null;

        return (
          <div key={config.subcategory}>
            <CarouselSection
              title={config.title}
              icon={<span className="text-sm">{config.emoji}</span>}
              products={products}
              onAddToCart={onAddToCart}
              onQuickView={onQuickView}
              onAskAbout={onAskAbout}
              cartItems={cartItems}
              accentColor={config.accentColor}
              bannerKey={config.bannerKey}
              isLoading={isLoading}
            />
            {index === 1 && <div className="mt-8"><HorizontalPromoBanner position="afterHotDeals" /></div>}
            {index === 3 && <div className="mt-8"><HorizontalPromoBanner position="afterYouMayLike" /></div>}
          </div>
        );
      })}
    </div>
  );
};
