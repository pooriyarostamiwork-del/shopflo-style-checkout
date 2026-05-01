import { Plus, Info, Bookmark, Star, Store } from "lucide-react";
import { Product, formatPersianPrice, toPersianNumber } from "@/data/gptCommerceData";
import { Button } from "@/components/ui/button";
import { useHomepageSettings } from "@/contexts/HomepageSettingsContext";
import { ProductImage } from "./ProductImage";

interface ChatProductCardProps {
  product: Product;
  index: number; // 1-based index for display
  onAddToCart: (product: Product) => void;
  onCompare: (product: Product) => void;
  onSave?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onInlineDetails?: (product: Product) => void; // For chat mode - injects details inline
  isInCart?: boolean;
  isSaved?: boolean;
  useInlineDetails?: boolean; // Whether to use inline chat details instead of modal
}

export const ChatProductCard = ({ 
  product, 
  index, 
  onAddToCart, 
  onCompare, 
  onSave,
  onViewDetails,
  onInlineDetails,
  isInCart,
  isSaved,
  useInlineDetails = false // Default to modal behavior
}: ChatProductCardProps) => {
  const { getChatProductImage } = useHomepageSettings();
  
  return (
    <div 
      className="w-[240px] h-[420px] rounded-xl overflow-hidden transition-all duration-200 group flex flex-col relative"
      style={{
        background: 'hsl(0 0% 100%)',
        border: '1px solid hsl(0 0% 0% / 0.08)',
      }}
      dir="rtl"
    >
      {/* Badges Row - Aligned */}
      <div className="absolute top-3 right-3 left-3 z-10 flex items-center justify-between">
        {/* Number Badge */}
        <div 
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
            boxShadow: '0 2px 8px hsl(var(--primary) / 0.4)',
          }}
        >
          {toPersianNumber(index)}
        </div>

        {/* Discount Badge */}
        {product.originalPrice && (
          <div 
            className="px-2 py-1 rounded-lg text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
          >
            {toPersianNumber(Math.round((1 - product.price / product.originalPrice) * 100))}٪
          </div>
        )}
      </div>

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
        {product.fastDelivery && (
          <div 
            className="absolute bottom-2 left-2 px-2 py-1 rounded-lg text-xs text-white"
            style={{ background: 'hsl(142 70% 45% / 0.9)' }}
          >
            ارسال سریع
          </div>
        )}
      </div>

      {/* Divider between image and content */}
      <div className="w-full h-px" style={{ background: 'hsl(0 0% 0% / 0.06)' }} />

      {/* Content - Flex grow to fill remaining space */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Title - Fixed height for up to 3 lines */}
        <h4 className="font-medium text-sm text-foreground line-clamp-3 leading-relaxed min-h-[3.75rem]">
          {product.name}
        </h4>

        {/* Rating & Merchant */}
        <div className="flex items-center gap-1 mt-2">
          <Star className="w-3 h-3 fill-current text-amber-400" />
          <span className="text-xs text-muted-foreground">{toPersianNumber(product.rating)}</span>
          <span className="mx-1 text-xs text-muted-foreground/60">|</span>
          <Store className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{product.merchant.name}</span>
        </div>

        {/* Price */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-2">
          <span className="text-sm font-bold text-foreground">
            {formatPersianPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPersianPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Actions - Bottom - Fixed at bottom of card with mt-auto */}
        <div className="flex items-center gap-2 pt-3 mt-auto border-t" style={{ borderColor: 'hsl(0 0% 0% / 0.04)' }}>
          {/* Save Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave?.(product);
            }}
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              isSaved 
                ? 'bg-amber-500 text-white' 
                : 'bg-transparent border border-border/60 hover:border-amber-400 hover:bg-amber-50'
            }`}
            title={isSaved ? 'حذف از ذخیره‌شده‌ها' : 'ذخیره در این سبد'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : 'text-muted-foreground'}`} />
          </button>
          
          {/* Add to Cart Button */}
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
          
          {/* Details Button - Opens modal OR injects inline chat details based on mode */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Use inline details for chat mode, modal for non-chat
              if (useInlineDetails && onInlineDetails) {
                onInlineDetails(product);
              } else if (onViewDetails) {
                onViewDetails(product);
              }
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
