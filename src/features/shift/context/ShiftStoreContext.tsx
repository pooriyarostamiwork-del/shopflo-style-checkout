import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ShiftStore } from "../data/types";

interface Ctx {
  store: ShiftStore | null;
  loading: boolean;
  error: string | null;
}

const ShiftStoreContext = createContext<Ctx>({ store: null, loading: true, error: null });

export const useShiftStore = () => useContext(ShiftStoreContext);

interface Props {
  slug: string;
  children: ReactNode;
}

export const ShiftStoreProvider = ({ slug, children }: Props) => {
  const [store, setStore] = useState<ShiftStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    supabase
      .from("shift_stores")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) setError(error.message);
        else if (!data) setError(`فروشگاه «${slug}» یافت نشد`);
        else {
          setStore({
            ...(data as any),
            suggested_prompts: Array.isArray((data as any).suggested_prompts)
              ? ((data as any).suggested_prompts as string[])
              : [],
          });
        }
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <ShiftStoreContext.Provider value={{ store, loading, error }}>
      {store && (
        <style>{`
          .shift-theme-${slug} {
            --shift-primary: ${store.theme_primary};
            --shift-accent: ${store.theme_accent};
          }
        `}</style>
      )}
      {children}
    </ShiftStoreContext.Provider>
  );
};
