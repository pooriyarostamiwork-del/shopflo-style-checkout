import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple CSV parser supporting quoted fields with commas and escaped quotes
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim().length > 0));
}

function toNumber(s: string | undefined): number {
  if (!s) return 0;
  const n = parseInt(s.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function toArray(s: string | undefined): string[] {
  if (!s) return [];
  return s.split(/[|;,]/).map((x) => x.trim()).filter(Boolean);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { store_slug, csv, replace } = await req.json();
    if (!store_slug || typeof csv !== "string") {
      return new Response(JSON.stringify({ error: "store_slug و csv الزامی است" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: store, error: storeErr } = await supabase
      .from("shift_stores").select("id, slug").eq("slug", store_slug).maybeSingle();
    if (storeErr || !store) {
      return new Response(JSON.stringify({ error: `فروشگاه ${store_slug} یافت نشد` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const rows = parseCSV(csv);
    if (rows.length < 2) {
      return new Response(JSON.stringify({ error: "فایل CSV خالی است" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const col = (name: string) => header.indexOf(name);

    if (replace) {
      await supabase.from("shift_products").delete().eq("store_id", store.id);
    }

    const records = rows.slice(1).map((r) => {
      const get = (n: string) => { const i = col(n); return i >= 0 ? (r[i] || "").trim() : ""; };
      const images = toArray(get("image_urls"));
      const primary = get("image_url") || images[0] || null;
      return {
        store_id: store.id,
        external_id: get("external_id") || get("sku") || null,
        name_fa: get("name") || get("name_fa") || get("title") || "بدون نام",
        description_fa: get("description") || get("description_fa") || null,
        price: toNumber(get("price")),
        original_price: get("original_price") ? toNumber(get("original_price")) : null,
        image_url: primary,
        image_urls: images.length ? images : (primary ? [primary] : []),
        category: get("category") || null,
        subcategory: get("subcategory") || null,
        species: get("species") || null,
        brand: get("brand") || null,
        tags: toArray(get("tags")),
        in_stock: (get("in_stock") || "true").toLowerCase() !== "false",
        stock_qty: toNumber(get("stock_qty") || get("stock")),
        rating: parseFloat(get("rating")) || 0,
        review_count: toNumber(get("review_count")),
        specs: {},
      };
    }).filter((r) => r.name_fa && r.name_fa !== "بدون نام");

    // Upsert in batches of 200
    let inserted = 0;
    const batchSize = 200;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error } = await supabase
        .from("shift_products")
        .upsert(batch, { onConflict: "store_id,external_id", ignoreDuplicates: false });
      if (error) {
        console.error("upsert error", error);
        return new Response(JSON.stringify({ error: error.message, inserted }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      inserted += batch.length;
    }

    return new Response(JSON.stringify({
      ok: true,
      store: store.slug,
      total_rows: rows.length - 1,
      inserted,
      replaced: !!replace,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
