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
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { batch_size = 15, offset = 0 } = await req.json().catch(() => ({}));

    // Get products that haven't been enriched yet (empty specs and tags)
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, description, subcategory, rating, review_count")
      .eq("specs", "[]")
      .order("created_at")
      .range(offset, offset + batch_size - 1);

    if (error) throw error;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ done: true, message: "No more products to enrich" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Enriching ${products.length} products (offset ${offset})`);

    const batch = products.map((p: any, i: number) => ({
      index: i,
      id: p.id,
      name: p.name,
      description: (p.description || "").slice(0, 300),
      subcategory: p.subcategory,
      rating: p.rating,
      review_count: p.review_count,
    }));

    const prompt = `You are a product data enrichment assistant for a Persian e-commerce store.
For each product below, return a JSON array with objects containing:
- "index": the original index
- "description": A clean, concise Persian product description (2-3 sentences, max 200 chars). If the original is good, keep it. If empty or truncated, generate one based on the product name and subcategory.
- "reviews_summary": A brief Persian sentence summarizing the product reception based on rating and review count (e.g., "با امتیاز ۴.۲ از ۵ و ۵۳ دیدگاه، محصول پرطرفداری است"). If no reviews, return empty string.
- "tags": Array of 3-5 Persian search keywords for this product.

IMPORTANT: Return ONLY a valid JSON array, no markdown, no explanation.

Products:
${JSON.stringify(batch, null, 0)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You are a data processing assistant. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI enrichment failed:", response.status);
      return new Response(JSON.stringify({ error: "AI call failed", status: response.status }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    const enriched = JSON.parse(jsonStr.trim());
    let updated = 0;

    for (const item of enriched) {
      const product = products[item.index];
      if (!product) continue;

      const { error: updateError } = await supabase
        .from("products")
        .update({
          description: item.description || product.description,
          reviews_summary: item.reviews_summary || "",
          tags: item.tags || [],
        })
        .eq("id", product.id);

      if (updateError) {
        console.error(`Update error for ${product.id}:`, updateError);
      } else {
        updated++;
      }
    }

    console.log(`Updated ${updated}/${products.length} products`);

    return new Response(
      JSON.stringify({
        enriched: updated,
        total_in_batch: products.length,
        has_more: products.length === batch_size,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Enrichment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
