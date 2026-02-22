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

    // @ts-ignore - Supabase AI is available in edge runtime
    const session = new Supabase.ai.Session("gte-small");

    // Get products without embeddings
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, description, tags")
      .is("embedding", null)
      .limit(5); // Very small batch to avoid compute limits

    if (error) throw error;
    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ message: "All products already have embeddings", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${products.length} products...`);
    let processed = 0;
    let errors = 0;

    for (const product of products) {
      try {
        const text = [
          product.name || "",
          product.description || "",
          ...(product.tags || []),
        ].join(" ").substring(0, 1000);

        // @ts-ignore
        const embedding = await session.run(text, { mean_pool: true, normalize: true });

        // Convert Float32Array/TypedArray to regular array
        const embeddingArray = Array.from(embedding);

        const { error: updateError } = await supabase
          .from("products")
          .update({ embedding: JSON.stringify(embeddingArray) })
          .eq("id", product.id);

        if (updateError) {
          console.error(`Update error for ${product.id}:`, updateError);
          errors++;
        } else {
          processed++;
        }
      } catch (e) {
        console.error(`Embedding error for ${product.id}:`, e);
        errors++;
      }
    }

    const remaining = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .is("embedding", null);

    return new Response(
      JSON.stringify({
        processed,
        errors,
        remaining: remaining.count || 0,
        message: `Processed ${processed} products. ${remaining.count || 0} remaining.`,
      }),
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
