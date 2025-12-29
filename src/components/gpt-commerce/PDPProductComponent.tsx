import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Check, Truck, RotateCcw, Shield, Star, Zap, Store, FileText, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product, formatPersianPrice, toPersianNumber } from "@/data/gptCommerceData";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";

interface PDPProductComponentProps {
  product: Product;
  isInCart: boolean;
  onAddToCart: (product: Product) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  showContextLabel?: boolean;
  onOtherSupplierClick?: (supplierName: string) => void;
}

// Mock other suppliers data
const getOtherSuppliers = (productId: string) => [
  { id: 's1', name: 'دیجی‌استور', logo: '🏪', price: 4850000, deliverySummary: '۳ تا ۵ روز کاری' },
  { id: 's2', name: 'تکنوشاپ', logo: '🛒', price: 4920000, deliverySummary: 'ارسال اکسپرس' },
  { id: 's3', name: 'هایپرتک', logo: '📦', price: 4780000, deliverySummary: '۲ تا ۴ روز کاری' },
];

// Mock comments data - AI generated summaries
const getProductComments = () => ({
  productSummary: 'کاربران از کیفیت صدای عالی و نویز کنسلینگ قوی این محصول راضی هستند. باتری طولانی و راحتی بالا از نقاط قوت اصلی ذکر شده است. برخی کاربران اشاره کردند که در استفاده طولانی مدت کمی سنگین احساس می‌شود.',
  vendorSummary: 'این فروشنده امتیاز ۴.۷ از ۵ را کسب کرده و ۹۸٪ سفارشات را به موقع ارسال کرده است. پاسخگویی سریع و بسته‌بندی مناسب از مزایای اصلی این فروشگاه است.',
});

// Technical specs data
const getTechnicalSpecs = () => [
  { label: 'وزن', value: '۲۳۰ گرم' },
  { label: 'ابعاد', value: '۱۴ × ۷ × ۰.۸ سانتی‌متر' },
  { label: 'نوع اتصال', value: 'بلوتوث ۵.۰' },
  { label: 'عمر باتری', value: '۳۰ ساعت' },
  { label: 'زمان شارژ', value: '۲ ساعت' },
  { label: 'رنگ', value: 'مشکی' },
  { label: 'گارانتی', value: '۱۸ ماهه' },
];

export const PDPProductComponent = ({
  product,
  isInCart,
  onAddToCart,
  isCollapsed = false,
  onToggleCollapse,
  showContextLabel = true,
  onOtherSupplierClick,
}: PDPProductComponentProps) => {
  const { getProductImage } = useHomepageSettings();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    description: true, // Open by default (as per requirement)
    comments: false, // Closed by default (as per requirement)
    specs: false,
    suppliers: false,
  });

  const productImage = getProductImage(product.id, product.image);
  const otherSuppliers = getOtherSuppliers(product.id);
  const comments = getProductComments();
  const technicalSpecs = getTechnicalSpecs();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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
          <img 
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
            {/* Single Static Image - No gallery interactions */}
            <div className="w-56 flex-shrink-0">
              <div 
                className="aspect-square rounded-xl overflow-hidden relative"
                style={{ border: '1px solid hsl(0 0% 0% / 0.06)' }}
              >
                <img 
                  src={productImage} 
                  alt={product.name}
                  className="w-full h-full object-cover"
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
              </div>
            </div>

            {/* Product Info */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">{product.merchant.logo} {product.merchant.name}</span>
                </div>
                <h1 className="text-lg font-bold text-foreground">{product.name}</h1>
              </div>

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
                    این هدفون با فناوری پیشرفته نویز کنسلینگ، تجربه‌ای بی‌نظیر از گوش دادن به موسیقی را فراهم می‌کند. 
                    طراحی ارگونومیک و بالشتک‌های نرم، راحتی طولانی‌مدت را تضمین می‌کنند.
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
                  {/* Modern minimal table */}
                  <div className="space-y-0">
                    {technicalSpecs.map((spec, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center py-2.5"
                        style={{ 
                          borderBottom: idx < technicalSpecs.length - 1 ? '1px solid hsl(0 0% 0% / 0.04)' : 'none' 
                        }}
                      >
                        <span className="text-xs text-muted-foreground w-28 flex-shrink-0">{spec.label}</span>
                        <span className="text-sm text-foreground">{spec.value}</span>
                      </div>
                    ))}
                  </div>
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
                  {/* Only Product Comments Summary - NO vendor comments here */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">خلاصه نظرات کاربران</h4>
                    <p className="text-sm text-foreground leading-relaxed">{comments.productSummary}</p>
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
    </div>
  );
};