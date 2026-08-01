import { useMemo, useState } from "react";
import { PgSlotName, PgSlots } from "./slots";
import { PG_EXPERIMENTS } from "./registry";
import { PgProductCardProps, PgCartRowProps } from "./slots";

/** Tracks which experiment is active per slot and resolves the slot map. */
export const useActiveExperiments = () => {
  const [active, setActive] = useState<Partial<Record<PgSlotName, string | null>>>({});

  const onToggleExperiment = (slot: PgSlotName, id: string) =>
    setActive((a) => ({ ...a, [slot]: a[slot] === id ? null : id }));

  const slots = useMemo<PgSlots>(() => {
    const resolved: PgSlots = {};
    for (const exp of PG_EXPERIMENTS) {
      if (active[exp.slot] !== exp.id) continue;
      if (exp.slot === "productCard")
        resolved.productCard = exp.component as React.ComponentType<PgProductCardProps>;
      if (exp.slot === "cartRow")
        resolved.cartRow = exp.component as React.ComponentType<PgCartRowProps>;
    }
    return resolved;
  }, [active]);

  return { active, onToggleExperiment, slots };
};
