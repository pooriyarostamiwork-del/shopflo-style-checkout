import { useState } from "react";
import { Plus, Check, Package } from "lucide-react";
import { Button } from "./ui/button";
import { UpsellProduct } from "@/types/checkout";
import { Progress } from "./ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useLanguage, formatCurrency, toPersianNumber } from "@/i18n";

interface ProductVariant {
  id: string;
  name: string;
  priceModifier: number;
}

interface UpsellProductWithVariants extends UpsellProduct {
  variants?: {
    type: string;
    options: ProductVariant[];
  }[];
  nameFa?: string;
}

interface EnhancedUpsellCarouselLocalizedProps {
  products: UpsellProductWithVariants[];
  onAddProduct: (product: UpsellProduct, variant?: string) => void;
  addedProductIds: string[];
  currentTotal: number;
  nextTierThreshold?: number;
  nextTierReward?: string;
}

export const EnhancedUpsellCarouselLocalized = ({ 
  products, 
  onAddProduct,
  addedProductIds,
  currentTotal,
  nextTierThreshold,
  nextTierReward
}: EnhancedUpsellCarouselLocalizedProps) => {
  const { t, isRTL, language } = useLanguage();
  const [addingId, setAddingId] = useState<number | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<number, Record<string, string>>>({});

  const handleAdd = (product: UpsellProductWithVariants) => {
    setAddingId(product.id);
    
    let finalPrice = product.price;
    const productVariants = selectedVariants[product.id] || {};
    
    if (product.variants) {
      product.variants.forEach(variantType => {
        const selectedVariantId = productVariants[variantType.type];
        if (selectedVariantId) {
          const variant = variantType.options.find(v => v.id === selectedVariantId);
          if (variant) {
            finalPrice += variant.priceModifier;
          }
        }
      });
    }

    const variantLabel = Object.entries(productVariants)
      .map(([type, id]) => {
        const variantType = product.variants?.find(v => v.type === type);
        const variant = variantType?.options.find(v => v.id === id);
        return variant?.name;
      })
      .filter(Boolean)
      .join(", ");

    setTimeout(() => {
      onAddProduct({ ...product, price: finalPrice }, variantLabel);
      setAddingId(null);
    }, 300);
  };

  const handleVariantChange = (productId: number, variantType: string, variantId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [variantType]: variantId
      }
    }));
  };

  const getProductId = (product: UpsellProduct, variant?: string) => {
    return variant ? `${product.id}-${variant}` : product.id.toString();
  };

  const progress = nextTierThreshold ? Math.min((currentTotal / nextTierThreshold) * 100, 100) : 0;
  const amountNeeded = nextTierThreshold ? Math.max(nextTierThreshold - currentTotal, 0) : 0;

  const getVariantPlaceholder = (type: string) => {
    if (isRTL) {
      switch (type) {
        case "size": return "انتخاب سایز";
        case "color": return "انتخاب رنگ";
        case "pack": return "انتخاب بسته";
        default: return `انتخاب ${type}`;
      }
    }
    return `Select ${type}`;
  };

  // Get mock product name based on index
  const getProductName = (index: number) => {
    if (isRTL) {
      return `محصول ${toPersianNumber(index + 1)}`;
    }
    return `Product ${index + 1}`;
  };

  // Fixed height for variant area to maintain alignment
  const VARIANT_AREA_HEIGHT = "h-[72px]";

  return (
    <div className={`border-t border-border/50 pt-6 mt-6 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex items-center mb-4 ${isRTL ? 'justify-end' : 'justify-between'}`}>
        <h3 className={`text-base font-semibold text-foreground ${isRTL ? 'order-1' : ''}`}>
          {isRTL ? "شاید این‌ها را هم دوست داشته باشید" : "You might also like"}
        </h3>
        {nextTierThreshold && amountNeeded > 0 && (
          <span className={`text-xs text-primary font-medium ${isRTL ? 'order-2 ml-auto mr-0' : ''}`}>
            {isRTL 
              ? `${formatCurrency(amountNeeded, language)} دیگر برای جوایز`
              : `Add ${formatCurrency(amountNeeded, language)} to unlock perks`
            }
          </span>
        )}
      </div>

      {/* Gamified Progress Bar */}
      {nextTierThreshold && amountNeeded > 0 && (
        <div className="mb-5 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
          <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <p className="text-sm font-medium text-foreground">
              {isRTL 
                ? `${formatCurrency(amountNeeded, language)} دیگر برای فعال‌سازی:`
                : `Spend ${formatCurrency(amountNeeded, language)} more to unlock:`
              }
            </p>
          </div>
          <Progress value={progress} className="h-2 mb-3" />
          <div className="space-y-1">
            <p className={`text-xs text-primary font-medium flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <Check className="w-3.5 h-3.5" />
              {nextTierReward}
            </p>
          </div>
        </div>
      )}
      
      <div className={`flex gap-4 overflow-x-auto pb-2 scrollbar-hide ${isRTL ? 'flex-row-reverse' : ''}`}>
        {products.map((product, index) => {
          const productVariants = selectedVariants[product.id] || {};
          const variantLabel = Object.entries(productVariants)
            .map(([type, id]) => {
              const variantType = product.variants?.find(v => v.type === type);
              return variantType?.options.find(v => v.id === id)?.name;
            })
            .filter(Boolean)
            .join(", ");
          
          const productIdKey = getProductId(product, variantLabel);
          const isAdded = addedProductIds.includes(productIdKey);
          const isAdding = addingId === product.id;
          
          let displayPrice = product.price;
          if (product.variants) {
            product.variants.forEach(variantType => {
              const selectedVariantId = productVariants[variantType.type];
              if (selectedVariantId) {
                const variant = variantType.options.find(v => v.id === selectedVariantId);
                if (variant) {
                  displayPrice += variant.priceModifier;
                }
              }
            });
          }
          
          return (
            <div
              key={product.id}
              className={`
                min-w-[180px] max-w-[180px] bg-background border rounded-xl p-3 flex flex-col
                transition-colors duration-200
                ${isAdded ? 'border-accent bg-accent/5' : 'border-border/50'}
                ${isAdding ? 'animate-scale-in' : ''}
              `}
            >
              {/* Icon placeholder instead of image - Fixed Height */}
              <div className="aspect-square bg-muted/30 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                <Package className="w-12 h-12 text-muted-foreground/40" />
              </div>
              
              {/* Title - Fixed Height with RTL alignment */}
              <h4 className={`text-sm font-medium text-foreground mb-2 line-clamp-2 h-10 ${isRTL ? 'text-right' : ''}`}>
                {getProductName(index)}
              </h4>

              {/* Variant Selectors - Fixed Height Container */}
              <div className={`${product.variants ? VARIANT_AREA_HEIGHT : 'h-0'} mb-2`}>
                {product.variants && product.variants.map((variantType) => (
                  <div key={variantType.type} className="mb-2">
                    <Select
                      value={productVariants[variantType.type] || ""}
                      onValueChange={(value) => handleVariantChange(product.id, variantType.type, value)}
                    >
                      <SelectTrigger className={`h-8 text-xs ${isRTL ? 'text-right' : ''}`}>
                        <SelectValue placeholder={getVariantPlaceholder(variantType.type)} />
                      </SelectTrigger>
                      <SelectContent>
                        {variantType.options.map((option) => (
                          <SelectItem key={option.id} value={option.id} className="text-xs">
                            {option.name}
                            {option.priceModifier !== 0 && (
                              <span className="text-muted-foreground mx-1">
                                ({option.priceModifier > 0 ? '+' : ''}{formatCurrency(option.priceModifier, language)})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              
              {/* Price - Fixed Position with RTL alignment */}
              <p className={`text-base font-bold text-foreground mb-3 ${isRTL ? 'text-right' : ''}`}>
                {formatCurrency(displayPrice, language)}
              </p>
              
              {/* CTA Button - Fixed Position at Bottom */}
              <Button
                size="sm"
                variant={isAdded ? "secondary" : "default"}
                className={`w-full h-9 text-xs mt-auto ${isRTL ? 'flex-row-reverse' : ''}`}
                onClick={() => !isAdded && handleAdd(product)}
                disabled={isAdded || (product.variants && product.variants.some(v => !productVariants[v.type]))}
              >
                {isAdded ? (
                  <>
                    <Check className={`w-3.5 h-3.5 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {isRTL ? "اضافه شد" : "Added"}
                  </>
                ) : (
                  <>
                    <Plus className={`w-3.5 h-3.5 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {isRTL ? "افزودن به سفارش" : "Add to Order"}
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
