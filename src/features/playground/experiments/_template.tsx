import { PgProductCardProps } from "../slots";

/** Copy this file to start a new experiment, then register it in registry.ts.
 *  Pick the slot contract you want to replace: PgProductCardProps | PgCartRowProps. */
export const ExperimentTemplate = ({ product, onAddToCart }: PgProductCardProps) => (
  <div className="pg-card p-4" dir="rtl">
    <p className="text-sm font-medium">{product.name}</p>
    <button
      onClick={() => onAddToCart(product)}
      className="mt-3 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs"
    >
      افزودن به سبد
    </button>
  </div>
);
