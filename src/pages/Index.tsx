import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { CartItem, CartProduct } from "@/components/CartItem";
import { OrderSummary } from "@/components/OrderSummary";
import { CheckoutModal } from "@/components/CheckoutModal";
import { SuccessScreen } from "@/components/SuccessScreen";

const Index = () => {
  const [cartItems, setCartItems] = useState<CartProduct[]>([
    {
      id: 1,
      name: "Premium Wireless Headphones",
      price: 2499,
      originalPrice: 3999,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop",
      quantity: 1,
    },
    {
      id: 2,
      name: "Smart Fitness Watch",
      price: 4999,
      originalPrice: 7999,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop",
      quantity: 2,
    },
    {
      id: 3,
      name: "Leather Laptop Bag",
      price: 1999,
      originalPrice: 2999,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop",
      quantity: 1,
    },
  ]);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  const updateQuantity = (id: number, quantity: number) => {
    setCartItems(items =>
      items.map(item => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeItem = (id: number) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = cartItems.reduce(
    (sum, item) =>
      sum + ((item.originalPrice || item.price) - item.price) * item.quantity,
    0
  );
  const shipping = 0; // Free shipping
  const total = subtotal - discount + shipping;

  const handleCheckoutSuccess = () => {
    setIsCheckoutOpen(false);
    setIsSuccessOpen(true);
  };

  const handleSuccessClose = () => {
    setIsSuccessOpen(false);
    setCartItems([]);
  };

  const orderId = `SF${Math.floor(Math.random() * 100000)}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ShopFlow
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">{cartItems.length}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground">Add some products to get started!</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold mb-4 text-foreground">
                Shopping Cart ({cartItems.length} items)
              </h2>
              {cartItems.map(item => (
                <CartItem
                  key={item.id}
                  product={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <OrderSummary
                subtotal={subtotal}
                discount={discount}
                shipping={shipping}
                onCheckout={() => setIsCheckoutOpen(true)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-6 border-t border-border">
        <p className="text-center text-sm text-muted-foreground">
          Demo inspired by <span className="font-semibold text-foreground">Shopflo</span> — built for presentation purposes only.
        </p>
      </footer>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        total={total}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Success Screen */}
      <SuccessScreen
        isOpen={isSuccessOpen}
        onClose={handleSuccessClose}
        orderId={orderId}
      />
    </div>
  );
};

export default Index;
