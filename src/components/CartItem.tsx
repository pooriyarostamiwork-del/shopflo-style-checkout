import { Minus, Plus, X, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export interface CartProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  inStock?: boolean;
}

interface CartItemProps {
  product: CartProduct;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

export const CartItem = ({ product, onUpdateQuantity, onRemove }: CartItemProps) => {
  const discount = product.originalPrice
    ? ((product.originalPrice - product.price) / product.originalPrice) * 100
    : 0;

  const itemSubtotal = product.price * product.quantity;
  const inStock = product.inStock !== false;

  return (
    <div className="bg-card rounded-xl p-5 shadow-sm border border-border flex gap-5 hover:shadow-md hover:scale-[1.01] transition-all duration-300 animate-fade-in">
      <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
            
            <div className="flex items-center gap-2 mb-2">
              {inStock ? (
                <span className="text-xs text-green-600 font-medium">✓ In stock</span>
              ) : (
                <span className="text-xs text-destructive font-medium">Out of stock</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">₹{product.price}</span>
              {product.originalPrice && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{product.originalPrice}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {discount.toFixed(0)}% OFF
                  </Badge>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              ₹{product.price} × {product.quantity} = ₹{itemSubtotal.toFixed(2)}
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

        <div className="flex items-center gap-4 mt-3">
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            onClick={() => console.log("Move to wishlist")}
          >
            <Heart className="w-3.5 h-3.5" />
            Move to Wishlist
          </button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-background transition-all"
              onClick={() => onUpdateQuantity(product.id, Math.max(1, product.quantity - 1))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-10 text-center font-semibold text-foreground">{product.quantity}</span>
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
