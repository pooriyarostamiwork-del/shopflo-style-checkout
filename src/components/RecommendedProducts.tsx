import { ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";

const recommendedProducts = [
  {
    id: 101,
    name: "Wireless Mouse",
    price: 899,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200&h=200&fit=crop",
  },
  {
    id: 102,
    name: "Phone Stand",
    price: 599,
    image: "https://images.unsplash.com/photo-1600375895535-b8c396e8ec3e?w=200&h=200&fit=crop",
  },
  {
    id: 103,
    name: "USB-C Cable",
    price: 399,
    image: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=200&h=200&fit=crop",
  },
  {
    id: 104,
    name: "Desk Lamp",
    price: 1299,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=200&h=200&fit=crop",
  },
];

export const RecommendedProducts = () => {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6 text-foreground">You may also like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendedProducts.map((product) => (
          <div
            key={product.id}
            className="bg-card rounded-xl border border-border p-4 hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-medium text-sm text-foreground mb-1 line-clamp-2">
              {product.name}
            </h3>
            <p className="text-lg font-bold text-foreground mb-3">₹{product.price}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 hover:bg-primary hover:text-white transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Add
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
