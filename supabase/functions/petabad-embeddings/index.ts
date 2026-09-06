import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let batch = 50;
    try {
      const body = await req.json();
      if (body?.batch) batch = Math.min(Math.max(Number(body.batch), 1), 200);
    } catch (_e) { /* no body */ }

    // @ts-ignore - Supabase AI is available in edge runtime
    const session = new Supabase.ai.Session("gte-small");

    const { data: products, error } = await supabase
      .from("pet_products")
      .select("id, name, short_description, description, category, subcategory, species, brand, tags")
      .is("embedding", null)
      .limit(batch);

    if (error) throw error;
    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ message: "All pet products already have embeddings", processed: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    let errors = 0;

    for (const p of products) {
      try {
        const text = [
          p.name || "",
          p.short_description || "",
          p.description || "",
          p.category || "",
          p.subcategory || "",
          p.species || "",
          p.brand || "",
          ...(p.tags || []),
        ].join(" ").substring(0, 1000);

        // @ts-ignore
        const embedding = await session.run(text, { mean_pool: true, normalize: true });

        const { error: updateError } = await supabase
          .from("pet_products")
          .update({ embedding: JSON.stringify(Array.from(embedding)) })
          .eq("id", p.id);

        if (updateError) {
          console.error(`Update error for ${p.id}:`, updateError);
          errors++;
        } else {
          processed++;
        }
      } catch (e) {
        console.error(`Embedding error for ${p.id}:`, e);
        errors++;
      }
    }

    const remaining = await supabase
      .from("pet_products")
      .select("id", { count: "exact", head: true })
      .is("embedding", null);

    return new Response(
      JSON.stringify({ processed, errors, remaining: remaining.count || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
