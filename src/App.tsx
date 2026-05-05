import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import GPTCommerce from "./pages/GPTCommerce";
import MobileGPTCommerce from "./pages/MobileGPTCommerce";
import DocsAIPage from "./pages/docs/ai/DocsAIPage";
import IndexFarsi from "./pages/IndexFarsi";
import NotFound from "./pages/NotFound";
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

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HomepageSettingsProvider>
  </QueryClientProvider>
);

export default App;
