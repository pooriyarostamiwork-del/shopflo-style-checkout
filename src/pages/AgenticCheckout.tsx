import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgenticChatInterface } from "@/components/AgenticChatInterface";
import { ProductCard } from "@/components/ProductCard";
import { FilterChips, FilterState } from "@/components/FilterChips";
import { CheckoutModal } from "@/components/CheckoutModal";
import { SuccessScreen } from "@/components/SuccessScreen";
import {
  ChatMessage,
  Product,
  searchProducts,
  getMerchantById,
} from "@/data/agenticData";

export default function AgenticCheckout() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    merchant: string;
    deliveryETA: string;
  } | null>(null);

  const simulateAgentResponse = (userMessage: string): ChatMessage => {
    const messageLower = userMessage.toLowerCase();
    
    // Parse filters from message
    const newFilters: FilterState = { ...filters };
    let shouldSearch = false;
    let responseText = "";

    // Check for autonomous ordering
    if (
      messageLower.includes("order") &&
      (messageLower.includes("for me") || messageLower.includes("automatically"))
    ) {
      if (displayedProducts.length > 0) {
        const topProduct = displayedProducts[0];
        const merchant = getMerchantById(topProduct.merchant_id);
        
        // Simulate autonomous order
        const orderId = `ORD${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const deliveryETA = `${topProduct.delivery_days}-${topProduct.delivery_days + 2} days`;
        
        setOrderDetails({
          orderId,
          merchant: merchant?.name || "Merchant",
          deliveryETA,
        });

        return {
          id: Date.now().toString(),
          role: "agent",
          content: `Perfect! I've completed the order for you:\n\n✅ Product: ${topProduct.name}\n💰 Price: ₹${topProduct.price.toLocaleString()}\n🏪 Merchant: ${merchant?.name}\n📦 Order ID: ${orderId}\n🚚 Delivery: ${deliveryETA}\n\nYour order has been confirmed and is being processed. You'll receive tracking details soon!`,
          timestamp: new Date(),
          action: "order_confirmation",
        };
      }
      return {
        id: Date.now().toString(),
        role: "agent",
        content: "I don't see any products selected yet. Please ask me to search for products first, and I'll help you order the best option!",
        timestamp: new Date(),
      };
    }

    // Check for post-purchase queries
    if (messageLower.includes("return") || messageLower.includes("refund")) {
      return {
        id: Date.now().toString(),
        role: "agent",
        content: "I've initiated a return request for you. Here's what happens next:\n\n1. ✅ Return ticket created (#RET" + Math.random().toString(36).substr(2, 6).toUpperCase() + ")\n2. 📞 Merchant will contact you within 2 hours\n3. 📦 Pickup scheduled for tomorrow 10 AM - 6 PM\n4. 💰 Refund processed within 5-7 business days\n\nIs there anything specific about the product you'd like to mention?",
        timestamp: new Date(),
      };
    }

    if (messageLower.includes("where") && messageLower.includes("order")) {
      return {
        id: Date.now().toString(),
        role: "agent",
        content: orderDetails
          ? `Your order ${orderDetails.orderId} is on track!\n\n📍 Current Status: Out for Delivery\n🚚 Expected: Today by 8 PM\n📱 Track: You'll get SMS updates\n\nWould you like me to notify the merchant about any delivery preferences?`
          : "I don't see any recent orders. Would you like to search for products to order?",
        timestamp: new Date(),
      };
    }

    // Check for filter keywords
    if (messageLower.includes("verified") || messageLower.includes("enamad")) {
      newFilters.eNAMADOnly = true;
      shouldSearch = true;
    }
    if (messageLower.includes("cheap") || messageLower.includes("lowest price")) {
      newFilters.cheapestFirst = true;
      shouldSearch = true;
    }
    if (messageLower.includes("fast") && messageLower.includes("delivery")) {
      newFilters.fastestFirst = true;
      shouldSearch = true;
    }

    // Extract price constraint
    const priceMatch = messageLower.match(/under\s+(?:₹|rs\.?\s*)?(\d+)/);
    if (priceMatch) {
      newFilters.maxPrice = parseInt(priceMatch[1]);
      shouldSearch = true;
    }

    // Search for products
    const searchTerms = [
      "headphone",
      "shoe",
      "laptop",
      "phone",
      "smartphone",
    ];
    const foundTerm = searchTerms.find((term) => messageLower.includes(term));

    if (foundTerm || shouldSearch) {
      setFilters(newFilters);
      const results = searchProducts(foundTerm || messageLower, newFilters);
      setDisplayedProducts(results);

      let filterDescription = "";
      if (newFilters.eNAMADOnly) filterDescription += " from verified merchants";
      if (newFilters.cheapestFirst) filterDescription += " sorted by lowest price";
      if (newFilters.fastestFirst) filterDescription += " with fastest delivery";
      if (newFilters.maxPrice) filterDescription += ` under ₹${newFilters.maxPrice.toLocaleString()}`;

      responseText = `I found ${results.length} great options for you${filterDescription}! I've ranked them based on:\n\n✓ Merchant reliability (SLA score)\n✓ Delivery speed\n✓ Customer ratings\n✓ Value for money\n\nThe top recommendation has the best overall score. Would you like me to:\n• Compare specific products\n• Apply additional filters\n• Complete the purchase for you`;

      return {
        id: Date.now().toString(),
        role: "agent",
        content: responseText,
        timestamp: new Date(),
        products: results,
        action: "show_products",
      };
    }

    // Default response
    return {
      id: Date.now().toString(),
      role: "agent",
      content: "I can help you find the perfect product! Tell me:\n\n• What are you looking for?\n• What's your budget?\n• Any specific requirements? (fast delivery, verified sellers, etc.)\n\nI'll search across multiple merchants and find the best options for you!",
      timestamp: new Date(),
    };
  };

  const handleSendMessage = (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate processing
    setIsProcessing(true);
    setTimeout(() => {
      const agentResponse = simulateAgentResponse(message);
      setMessages((prev) => [...prev, agentResponse]);
      setIsProcessing(false);
    }, 1000);
  };

  const handleBuyProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutComplete = () => {
    setIsCheckoutOpen(false);
    setShowSuccess(true);

    // Generate order details
    if (selectedProduct) {
      const merchant = getMerchantById(selectedProduct.merchant_id);
      const orderId = `ORD${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const deliveryETA = `${selectedProduct.delivery_days}-${selectedProduct.delivery_days + 2} days`;
      
      setOrderDetails({
        orderId,
        merchant: merchant?.name || "Merchant",
        deliveryETA,
      });

      // Add agent confirmation message
      const confirmationMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "agent",
        content: `🎉 Order confirmed!\n\n✅ ${selectedProduct.name}\n💰 ₹${selectedProduct.price.toLocaleString()}\n📦 Order ID: ${orderId}\n🚚 Delivery: ${deliveryETA}\n\nI'm tracking your order. Feel free to ask me anytime about the status!`,
        timestamp: new Date(),
        action: "order_confirmation",
      };
      setMessages((prev) => [...prev, confirmationMessage]);
    }
  };

  const handleRemoveFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);

    // Re-search with updated filters
    if (displayedProducts.length > 0) {
      const results = searchProducts("", newFilters);
      setDisplayedProducts(results);
    }
  };

  const handleClearAllFilters = () => {
    setFilters({});
    if (displayedProducts.length > 0) {
      const results = searchProducts("");
      setDisplayedProducts(results);
    }
  };

  const selectedMerchant = selectedProduct
    ? getMerchantById(selectedProduct.merchant_id)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Agentic Checkout
                </h1>
                <p className="text-sm text-muted-foreground">
                  AI-powered shopping assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold">Flowcart</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
          {/* Chat Interface */}
          <div className="h-full">
            <AgenticChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
            />
          </div>

          {/* Products Display */}
          <div className="h-full overflow-y-auto space-y-4">
            {displayedProducts.length > 0 && (
              <>
                {/* Filters */}
                <FilterChips
                  filters={filters}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAll={handleClearAllFilters}
                />

                {/* Results Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    {displayedProducts.length} Results
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Ranked by relevance
                  </p>
                </div>

                {/* Product Grid */}
                <div className="grid gap-4">
                  {displayedProducts.map((product) => {
                    const merchant = getMerchantById(product.merchant_id);
                    if (!merchant) return null;
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        merchant={merchant}
                        onBuy={() => handleBuyProduct(product)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedProduct && selectedMerchant && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          total={selectedProduct.price}
          onSuccess={handleCheckoutComplete}
          modeConfig={{
            tagline: "Fast & secure checkout",
            header: selectedMerchant.customHeader || {
              title: `Thank you for shopping with ${selectedMerchant.name}`,
              subtitle: "Complete your order in seconds",
            },
          }}
          cartItems={[
            {
              id: parseInt(selectedProduct.id.replace(/\D/g, '')) || 1,
              name: selectedProduct.name,
              price: selectedProduct.price,
              quantity: 1,
              image: selectedProduct.image,
              inStock: true,
            },
          ]}
        />
      )}

      {/* Success Screen */}
      {showSuccess && (
        <SuccessScreen 
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)} 
          orderId={orderDetails?.orderId || "ORD123456"}
        />
      )}
    </div>
  );
}
