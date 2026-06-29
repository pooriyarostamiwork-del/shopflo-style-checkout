import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ShiftStoreRow {
  id: string;
  slug: string;
  name_fa: string;
  tagline_fa: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  theme_primary: string;
  theme_accent: string;
  currency: string;
  suggested_prompts: string[] | null;
  is_active: boolean;
}

interface ShiftStoreContextValue {
  store: ShiftStoreRow | null;
  isLoading: boolean;
  /** Get editable content value with fallback. Falls back when key missing or row inactive. */
  content: (key: string, fallback?: string) => string;
  /** Raw map of active content rows. */
  contentMap: Record<string, string>;
}

const ShiftStoreContext = createContext<ShiftStoreContextValue | null>(null);

const DEFAULT_SLUG = "shift";

export const ShiftStoreProvider = ({
  slug,
  children,
}: {
  slug?: string;
  children: ReactNode;
}) => {
  const resolvedSlug = slug && slug.trim().length > 0 ? slug : DEFAULT_SLUG;

  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["shift-store", resolvedSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_stores")
        .select("*")
        .eq("slug", resolvedSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as ShiftStoreRow) ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: contentRows } = useQuery({
    queryKey: ["shift-store-content", store?.id],
    enabled: !!store?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shift_store_content")
        .select("content_key, value, is_active")
        .eq("store_id", store!.id)
        .eq("is_active", true);
      if (error) throw error;
      return (data ?? []) as { content_key: string; value: string | null }[];
    },
    staleTime: 60 * 1000,
  });

  const contentMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const row of contentRows ?? []) {
      if (row.value != null && row.value.length > 0) m[row.content_key] = row.value;
    }
    return m;
  }, [contentRows]);

  const value = useMemo<ShiftStoreContextValue>(() => ({
    store: store ?? null,
    isLoading: storeLoading,
    contentMap,
    content: (key, fallback = "") => contentMap[key] ?? fallback,
  }), [store, storeLoading, contentMap]);

  // Inject theme CSS vars so all `hsl(var(--primary))` usages re-tint per store.
  const themeStyle = useMemo(() => {
    if (!store) return undefined;
    return {
      "--primary": store.theme_primary,
      "--primary-foreground": "0 0% 100%",
    } as React.CSSProperties;
  }, [store]);

  return (
    <ShiftStoreContext.Provider value={value}>
      <div style={themeStyle} className="contents">
        {children}
      </div>
    </ShiftStoreContext.Provider>
  );
};

export const useShiftStore = () => {
  const ctx = useContext(ShiftStoreContext);
  if (!ctx) throw new Error("useShiftStore must be used within ShiftStoreProvider");
  return ctx;
};
