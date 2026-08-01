import { ComponentType, ReactNode, createContext, useContext } from "react";
import { PgCartItem, PgProduct } from "./data/mockStore";

/* ---------- Slot contracts ----------
   An experiment can replace one of these slots inside the real flow,
   so a new component is tested in context instead of in a blank canvas. */

export interface PgProductCardProps {
  product: PgProduct;
  index: number;
  isInCart: boolean;
  isSaved: boolean;
  onAddToCart: (p: PgProduct) => void;
  onSave: (p: PgProduct) => void;
  onDetails: (p: PgProduct) => void;
}

export interface PgCartRowProps {
  item: PgCartItem;
  onRemove: (id: string) => void;
  onQuantity: (id: string, q: number) => void;
}

export type PgSlotName = "productCard" | "cartRow" | "standalone";

export interface PgSlots {
  productCard?: ComponentType<PgProductCardProps>;
  cartRow?: ComponentType<PgCartRowProps>;
}

const SlotsContext = createContext<PgSlots>({});

export const PgSlotsProvider = ({
  slots,
  children,
}: {
  slots: PgSlots;
  children: ReactNode;
}) => <SlotsContext.Provider value={slots}>{children}</SlotsContext.Provider>;

export const usePgSlots = () => useContext(SlotsContext);
