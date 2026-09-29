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
import ShiftDashLite from "./pages/ShiftDashLite";
import ShiftDashPro from "./pages/ShiftDashPro";
import Playground from "./pages/Playground";
import PlaygroundMobile from "./pages/PlaygroundMobile";
import PetAbad from "./pages/PetAbad";
import MobilePetAbad from "./pages/MobilePetAbad";
import PetabadFloating from "./pages/PetabadFloating";

import { FarsiLayout } from "./components/LanguageLayout";
import { ResponsiveRoute, LegacyRedirect } from "./components/ResponsiveRoute";
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

            {/* Product 2: GPT Commerce — one URL, shell picked by viewport */}
            <Route path="/gptcommerce" element={<ResponsiveRoute desktop={<GPTCommerce />} mobile={<MobileGPTCommerce />} />} />
            <Route path="/gptcommerce/docs/ai" element={<DocsAIPage />} />
            <Route path="/m/gptcommerce" element={<LegacyRedirect to="/gptcommerce" />} />
            <Route path="/m/gptcommerce/dash/*" element={<MobileVendorDashboard />} />

            {/* Product 3: Shift */}
            <Route path="/shift" element={<ResponsiveRoute desktop={<ShiftDesktop />} mobile={<ShiftMobile />} />} />
            <Route path="/shift/:slug" element={<ResponsiveRoute desktop={<ShiftDesktop />} mobile={<ShiftMobile />} />} />
            <Route path="/shift/m" element={<LegacyRedirect to="/shift" />} />
            <Route path="/shift/m/:slug" element={<LegacyRedirect to="/shift" />} />

            {/* Shift merchant dashboard (front-end only) */}
            <Route path="/shift/dash/lite" element={<ShiftDashLite />} />
            <Route path="/shift/dash/pro" element={<ShiftDashPro />} />

            {/* Product 4: PetAbad */}
            <Route path="/petabad" element={<ResponsiveRoute desktop={<PetAbad />} mobile={<MobilePetAbad />} />} />
            <Route path="/petabad/floating" element={<PetabadFloating />} />
            <Route path="/m/petabad" element={<LegacyRedirect to="/petabad" />} />

            {/* Component playground */}
            <Route path="/playground" element={<ResponsiveRoute desktop={<Playground />} mobile={<PlaygroundMobile />} />} />
            <Route path="/playground/m" element={<LegacyRedirect to="/playground" />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HomepageSettingsProvider>
  </QueryClientProvider>
);

export default App;
