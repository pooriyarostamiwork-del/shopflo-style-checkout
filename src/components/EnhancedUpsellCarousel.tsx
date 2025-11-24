import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "./ui/button";
import { UpsellProduct } from "@/types/checkout";
import { Progress } from "./ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface ProductVariant {
  id: string;
  name: string;
  priceModifier: number;
}

interface UpsellProductWithVariants extends UpsellProduct {
  variants?: {
    type: string; // "size", "color", "pack"
    options: ProductVariant[];
  }[];
}

interface EnhancedUpsellCarouselProps {
  products: UpsellProductWithVariants[];
  onAddProduct: (product: UpsellProduct, variant?: string) => void;
  addedProductIds: string[];
  currentTotal: number;
  nextTierThreshold?: number;
  nextTierReward?: string;
}

export const EnhancedUpsellCarousel = ({ 
  products, 
  onAddProduct,
  addedProductIds,
  currentTotal,
  nextTierThreshold,
  nextTierReward
}: EnhancedUpsellCarouselProps) => {
  const [addingId, setAddingId] = useState<number | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<number, Record<string, string>>>({});

  const handleAdd = (product: UpsellProductWithVariants) => {
    setAddingId(product.id);
    
    // Calculate final price based on variants
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

  return (
    <div className="border-t border-border pt-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-foreground">
          🛍️ You may also like
        </h3>
        {nextTierThreshold && amountNeeded > 0 && (
          <span className="text-xs text-primary font-medium">
            Add ₹{amountNeeded} to unlock perks
          </span>
        )}
      </div>

      {/* Gamified Progress Bar */}
      {nextTierThreshold && amountNeeded > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">
              Spend ₹{amountNeeded} more to unlock:
            </p>
          </div>
          <Progress value={progress} className="h-2 mb-2" />
          <div className="space-y-1">
            <p className="text-xs text-primary font-medium flex items-center gap-1">
              <Check className="w-3 h-3" />
              {nextTierReward}
            </p>
          </div>
        </div>
      )}
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {products.map((product) => {
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
          
          // Calculate display price
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
                min-w-[180px] bg-background border rounded-xl p-3 
                transition-all duration-300 hover:shadow-md hover:-translate-y-1
                ${isAdded ? 'border-accent bg-accent/10' : 'border-border'}
                ${isAdding ? 'animate-scale-in' : ''}
              `}
            >
              <div className="aspect-square bg-muted/30 rounded-lg mb-2 overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-2 min-h-[2.5rem]">
                {product.name}
              </h4>

              {/* Variant Selectors */}
              {product.variants && product.variants.map((variantType) => (
                <div key={variantType.type} className="mb-2">
                  <Select
                    value={productVariants[variantType.type] || ""}
                    onValueChange={(value) => handleVariantChange(product.id, variantType.type, value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={`Select ${variantType.type}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {variantType.options.map((option) => (
                        <SelectItem key={option.id} value={option.id} className="text-xs">
                          {option.name}
                          {option.priceModifier !== 0 && (
                            <span className="text-muted-foreground ml-1">
                              ({option.priceModifier > 0 ? '+' : ''}₹{option.priceModifier})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              <p className="text-base font-bold text-foreground mb-2">
                ₹{displayPrice}
              </p>
              
              <Button
                size="sm"
                variant={isAdded ? "secondary" : "default"}
                className="w-full h-8 text-xs"
                onClick={() => !isAdded && handleAdd(product)}
                disabled={isAdded || (product.variants && product.variants.some(v => !productVariants[v.type]))}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Added
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1" />
                    Add
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
