import { Link } from "react-router-dom";
import { ArrowRight, Zap, ShoppingCart, Brain, Trophy, TrendingUp, Tag } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const demos = [
  {
    path: "/cross-marketplace-retargeting",
    icon: Zap,
    title: "Cross-Marketplace Retargeting",
    description: "Smart offers that follow users across stores with personalized incentives",
    color: "from-orange-500/20 to-red-500/20 border-orange-500/20",
  },
  {
    path: "/floating-cart-cross-store",
    icon: ShoppingCart,
    title: "Floating Cart Across Stores",
    description: "Cart that follows users everywhere with seamless checkout",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/20",
  },
  {
    path: "/smart-abandonment-ai",
    icon: Brain,
    title: "Smart Abandonment AI",
    description: "AI understands why users abandon and adjusts recommendations",
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/20",
  },
  {
    path: "/cross-store-gamification-loyalty",
    icon: Trophy,
    title: "Cross-Store Gamification",
    description: "Earn points and cashback that work across all stores",
    color: "from-amber-500/20 to-yellow-500/20 border-amber-500/20",
  },
  {
    path: "/checkout-upsell-carousel",
    icon: TrendingUp,
    title: "Checkout Upsell Carousel",
    description: "Increase AOV with smart product recommendations at checkout",
    color: "from-green-500/20 to-emerald-500/20 border-green-500/20",
  },
  {
    path: "/checkout-coupons",
    icon: Tag,
    title: "Advanced Multi-Type Coupons",
    description: "Real-time coupon evaluation with automatic savings optimization",
    color: "from-indigo-500/20 to-violet-500/20 border-indigo-500/20",
  },
];

const DemoIndex = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header cartItemCount={0} />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Next-Gen Checkout Experiences
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore different checkout capabilities that demonstrate the future of e-commerce conversion
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demos.map((demo) => {
              const Icon = demo.icon;
              return (
                <Link
                  key={demo.path}
                  to={demo.path}
                  className="group"
                >
                  <div className={`bg-gradient-to-br ${demo.color} border rounded-2xl p-6 h-full hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {demo.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm mb-4">
                      {demo.description}
                    </p>
                    
                    <div className="flex items-center text-primary font-semibold text-sm group-hover:gap-2 transition-all">
                      <span>View Demo</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link to="/">
              <Button variant="outline" size="lg">
                Back to Main Cart
              </Button>
            </Link>
          </div>

          <div className="mt-12 p-6 bg-muted/50 rounded-xl text-center">
            <p className="text-sm text-muted-foreground">
              Demo inspired by Shopflo — built for presentation purposes only
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DemoIndex;
