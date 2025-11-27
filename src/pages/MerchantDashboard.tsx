import { ShoppingBag, TrendingUp, DollarSign, Ticket, Target } from "lucide-react";
import { KPICard } from "@/components/merchant/KPICard";
import { LiveCheckoutPresence } from "@/components/merchant/LiveCheckoutPresence";
import { ConversionAstrology } from "@/components/merchant/ConversionAstrology";
import { CheckoutHeatPulse } from "@/components/merchant/CheckoutHeatPulse";
import { CommerceNetworkInsights } from "@/components/merchant/CommerceNetworkInsights";
import { FutureModuleCard } from "@/components/merchant/FutureModuleCard";
import { QuickActionsToolbar } from "@/components/merchant/QuickActionsToolbar";
import { AIAssistantBubble } from "@/components/merchant/AIAssistantBubble";
import {
  mockKPIData,
  liveCheckoutData,
  predictionData,
  heatPulseEvents,
  networkInsights,
  futureModules,
} from "@/data/merchantData";

const MerchantDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Flowcart Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Your intelligent commerce command center
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8 pb-32">
        {/* ZONE A - Top KPI Bar */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Today's Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard
              title="Today's Orders"
              value={mockKPIData.todaysOrders.value}
              change={mockKPIData.todaysOrders.change}
              trend="up"
              sparkline={mockKPIData.todaysOrders.sparkline}
              icon={<ShoppingBag className="h-4 w-4" />}
            />
            <KPICard
              title="Conversion Rate"
              value={`${mockKPIData.conversionRate.value}%`}
              change={mockKPIData.conversionRate.change}
              trend="up"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <KPICard
              title="Upsell Revenue"
              value={`₹${(mockKPIData.upsellRevenue.value / 1000).toFixed(1)}K`}
              change={mockKPIData.upsellRevenue.change}
              trend="up"
              subtitle={`${mockKPIData.upsellRevenue.percentage}% of total`}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <KPICard
              title="Coupon Usage"
              value={mockKPIData.couponUsage.redeemed}
              subtitle={`Top: ${mockKPIData.couponUsage.topCoupon}`}
              icon={<Ticket className="h-4 w-4" />}
            />
            <KPICard
              title="AOV"
              value={`₹${mockKPIData.aov.value}`}
              change={mockKPIData.aov.change}
              trend="up"
              subtitle={`vs ₹${mockKPIData.aov.benchmark} benchmark`}
              icon={<Target className="h-4 w-4" />}
            />
          </div>
        </section>

        {/* ZONE B - WOW Intelligence Modules */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Live Intelligence</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LiveCheckoutPresence {...liveCheckoutData} />
            <ConversionAstrology {...predictionData} />
            <CheckoutHeatPulse events={heatPulseEvents} />
            <CommerceNetworkInsights insights={networkInsights} />
          </div>
        </section>

        {/* ZONE C - Future Modules */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Tools & Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {futureModules.map((module) => (
              <FutureModuleCard key={module.id} {...module} />
            ))}
          </div>
        </section>
      </div>

      {/* Quick Actions & AI Assistant */}
      <QuickActionsToolbar />
      <AIAssistantBubble />
    </div>
  );
};

export default MerchantDashboard;
