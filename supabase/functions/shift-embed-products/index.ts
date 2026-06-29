import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { store_slug } = await req.json().catch(() => ({}));
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // @ts-ignore - Supabase AI is available in edge runtime
    const session = new Supabase.ai.Session("gte-small");

    let query = supabase.from("shift_products")
      .select("id, name_fa, description_fa, brand, category, subcategory, species, tags, store_id, shift_stores!inner(slug)")
      .is("embedding", null)
      .limit(10);

    if (store_slug) {
      query = query.eq("shift_stores.slug", store_slug);
    }

    const { data: products, error } = await query;
    if (error) throw error;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ message: "All products embedded", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let processed = 0, errors = 0;
    for (const p of products as any[]) {
      try {
        const text = [
          p.name_fa, p.description_fa, p.brand, p.category,
          p.subcategory, p.species, ...(p.tags || []),
        ].filter(Boolean).join(" ").slice(0, 1000);
        // @ts-ignore
        const emb = await session.run(text, { mean_pool: true, normalize: true });
        const arr = Array.from(emb as any);
        const { error: uErr } = await supabase.from("shift_products")
          .update({ embedding: JSON.stringify(arr) }).eq("id", p.id);
        if (uErr) { errors++; console.error(uErr); }
        else processed++;
      } catch (e) {
        errors++; console.error(e);
      }
    }

    return new Response(JSON.stringify({ processed, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
