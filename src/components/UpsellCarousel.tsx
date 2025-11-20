import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Button } from "./ui/button";
import { UpsellProduct } from "@/types/checkout";

interface UpsellCarouselProps {
  products: UpsellProduct[];
  onAddProduct: (product: UpsellProduct) => void;
  addedProductIds: number[];
}

export const UpsellCarousel = ({ 
  products, 
  onAddProduct,
  addedProductIds 
}: UpsellCarouselProps) => {
  const [addingId, setAddingId] = useState<number | null>(null);

  const handleAdd = (product: UpsellProduct) => {
    setAddingId(product.id);
    setTimeout(() => {
      onAddProduct(product);
      setAddingId(null);
    }, 300);
  };

  return (
    <div className="border-t border-border pt-4 mt-4">
      <h3 className="text-base font-semibold text-foreground mb-3">
        🛍️ You may also like
      </h3>
      
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {products.map((product) => {
          const isAdded = addedProductIds.includes(product.id);
          const isAdding = addingId === product.id;
          
          return (
            <div
              key={product.id}
              className={`
                min-w-[160px] bg-background border rounded-xl p-3 
                transition-all duration-300 hover:shadow-md hover:-translate-y-1
                ${isAdded ? 'border-green-500 bg-green-50' : 'border-border'}
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
              
              <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-2">
                {product.name}
              </h4>
              
              <p className="text-base font-bold text-foreground mb-2">
                ₹{product.price}
              </p>
              
              <Button
                size="sm"
                variant={isAdded ? "secondary" : "default"}
                className="w-full h-8 text-xs"
                onClick={() => !isAdded && handleAdd(product)}
                disabled={isAdded}
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
