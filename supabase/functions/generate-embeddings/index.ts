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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get products without embeddings
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, description, tags")
      .is("embedding", null)
      .limit(50); // Process in batches of 50

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

    // Process in sub-batches of 10 for the embedding API
    for (let i = 0; i < products.length; i += 10) {
      const batch = products.slice(i, i + 10);
      const inputs = batch.map((p: any) => {
        const parts = [p.name || ""];
        if (p.description) parts.push(p.description);
        if (p.tags?.length) parts.push(p.tags.join(" "));
        return parts.join(" ").substring(0, 2000); // Limit input length
      });

      try {
        const embResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/text-embedding-004",
            input: inputs,
          }),
        });

        if (!embResponse.ok) {
          const errText = await embResponse.text();
          console.error(`Embedding API error: ${embResponse.status}`, errText);
          errors += batch.length;
          continue;
        }

        const embData = await embResponse.json();

        // Store each embedding
        for (let j = 0; j < batch.length; j++) {
          const embedding = embData.data?.[j]?.embedding;
          if (!embedding) {
            errors++;
            continue;
          }

          const { error: updateError } = await supabase
            .from("products")
            .update({ embedding: JSON.stringify(embedding) })
            .eq("id", batch[j].id);

          if (updateError) {
            console.error(`Update error for ${batch[j].id}:`, updateError);
            errors++;
          } else {
            processed++;
          }
        }
      } catch (e) {
        console.error("Batch error:", e);
        errors += batch.length;
      }

      // Small delay between batches to avoid rate limits
      if (i + 10 < products.length) {
        await new Promise((r) => setTimeout(r, 500));
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
