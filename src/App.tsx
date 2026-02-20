import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import GPTCommerce from "./pages/GPTCommerce";
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
            {/* Root: simple picker landing */}
            <Route path="/" element={<LandingPicker />} />

            {/* Product 1: Farsi Checkout */}
            <Route path="/farsi" element={<FarsiLayout><IndexFarsi /></FarsiLayout>} />

            {/* Product 2: GPT Commerce */}
            <Route path="/gptcommerce" element={<GPTCommerce />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HomepageSettingsProvider>
  </QueryClientProvider>
);

const LandingPicker = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-8">
    <div className="text-center space-y-2">
      <h1 className="text-4xl font-bold text-foreground">Flowcart</h1>
      <p className="text-muted-foreground">Choose a product to explore</p>
    </div>
    <div className="flex flex-col sm:flex-row gap-4">
      <a
        href="/farsi"
        className="flex flex-col items-center gap-3 px-10 py-8 rounded-2xl border border-border bg-card hover:bg-accent transition-colors text-center min-w-[200px]"
      >
        <span className="text-3xl">🛒</span>
        <div>
          <div className="font-bold text-lg text-foreground">فلوکارت</div>
          <div className="text-sm text-muted-foreground">Persian Checkout</div>
        </div>
      </a>
      <a
        href="/gptcommerce"
        className="flex flex-col items-center gap-3 px-10 py-8 rounded-2xl border border-border bg-card hover:bg-accent transition-colors text-center min-w-[200px]"
      >
        <span className="text-3xl">🤖</span>
        <div>
          <div className="font-bold text-lg text-foreground">GPT Commerce</div>
          <div className="text-sm text-muted-foreground">AI Shopping Assistant</div>
        </div>
      </a>
    </div>
  </div>
);

export default App;
