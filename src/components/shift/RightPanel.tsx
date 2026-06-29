import { useState } from "react";
import { ShoppingCart, Heart, Plus, Minus, Trash2, ChevronLeft, ChevronRight, Truck, Tag, ChevronDown, Sparkles, Store } from "lucide-react";
import { CartItem, Product, formatPersianPrice, toPersianNumber, favorites, calculateOrderSummary } from "@/features/shift/data/shiftData";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";
import { ProductImage } from "./ProductImage";

interface ProductVariant {
  id: string;
  name: string;
  type: string;
  value: string;
}

// Mock variants for products - generic format
const productVariants: Record<string, ProductVariant[]> = {
  'p1': [
    { id: 'v1', name: 'مشکی', type: 'رنگ', value: 'black' },
    { id: 'v2', name: 'نقره‌ای', type: 'رنگ', value: 'silver' },
    { id: 'v3', name: 'آبی', type: 'رنگ', value: 'blue' },
  ],
  'p2': [
    { id: 'v4', name: 'سفید', type: 'رنگ', value: 'white' },
    { id: 'v5', name: 'مشکی', type: 'رنگ', value: 'black' },
  ],
  'p3': [
    { id: 'v6', name: 'مشکی', type: 'رنگ', value: 'black' },
    { id: 'v7', name: 'سبز', type: 'رنگ', value: 'green' },
  ],
  'p4': [
    { id: 'v8', name: 'استاندارد', type: 'نسخه', value: 'standard' },
    { id: 'v9', name: 'پرو', type: 'نسخه', value: 'pro' },
  ],
  'p5': [
    { id: 'v10', name: '۶۴ گیگ', type: 'ظرفیت', value: '64gb' },
    { id: 'v11', name: '۱۲۸ گیگ', type: 'ظرفیت', value: '128gb' },
  ],
  'p6': [
    { id: 'v12', name: 'مشکی', type: 'رنگ', value: 'black' },
  ],
};

// Separate component for cart item to properly use hooks
const CartItemCard = ({
  item,
  variants,
  onUpdateQuantity,
  onRemoveItem,
}: {
  item: CartItem;
  variants: ProductVariant[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
}) => {
  const [selectedVariant, setSelectedVariant] = useState(variants[0]?.id || '');
  const variantType = variants[0]?.type || 'نوع';
  
  // Use consistent product image from context
  const { getChatProductImage } = useHomepageSettings();
  const productImage = getChatProductImage(item.id, item.image);
  
  return (
    <div className="flex gap-3">
      <ProductImage
        src={productImage}
        alt={item.name}
        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-foreground line-clamp-1">
          {item.name}
        </h4>
        <p className="text-xs text-primary font-medium mt-0.5">
          {formatPersianPrice(item.price)}
        </p>
        
        {/* Generic Variant Selector - Dropdown */}
        {variants.length > 1 && (
          <div className="mt-2">
            <Select value={selectedVariant} onValueChange={setSelectedVariant}>
              <SelectTrigger className="h-7 text-xs w-full border-border/50">
                <SelectValue placeholder={`انتخاب ${variantType}`} />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border/50 z-50">
                {variants.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id} className="text-xs">
                    {variant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <div 
            className="flex items-center gap-1 rounded-lg"
            style={{
              background: 'hsl(0 0% 100% / 0.8)',
              border: '1px solid hsl(0 0% 0% / 0.05)'
            }}
          >
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="p-1 hover:bg-muted/30 rounded-r-lg transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-2 text-sm font-medium">
              {toPersianNumber(item.quantity)}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="p-1 hover:bg-muted/30 rounded-l-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={() => onRemoveItem(item.id)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Separate component for favorites to use hooks properly
const FavoritesTab = ({ onAddToCart }: { onAddToCart: (product: Product) => void }) => {
  const { getChatProductImage } = useHomepageSettings();
  
  return (
    <div className="p-4 space-y-2">
      {favorites.map((product) => {
        const productImage = getChatProductImage(product.id, product.image);
        return (
          <div 
            key={product.id} 
            className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 bg-background border border-border/40"
          >
            <ProductImage
              src={productImage}
              alt={product.name}
              className="w-11 h-11 rounded-lg object-cover bg-muted/30 border border-border/30"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-foreground truncate">
                {product.name}
              </h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatPersianPrice(product.price)}
              </p>
            </div>
            {/* Actions - Always visible */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAddToCart(product)}
                className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors border border-border/30 hover:border-primary/30"
                title="افزودن به سبد"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
              </button>
              <button
                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors border border-border/30 hover:border-destructive/30"
                title="حذف"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface RightPanelProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  onAddToCart: (product: Product) => void;
  isOpen: boolean;
  onToggle: () => void;
  onAICheckout?: () => void;
  showAICheckout?: boolean;
}

type TabType = 'cart' | 'favorites';

export const RightPanel = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onAddToCart,
  isOpen,
  onToggle,
  onAICheckout,
  showAICheckout = true,
}: RightPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('cart');
  const [autoBuyPriceDrop, setAutoBuyPriceDrop] = useState(false);
  const [autoBuyMonthly, setAutoBuyMonthly] = useState(false);
  const [notifyPriceDrop, setNotifyPriceDrop] = useState(false);

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'cart', label: 'سبد', icon: <ShoppingCart className="w-4 h-4" />, count: cartItems.length },
    { id: 'favorites', label: 'علاقه‌مندی', icon: <Heart className="w-4 h-4" /> },
  ];

  // Calculate detailed order summary
  const orderSummary = calculateOrderSummary(cartItems);

  return (
    <>
      {/* Toggle Button - Always Visible */}
      <button
        onClick={onToggle}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-xl transition-all duration-300 hover:scale-110"
        style={{
          background: 'linear-gradient(135deg, hsl(0 0% 100% / 0.9), hsl(0 0% 100% / 0.7))',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1), 0 0 30px hsl(var(--primary) / 0.15), inset 0 1px 0 hsl(0 0% 100% / 0.5)',
          border: '1px solid hsl(0 0% 100% / 0.3)'
        }}
      >
        {isOpen ? (
          <ChevronLeft className="w-5 h-5 text-foreground" />
        ) : (
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-foreground" />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">
                {toPersianNumber(cartItems.length)}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Sidebar Panel */}
      <div 
        className={`fixed left-0 top-0 h-screen z-40 transition-all duration-500 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '340px' }}
        dir="rtl"
      >
        <div 
          className="h-full flex flex-col backdrop-blur-xl"
          style={{
            background: 'linear-gradient(180deg, hsl(0 0% 100% / 0.95), hsl(0 0% 100% / 0.85))',
            boxShadow: '4px 0 40px rgba(0, 0, 0, 0.08)',
            borderRight: '1px solid hsl(0 0% 100% / 0.3)'
          }}
        >
          {/* Tab Bar */}
          <div className="p-3 pt-4">
            <div 
              className="flex rounded-xl p-1 gap-1 backdrop-blur-xl"
              style={{
                background: 'hsl(0 0% 0% / 0.03)',
                border: '1px solid hsl(0 0% 100% / 0.3)'
              }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  style={{
                    background: activeTab === tab.id ? 'hsl(0 0% 100% / 0.9)' : 'transparent',
                    boxShadow: activeTab === tab.id ? '0 2px 10px rgba(0, 0, 0, 0.05)' : 'none'
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span 
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: 'hsl(var(--primary) / 0.1)',
                        color: 'hsl(var(--primary))'
                      }}
                    >
                      {toPersianNumber(tab.count)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'cart' && (
              <div className="p-4 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div 
                      className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                      style={{
                        background: 'hsl(0 0% 0% / 0.03)',
                        border: '1px solid hsl(0 0% 100% / 0.3)'
                      }}
                    >
                      <ShoppingCart className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">سبد خریدت خالیه</p>
                    <p className="text-xs text-muted-foreground mt-1">از چت بخواه محصول پیدا کنه!</p>
                  </div>
                ) : (
                  <>
                    {/* Grouped by Vendor with Full Details */}
                    {orderSummary.vendorSummaries.map((vendorSummary, index) => (
                      <div key={vendorSummary.merchant.id}>
                        {/* Vendor Separator - visible between vendors */}
                        {index > 0 && (
                          <div 
                            className="my-4 h-px w-full"
                            style={{ background: 'hsl(0 0% 0% / 0.08)' }}
                          />
                        )}
                        <div 
                          className="rounded-2xl overflow-hidden"
                          style={{
                            background: 'hsl(0 0% 100% / 0.6)',
                            border: '1px solid hsl(0 0% 0% / 0.08)',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
                          }}
                        >
                          {/* Header (single-vendor: merchant name hidden, show item count only) */}
                          <div 
                            className="px-3 py-2 flex items-center gap-2"
                            style={{ 
                              background: 'hsl(var(--primary) / 0.03)',
                              borderBottom: '1px solid hsl(0 0% 0% / 0.06)'
                            }}
                          >
                            <Store className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm">سبد خرید</span>
                            <span className="text-xs text-muted-foreground mr-auto">
                              {toPersianNumber(vendorSummary.items.length)} کالا
                            </span>
                          </div>

                          {/* Items */}
                          <div className="p-3 space-y-3">
                            {vendorSummary.items.map((item) => (
                              <CartItemCard
                                key={item.id}
                                item={item}
                                variants={productVariants[item.id] || []}
                                onUpdateQuantity={onUpdateQuantity}
                                onRemoveItem={onRemoveItem}
                              />
                            ))}
                          </div>

                          {/* Vendor Summary */}
                          <div 
                            className="px-3 py-2 space-y-1"
                            style={{ 
                              background: 'hsl(0 0% 0% / 0.02)',
                              borderTop: '1px solid hsl(0 0% 0% / 0.06)'
                            }}
                          >
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                ارسال
                              </span>
                              <span className={vendorSummary.deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                                {vendorSummary.deliveryFee === 0 ? 'رایگان 🎉' : formatPersianPrice(vendorSummary.deliveryFee)}
                              </span>
                            </div>
                            {vendorSummary.discount > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  تخفیف
                                </span>
                                <span className="text-red-500 font-medium">
                                  -{formatPersianPrice(vendorSummary.discount)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs font-medium pt-1 border-t" style={{ borderColor: 'hsl(0 0% 0% / 0.06)' }}>
                              <span>جمع فروشگاه</span>
                              <span>{formatPersianPrice(vendorSummary.total)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <FavoritesTab onAddToCart={onAddToCart} />
            )}
          </div>

          {/* Cart Footer with Full Summary */}
          {activeTab === 'cart' && cartItems.length > 0 && (
            <div 
              className="p-4 space-y-3"
              style={{
                background: 'hsl(0 0% 100% / 0.95)',
                borderTop: '1px solid hsl(0 0% 0% / 0.05)'
              }}
            >
              {/* Summary breakdown */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">جمع کالاها ({toPersianNumber(orderSummary.totalItems)})</span>
                  <span>{formatPersianPrice(orderSummary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">هزینه ارسال</span>
                  <span className={orderSummary.totalDelivery === 0 ? 'text-green-600' : ''}>
                    {orderSummary.totalDelivery === 0 ? 'رایگان' : formatPersianPrice(orderSummary.totalDelivery)}
                  </span>
                </div>
                {orderSummary.totalDiscount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">سود شما از تخفیف</span>
                    <span className="text-red-500">-{formatPersianPrice(orderSummary.totalDiscount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'hsl(0 0% 0% / 0.05)' }}>
                <span className="text-sm font-medium">جمع کل:</span>
                <span className="text-lg font-bold text-foreground">
                  {formatPersianPrice(orderSummary.grandTotal)}
                </span>
              </div>

              {/* AI Checkout CTA Button - Only show on first page (not chat mode) */}
              {showAICheckout && onAICheckout && (
                <Button
                  onClick={onAICheckout}
                  className="w-full gap-2 py-3 rounded-xl font-medium"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9))',
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  تکمیل خرید با هوش مصنوعی
                </Button>
              )}

              {/* AI Helper Text - Only show in chat mode (when AI checkout is hidden) */}
              {!showAICheckout && (
                <div 
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs text-muted-foreground"
                  style={{
                    background: 'hsl(var(--primary) / 0.05)',
                    border: '1px solid hsl(var(--primary) / 0.1)',
                  }}
                >
                  <span>🤖</span>
                  <span>با کمک هوش مصنوعی سفارش خودتون رو تکمیل کنید</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
