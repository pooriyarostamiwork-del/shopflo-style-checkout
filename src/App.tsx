import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import GPTCommerce from "./pages/GPTCommerce";
import MobileGPTCommerce from "./pages/MobileGPTCommerce";
import MobileVendorDashboard from "./pages/MobileVendorDashboard";
import DocsAIPage from "./pages/docs/ai/DocsAIPage";
import IndexFarsi from "./pages/IndexFarsi";
import NotFound from "./pages/NotFound";
import ShiftDesktop from "./pages/ShiftDesktop";
import ShiftMobile from "./pages/ShiftMobile";
import { FarsiLayout } from "./components/LanguageLayout";
import { HomepageSettingsProvider } from "./contexts/HomepageSettingsContext";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HomepageSettingsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            {/* Product 1: Farsi Checkout */}
            <Route path="/farsi" element={<FarsiLayout><IndexFarsi /></FarsiLayout>} />

            {/* Product 2: GPT Commerce */}
            <Route path="/gptcommerce" element={<GPTCommerce />} />
            <Route path="/gptcommerce/docs/ai" element={<DocsAIPage />} />
            <Route path="/m/gptcommerce" element={<MobileGPTCommerce />} />
            <Route path="/m/gptcommerce/dash/*" element={<MobileVendorDashboard />} />

            {/* Product 3: Shift — single-merchant AI storefront (DB-driven, multi-store) */}
            <Route path="/shift" element={<ShiftDesktop />} />
            <Route path="/shift/:slug" element={<ShiftDesktop />} />
            <Route path="/shift/m" element={<ShiftMobile />} />
            <Route path="/shift/m/:slug" element={<ShiftMobile />} />


            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HomepageSettingsProvider>
  </QueryClientProvider>
);

export default App;
