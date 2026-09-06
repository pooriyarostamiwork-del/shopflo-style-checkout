import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Check, Truck, RotateCcw, Shield, Star, Zap, Store, FileText, List, ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, formatPersianPrice, toPersianNumber } from "@/data/petabadData";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";
import { ProductImage } from "./ProductImage";

interface PDPProductComponentProps {
  product: Product;
  isInCart: boolean;
  onAddToCart: (product: Product) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showContextLabel?: boolean;
  onOtherSupplierClick?: (supplierName: string) => void;
  showImageNavigation?: boolean; // Enable image navigation for PDP page
  enableSwipeGallery?: boolean; // Mobile: native swipe + dots
}


// Generate random supplier prices based on product price (±10%)
const generateSupplierPrices = (productPrice: number) => {
  const names = [
    { id: 's1', name: 'دیجی‌استور', logo: '🏪', deliverySummary: '۳ تا ۵ روز کاری' },
    { id: 's2', name: 'تکنوشاپ', logo: '🛒', deliverySummary: 'ارسال اکسپرس' },
    { id: 's3', name: 'هایپرتک', logo: '📦', deliverySummary: '۲ تا ۴ روز کاری' },
  ];
  return names.map((s) => {
    const variance = (Math.random() * 0.2 - 0.1); // -10% to +10%
    const price = Math.round((productPrice * (1 + variance)) / 10000) * 10000;
    return { ...s, price: Math.max(price, 10000) };
  });
};

export const PDPProductComponent = ({
  product,
  isInCart,
  onAddToCart,
  isCollapsed = false,
  onToggleCollapse,
  showContextLabel = true,
  onOtherSupplierClick,
  showImageNavigation = false,
  enableSwipeGallery = false,
}: PDPProductComponentProps) => {
  const { getProductImage } = useHomepageSettings();
  const swipeScrollerRef = useRef<HTMLDivElement>(null);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    description: true, // Open by default (as per requirement)
    comments: false, // Closed by default (as per requirement)
    specs: false,
    suppliers: false,
  });
  
  // Image gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const mainProductImage = getProductImage(product.id, product.image);
  // Use real image URLs from product data, fall back to main image only
  const productImages = product.imageUrls && product.imageUrls.length > 0
    ? product.imageUrls
    : [mainProductImage];
  const productImage = productImages[currentImageIndex] || mainProductImage;
  
  const [otherSuppliers] = useState(() => generateSupplierPrices(product.price));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentImageIndex(prev => prev === 0 ? productImages.length - 1 : prev - 1);
    } else {
      setCurrentImageIndex(prev => prev === productImages.length - 1 ? 0 : prev + 1);
    }
  };

  const discountPercent = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div 
      className="rounded-2xl overflow-hidden animate-fade-in"
      style={{
        background: 'hsl(0 0% 100%)',
        border: '1px solid hsl(0 0% 0% / 0.08)',
      }}
    >
      {/* Context Label */}
      {showContextLabel && (
        <div 
          className="px-4 py-2 flex items-center justify-between"
          style={{ 
            background: 'hsl(var(--primary) / 0.05)',
            borderBottom: '1px solid hsl(0 0% 0% / 0.05)'
          }}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs text-primary font-medium">شروع گفتگو از این محصول</span>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Collapsed Summary */}
      {isCollapsed && (
        <div className="px-4 py-3 flex items-center gap-3">
          <ProductImage
            src={productImage}
            alt={product.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium truncate">{product.name}</h3>
            <p className="text-xs text-primary font-medium">{formatPersianPrice(product.price)}</p>
          </div>
          <Button
            size="sm"
            onClick={() => onAddToCart(product)}
            disabled={!product.inStock || isInCart}
            className="rounded-lg"
          >
            {isInCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      )}

      {/* Expanded Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* Product Layout */}
          <div className="flex gap-6">
            {/* Product Image with optional navigation */}
            <div className="w-56 flex-shrink-0">
              {enableSwipeGallery ? (
                <>
                  <div
                    className="aspect-square rounded-xl overflow-hidden relative"
                    style={{ border: '1px solid hsl(0 0% 0% / 0.06)' }}
                  >
                    <div
                      ref={swipeScrollerRef}
                      dir="ltr"
                      onScroll={() => {
                        const el = swipeScrollerRef.current;
                        if (!el) return;
                        const idx = Math.round(el.scrollLeft / el.clientWidth);
                        if (idx !== currentImageIndex) setCurrentImageIndex(idx);
                      }}
                      className="w-full h-full flex overflow-x-auto snap-x snap-mandatory"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
                    >
                      <style>{`.pdp-swipe::-webkit-scrollbar{display:none}`}</style>
                      {productImages.map((src, i) => (
                        <div key={i} className="w-full h-full flex-shrink-0 snap-start">
                          <ProductImage src={src} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    {discountPercent > 0 && (
                      <div
                        className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold text-white z-10"
                        style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                      >
                        {toPersianNumber(discountPercent)}٪
                      </div>
                    )}
                  </div>
                  {productImages.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-2">
                      {productImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentImageIndex(idx);
                            const el = swipeScrollerRef.current;
                            if (el) el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
                          }}
                          className={`h-1.5 rounded-full transition-all duration-200 ${
                            idx === currentImageIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30 w-1.5'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div
                    className="aspect-square rounded-xl overflow-hidden relative group cursor-pointer"
                    style={{ border: '1px solid hsl(0 0% 0% / 0.06)' }}
                    onClick={() => showImageNavigation && setIsLightboxOpen(true)}
                  >
                    <ProductImage
                      src={productImage}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Discount Badge */}
                    {discountPercent > 0 && (
                      <div
                        className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                      >
                        {toPersianNumber(discountPercent)}٪
                      </div>
                    )}

                    {/* Expand button - only when navigation is enabled */}
                    {showImageNavigation && (
                      <button
                        className="absolute top-2 left-2 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'hsl(0 0% 0% / 0.5)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsLightboxOpen(true);
                        }}
                      >
                        <Maximize2 className="w-4 h-4 text-white" />
                      </button>
                    )}

                    {/* Navigation arrows - only when multiple images */}
                    {showImageNavigation && productImages.length > 1 && (
                      <>
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'hsl(0 0% 100% / 0.9)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateImage('prev');
                          }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'hsl(0 0% 100% / 0.9)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateImage('next');
                          }}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Image indicators - only when navigation is enabled */}
                  {showImageNavigation && productImages.length > 1 && (
                    <div className="flex justify-center gap-1.5 mt-2">
                      {productImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            idx === currentImageIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

            </div>

            {/* Product Info */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Store className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{product.merchant.name}</span>
                </div>
                <h1 className="text-lg font-bold text-foreground">{product.name}</h1>
              </div>

              {/* Color Options / Variants */}
              {product.colorOptions && product.colorOptions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">رنگ‌های موجود:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.colorOptions.map((color, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-full border border-border/60 bg-muted/30 text-foreground cursor-default"
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-primary">{formatPersianPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPersianPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {product.fastDelivery && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700">
                    <Truck className="w-3 h-3" />
                    ارسال سریع
                  </span>
                )}
                {product.returnGuarantee && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700">
                    <RotateCcw className="w-3 h-3" />
                    ضمانت بازگشت
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary">
                  <Shield className="w-3 h-3" />
                  گارانتی اصالت
                </span>
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2">
                <span className={`text-xs ${product.inStock ? 'text-green-600' : 'text-red-500'}`}>
                  {product.inStock ? '✓ موجود در انبار' : '✗ ناموجود'}
                </span>
              </div>

              {/* Shipping Conditions - Embedded, not collapsible */}
              <div 
                className="p-3 rounded-lg"
                style={{ background: 'hsl(var(--primary) / 0.03)', border: '1px solid hsl(var(--primary) / 0.08)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">شرایط ارسال</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ارسال رایگان برای سفارش‌های بالای ۵۰۰ هزار تومان. 
                  زمان تحویل: ۲ تا ۵ روز کاری در تهران و ۳ تا ۷ روز کاری در سایر شهرها.
                </p>
              </div>

              {/* Actions - No wishlist or share */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => onAddToCart(product)}
                  disabled={!product.inStock || isInCart}
                  className="flex-1 h-11 rounded-xl"
                >
                  {isInCart ? (
                    <>
                      <Check className="w-4 h-4 ml-2" />
                      در سبد خرید
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 ml-2" />
                      افزودن به سبد
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="space-y-2 pt-2">
            
            {/* 1. Product Description - FIRST, collapsed by default */}
            <div 
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid hsl(0 0% 0% / 0.06)' }}
            >
              <button
                onClick={() => toggleSection('description')}
                className="w-full px-4 py-3 flex items-center justify-between text-right hover:bg-muted/30 transition-colors"
                style={{ background: 'hsl(0 0% 99%)' }}
              >
                <span className="text-sm font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  توضیحات محصول
                </span>
                {expandedSections.description ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              <div 
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{
                  maxHeight: expandedSections.description ? '200px' : '0px',
                  opacity: expandedSections.description ? 1 : 0,
                }}
              >
                <div className="p-4" style={{ borderTop: '1px solid hsl(0 0% 0% / 0.04)' }}>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description || 'توضیحی برای این محصول ارائه نشده است.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Technical Specs - Modern minimal table style */}
            <div 
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid hsl(0 0% 0% / 0.06)' }}
            >
              <button
                onClick={() => toggleSection('specs')}
                className="w-full px-4 py-3 flex items-center justify-between text-right hover:bg-muted/30 transition-colors"
                style={{ background: 'hsl(0 0% 99%)' }}
              >
                <span className="text-sm font-medium flex items-center gap-2">
                  <List className="w-4 h-4 text-muted-foreground" />
                  مشخصات فنی
                </span>
                {expandedSections.specs ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              <div 
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{
                  maxHeight: expandedSections.specs ? '500px' : '0px',
                  opacity: expandedSections.specs ? 1 : 0,
                }}
              >
                <div className="p-4" style={{ borderTop: '1px solid hsl(0 0% 0% / 0.04)' }}>
                  {product.specs && product.specs.length > 0 ? (
                    <div className="space-y-0">
                      {product.specs.map((spec, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center py-2.5"
                          style={{ 
                            borderBottom: idx < product.specs!.length - 1 ? '1px solid hsl(0 0% 0% / 0.04)' : 'none' 
                          }}
                        >
                          <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{spec.label}</span>
                          <span className="text-sm text-foreground">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">مشخصات فنی برای این محصول ارائه نشده.</p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Product Comments - ONLY product comments, always open by default */}
            <div 
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid hsl(0 0% 0% / 0.06)' }}
            >
              <button
                onClick={() => toggleSection('comments')}
                className="w-full px-4 py-3 flex items-center justify-between text-right hover:bg-muted/30 transition-colors"
                style={{ background: 'hsl(0 0% 99%)' }}
              >
                <span className="text-sm font-medium flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  نظرات محصول
                </span>
                {expandedSections.comments ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              <div 
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{
                  maxHeight: expandedSections.comments ? '300px' : '0px',
                  opacity: expandedSections.comments ? 1 : 0,
                }}
              >
                <div className="p-4" style={{ borderTop: '1px solid hsl(0 0% 0% / 0.04)' }}>
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">خلاصه نظرات کاربران</h4>
                    <p className="text-sm text-foreground leading-relaxed">
                      {product.reviewsSummary || 'نظری برای این محصول ارائه نشده.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Other Suppliers */}
            <div 
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid hsl(0 0% 0% / 0.06)' }}
            >
              <button
                onClick={() => toggleSection('suppliers')}
                className="w-full px-4 py-3 flex items-center justify-between text-right hover:bg-muted/30 transition-colors"
                style={{ background: 'hsl(0 0% 99%)' }}
              >
                <span className="text-sm font-medium flex items-center gap-2">
                  <Store className="w-4 h-4 text-muted-foreground" />
                  فروشنده‌های دیگر این محصول
                </span>
                {expandedSections.suppliers ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              <div 
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{
                  maxHeight: expandedSections.suppliers ? '300px' : '0px',
                  opacity: expandedSections.suppliers ? 1 : 0,
                }}
              >
                <div className="p-3 space-y-2" style={{ borderTop: '1px solid hsl(0 0% 0% / 0.04)' }}>
                  {otherSuppliers.map((supplier) => (
                    <button
                      key={supplier.id}
                      onClick={() => onOtherSupplierClick?.(supplier.name)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-primary/5 text-right"
                      style={{ border: '1px solid hsl(0 0% 0% / 0.06)' }}
                    >
                      <span className="text-lg">{supplier.logo}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{supplier.name}</p>
                        <p className="text-xs text-muted-foreground">{supplier.deliverySummary}</p>
                      </div>
                      <span className="text-sm font-bold text-primary">{formatPersianPrice(supplier.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => setIsLightboxOpen(false)}
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="relative max-w-4xl max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <ProductImage
              src={productImage}
              alt={product.name}
              className="max-w-full max-h-[80vh] object-contain rounded-xl min-w-[300px] min-h-[300px]"
            />
            
            {productImages.length > 1 && (
              <>
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center"
                  onClick={() => navigateImage('prev')}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center"
                  onClick={() => navigateImage('next')}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          
          {/* Image indicators */}
          {productImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {productImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === currentImageIndex ? 'bg-white w-5' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};