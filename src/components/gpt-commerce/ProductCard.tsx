import { Truck, Star, ShieldCheck, Plus, GitCompare } from "lucide-react";
import { Product, formatPersianPrice, toPersianNumber } from "@/data/gptCommerceData";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onCompare: (product: Product) => void;
  isInCart?: boolean;
}

export const ProductCard = ({ product, onAddToCart, onCompare, isInCart }: ProductCardProps) => {
  return (
    <div 
      className="bg-white border border-[#E5E7EB] rounded-2xl p-3 hover:shadow-lg transition-all duration-200 group"
      dir="rtl"
    >
      {/* Image */}
      <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-gray-100">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.originalPrice && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {toPersianNumber(Math.round((1 - product.price / product.originalPrice) * 100))}% تخفیف
          </div>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-foreground line-clamp-2 leading-relaxed">
          {product.name}
        </h4>

        {/* Merchant */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{product.merchant.logo}</span>
          <span>{product.merchant.name}</span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {product.fastDelivery && (
            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
              <Truck className="w-3 h-3" />
              ارسال سریع
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3 fill-amber-500" />
            {toPersianNumber(product.rating)}
          </span>
          {product.returnGuarantee && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" />
              ضمانت بازگشت
            </span>
          )}
        </div>

        {/* Price */}
        <div className="pt-2">
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through block">
              {formatPersianPrice(product.originalPrice)}
            </span>
          )}
          <span className="font-bold text-primary">
            {formatPersianPrice(product.price)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onAddToCart(product)}
            disabled={isInCart}
            className="flex-1 h-9 text-xs rounded-xl"
            variant={isInCart ? "secondary" : "default"}
          >
            {isInCart ? (
              'در سبد خرید'
            ) : (
              <>
                <Plus className="w-3 h-3 ml-1" />
                افزودن به سبد
              </>
            )}
          </Button>
          <Button
            onClick={() => onCompare(product)}
            variant="outline"
            className="h-9 px-3 rounded-xl"
          >
            <GitCompare className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
