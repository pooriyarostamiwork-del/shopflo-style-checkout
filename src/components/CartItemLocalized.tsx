import { Minus, Plus, X, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useLanguage, formatCurrency, toPersianNumber } from "@/i18n";

export interface CartProduct {
  id: number;
  name: string;
  nameFa?: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  inStock?: boolean;
}

interface CartItemLocalizedProps {
  product: CartProduct;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

export const CartItemLocalized = ({ product, onUpdateQuantity, onRemove }: CartItemLocalizedProps) => {
  const { t, isRTL, language } = useLanguage();
  
  const discount = product.originalPrice
    ? ((product.originalPrice - product.price) / product.originalPrice) * 100
    : 0;

  const itemSubtotal = product.price * product.quantity;
  const inStock = product.inStock !== false;

  const displayName = isRTL && product.nameFa ? product.nameFa : product.name;
  const displayQuantity = isRTL ? toPersianNumber(product.quantity) : product.quantity;
  const displayDiscount = isRTL ? toPersianNumber(discount.toFixed(0)) : discount.toFixed(0);

  return (
    <div className={`bg-card rounded-xl p-5 shadow-sm border border-border flex gap-5 hover:shadow-md hover:scale-[1.01] transition-all duration-300 animate-fade-in ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
        <img src={product.image} alt={displayName} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1">
        <div className={`flex justify-between items-start mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
            <h3 className="font-semibold text-foreground mb-1">{displayName}</h3>
            
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              {inStock ? (
                <span className="text-xs text-green-600 font-medium">✓ {t.cart.inStock}</span>
              ) : (
                <span className="text-xs text-destructive font-medium">{t.cart.outOfStock}</span>
              )}
            </div>

            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(product.price, language)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCurrency(product.originalPrice, language)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {displayDiscount}% {t.common.off}
                  </Badge>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(product.price, language)} × {displayQuantity} = {formatCurrency(itemSubtotal, language)}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(product.id)}
            className="text-muted-foreground hover:text-destructive rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className={`flex items-center gap-4 mt-3 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
          <button
            className={`flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            onClick={() => console.log("Move to wishlist")}
          >
            <Heart className="w-3.5 h-3.5" />
            {t.cart.moveToWishlist}
          </button>
        </div>

        <div className={`flex items-center justify-between mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 bg-muted rounded-xl p-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-background transition-all"
              onClick={() => onUpdateQuantity(product.id, Math.max(1, product.quantity - 1))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-10 text-center font-semibold text-foreground">{displayQuantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-background transition-all"
              onClick={() => onUpdateQuantity(product.id, product.quantity + 1)}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
