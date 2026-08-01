import { ComponentType } from "react";
import { PgCartRowProps, PgProductCardProps, PgSlotName } from "./slots";
import { ExampleTallProductCard } from "./experiments/example-product-card";
import { ExampleCompactCartRow } from "./experiments/example-cart-row";

export type PgExperimentStatus = "draft" | "review" | "shipped";

export interface PgExperiment {
  id: string;
  title: string;
  description: string;
  status: PgExperimentStatus;
  slot: PgSlotName;
  /** Component matching the slot contract. */
  component: ComponentType<PgProductCardProps> | ComponentType<PgCartRowProps> | ComponentType;
}

/** The only file to edit when adding an experiment. */
export const PG_EXPERIMENTS: PgExperiment[] = [
  {
    id: "tall-product-card",
    title: "کارت محصول بلند",
    description: "کارت محصول با تصویر بزرگ‌تر و نوار اکشن چسبیده به پایین",
    status: "draft",
    slot: "productCard",
    component: ExampleTallProductCard,
  },
  {
    id: "compact-cart-row",
    title: "ردیف سبد فشرده",
    description: "ردیف سبد خرید در ارتفاع کمتر با کنترل تعداد درجا",
    status: "review",
    slot: "cartRow",
    component: ExampleCompactCartRow,
  },
];
