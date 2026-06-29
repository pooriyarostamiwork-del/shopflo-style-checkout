import { Truck, Star, ShieldCheck, Plus, Info, Store } from "lucide-react";
import { Product, formatPersianPrice, toPersianNumber } from "@/data/gptCommerceData";
import { Button } from "@/components/ui/button";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";
import { ProductImage } from "./ProductImage";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onCompare: (product: Product) => void;
  isInCart?: boolean;
}

export const ProductCard = ({ product, onAddToCart, onCompare, isInCart }: ProductCardProps) => {
  const { getChatProductImage } = useHomepageSettings();
  
  return (
    <div 
      className="w-[220px] h-[380px] rounded-xl overflow-hidden transition-all duration-200 group flex flex-col"
      style={{
        background: 'hsl(0 0% 100%)',
        border: '1px solid hsl(0 0% 0% / 0.08)',
      }}
      dir="rtl"
    >
      {/* Image - Square aspect ratio with full fill */}
      <div 
        className="relative w-full aspect-square"
        style={{ background: 'hsl(0 0% 98%)' }}
      >
        <ProductImage
          src={getChatProductImage(product.id, product.image)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.originalPrice && (
          <div 
            className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
          >
            {toPersianNumber(Math.round((1 - product.price / product.originalPrice) * 100))}٪
          </div>
        )}
        {product.fastDelivery && (
          <div 
            className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs text-white"
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
        <h4 className="font-medium text-sm text-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {product.name}
        </h4>

        {/* Rating & Merchant */}
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-current text-amber-400" />
          <span className="text-xs text-muted-foreground">{toPersianNumber(product.rating)}</span>
          <span className="mx-1 text-xs text-muted-foreground/60">|</span>
          <Store className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{product.merchant.name}</span>
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

        {/* Actions - Bottom - Fixed at bottom of card */}
        <div className="flex items-center gap-2 pt-2 mt-auto border-t" style={{ borderColor: 'hsl(0 0% 0% / 0.04)' }}>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={isInCart}
            className="w-8 h-8 rounded-full p-0 flex-shrink-0"
            style={{
              background: isInCart 
                ? 'hsl(142 70% 45%)' 
                : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.9))',
            }}
          >
            <Plus className="w-4 h-4 text-white" />
          </Button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompare(product);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 hover:border-primary/20"
            style={{
              background: 'hsl(0 0% 100%)',
              border: '1px solid hsl(0 0% 0% / 0.08)',
            }}
          >
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">جزئیات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
