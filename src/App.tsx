import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GPTCommerce from "./pages/GPTCommerce";
import Index from "./pages/Index";
import IndexFarsi from "./pages/IndexFarsi";
import AgenticCheckout from "./pages/AgenticCheckout";
import MerchantDashboard from "./pages/MerchantDashboard";
import UniversalVersion from "./pages/UniversalVersion";
import HomepagePanel from "./pages/HomepagePanel";
import NotFound from "./pages/NotFound";
import { FarsiLayout, EnglishLayout } from "./components/LanguageLayout";
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
            {/* English Routes */}
            <Route path="/" element={<EnglishLayout><Index /></EnglishLayout>} />
            <Route path="/agenticcheckout" element={<EnglishLayout><AgenticCheckout /></EnglishLayout>} />
            <Route path="/merchant" element={<EnglishLayout><MerchantDashboard /></EnglishLayout>} />
            
            {/* Universal Version with Language Toggle */}
            <Route path="/universalversion" element={<UniversalVersion />} />
            
            {/* Farsi (Persian) Routes - RTL */}
            <Route path="/farsi" element={<FarsiLayout><IndexFarsi /></FarsiLayout>} />
            <Route path="/farsi/agenticcheckout" element={<FarsiLayout><AgenticCheckout /></FarsiLayout>} />
            <Route path="/farsi/merchant" element={<FarsiLayout><MerchantDashboard /></FarsiLayout>} />
            
            {/* GPT Commerce - Conversational Shopping */}
            <Route path="/gptcommerce" element={<GPTCommerce />} />
            
            {/* Homepage Admin Panel */}
            <Route path="/homepagepanel" element={<HomepagePanel />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HomepageSettingsProvider>
  </QueryClientProvider>
);

export default App;
