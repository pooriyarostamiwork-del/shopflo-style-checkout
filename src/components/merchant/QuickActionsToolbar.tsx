import { Plus, Gift, Eye, ShoppingCart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const QuickActionsToolbar = () => {
  const actions = [
    { icon: Plus, label: 'Create Offer', variant: 'default' as const },
    { icon: Gift, label: 'Add Upsell', variant: 'outline' as const },
    { icon: Eye, label: 'Preview Checkout', variant: 'outline' as const },
    { icon: ShoppingCart, label: 'Abandoned Carts', variant: 'outline' as const },
    { icon: Sparkles, label: 'Ask AI', variant: 'default' as const },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col gap-2 bg-background/95 backdrop-blur-sm p-3 rounded-xl border shadow-lg">
        {actions.map((action, idx) => (
          <Button
            key={idx}
            variant={action.variant}
            size="sm"
            className="justify-start gap-2 min-w-[160px]"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
