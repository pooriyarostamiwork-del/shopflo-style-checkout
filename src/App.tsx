import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DemoIndex from "./pages/DemoIndex";
import CrossMarketplaceRetargeting from "./pages/CrossMarketplaceRetargeting";
import FloatingCartCrossStore from "./pages/FloatingCartCrossStore";
import SmartAbandonmentAI from "./pages/SmartAbandonmentAI";
import CrossStoreGamification from "./pages/CrossStoreGamification";
import CheckoutUpsellCarousel from "./pages/CheckoutUpsellCarousel";
import CheckoutCoupons from "./pages/CheckoutCoupons";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/demos" element={<DemoIndex />} />
          <Route path="/cross-marketplace-retargeting" element={<CrossMarketplaceRetargeting />} />
          <Route path="/floating-cart-cross-store" element={<FloatingCartCrossStore />} />
          <Route path="/smart-abandonment-ai" element={<SmartAbandonmentAI />} />
          <Route path="/cross-store-gamification-loyalty" element={<CrossStoreGamification />} />
          <Route path="/checkout-upsell-carousel" element={<CheckoutUpsellCarousel />} />
          <Route path="/checkout-coupons" element={<CheckoutCoupons />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
