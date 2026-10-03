import { ShoppingCart, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartPanelHeaderProps {
  count: string;
  onClose: () => void;
}

export function CartPanelHeader({ count, onClose }: CartPanelHeaderProps) {
  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
          <ShoppingCart className="h-5 w-5" strokeWidth={1.7} />
        </span>
        <h2 className="text-base font-semibold text-foreground">سبد خرید</h2>
        <span className="text-xs tabular-nums text-muted-foreground"><bdi>{count}</bdi> کالا</span>
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="بستن سبد خرید" title="بستن سبد خرید" className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground">
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </header>
  );
}