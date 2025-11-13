import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";

export interface CartProduct {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
}

interface CartItemProps {
  product: CartProduct;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}

export const CartItem = ({ product, onUpdateQuantity, onRemove }: CartItemProps) => {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="flex gap-4 p-4 bg-card rounded-xl shadow-sm border border-border hover:shadow-md transition-shadow">
      <img
        src={product.image}
        alt={product.name}
        className="w-24 h-24 object-cover rounded-lg"
      />
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-foreground">{product.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-primary">₹{product.price}</span>
              {product.originalPrice && (
                <>
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{product.originalPrice}
                  </span>
                  <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full font-medium">
                    {discount}% OFF
                  </span>
                </>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(product.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => onUpdateQuantity(product.id, Math.max(1, product.quantity - 1))}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-8 text-center font-medium">{product.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => onUpdateQuantity(product.id, product.quantity + 1)}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
