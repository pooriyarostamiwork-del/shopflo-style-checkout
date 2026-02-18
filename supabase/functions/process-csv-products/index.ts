import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Persian numeral converter
function parsePersianNumber(str: string | undefined | null): number {
  if (!str) return 0;
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(persianDigits[i], String(i));
  }
  result = result.replace(/,/g, "").replace(/٬/g, "").trim();
  const num = parseInt(result, 10);
  return isNaN(num) ? 0 : num;
}

function parsePersianFloat(str: string | undefined | null): number {
  if (!str) return 0;
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(persianDigits[i], String(i));
  }
  result = result.replace(/,/g, "").replace(/٬/g, "").replace(/٫/, ".").trim();
  const num = parseFloat(result);
  return isNaN(num) ? 0 : num;
}

// Extract image URLs from a cell that may contain newline-separated URLs
function extractImageUrls(cell: string | undefined | null): string[] {
  if (!cell) return [];
  return cell
    .split(/\n|\r\n?/)
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http"));
}

// Parse comment count like "۱۴ دیدگاه" or "۲۶۸۳ دیدگاه"
function parseCommentCount(str: string | undefined | null): number {
  if (!str) return 0;
  const match = str.match(/[۰-۹0-9,٬]+/);
  if (!match) return 0;
  return parsePersianNumber(match[0]);
}

// Simple CSV parser that handles quoted fields with newlines
function parseCSV(text: string): Record<string, string>[] {
  // Strip BOM
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xFEFF) cleanText = cleanText.slice(1);

  // Single-pass parser: split into rows and fields simultaneously
  const rows: Record<string, string>[] = [];
  const headers: string[] = [];
  let currentField = "";
  let fields: string[] = [];
  let inQuotes = false;
  let headersParsed = false;

  for (let i = 0; i <= cleanText.length; i++) {
    const ch = i < cleanText.length ? cleanText[i] : "\n"; // force flush at end

    if (ch === '"') {
      if (inQuotes && i + 1 < cleanText.length && cleanText[i + 1] === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(currentField);
      currentField = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && i + 1 < cleanText.length && cleanText[i + 1] === "\n") i++;
      fields.push(currentField);
      currentField = "";

      if (!headersParsed) {
        for (const f of fields) headers.push(f.trim().replace(/^\uFEFF/, ""));
        headersParsed = true;
        console.log("CSV headers:", JSON.stringify(headers));
      } else {
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = (fields[idx] || "").trim();
        });
        rows.push(row);
      }
      fields = [];
    } else {
      currentField += ch;
    }
  }

  return rows;
}

interface NormalizedProduct {
  name: string;
  price: number;
  original_price: number | null;
  rating: number;
  review_count: number;
  description: string;
  image_urls: string[];
  specs_raw: string;
  brand: string;
  source_url: string;
  category: string;
  subcategory: string;
}

// Normalize rows based on file type
function normalizeRow(row: Record<string, string>, fileType: string): NormalizedProduct | null {
  let name = "";
  let price = 0;
  let original_price: number | null = null;
  let rating = 0;
  let review_count = 0;
  let description = "";
  let image_urls: string[] = [];
  let specs_raw = "";
  let brand = "";
  let source_url = row["item_page_link"] || "";
  let category = "";
  let subcategory = "";

  switch (fileType) {
    case "headphones": {
      name = row["Product Title"] || row["title"] || "";
      price = parsePersianNumber(row["Price"]);
      rating = parsePersianFloat(row["RATE"]);
      review_count = parseCommentCount(row["COMMENT COUNT"]);
      description = row["Product_Description"] || "";
      image_urls = extractImageUrls(row["image_1"]);
      specs_raw = [row["Specs 1"], row["Specs 2"]].filter(Boolean).join(" ||| ");
      brand = row["Sub Category"] || "";
      category = "الکترونیک";
      subcategory = "هدفون، هدست و هندزفری";
      break;
    }
    case "cameras": {
      name = row["product title"] || row["title"] || "";
      price = parsePersianNumber(row["final price"]);
      original_price = parsePersianNumber(row["original price"]) || null;
      rating = parsePersianFloat(row["Rate"]);
      review_count = parseCommentCount(row["comment count"]);
      description = row["Product_Description"] || "";
      image_urls = [...extractImageUrls(row["image_1"]), ...extractImageUrls(row["image_3"])];
      specs_raw = row["Spec"] || "";
      category = "الکترونیک";
      subcategory = "دوربین دیجیتال";
      break;
    }
    case "wearables": {
      name = row["title_1"] || row["title"] || "";
      price = parsePersianNumber(row["final price"]);
      rating = parsePersianFloat(row["rate"]);
      review_count = parseCommentCount(row["Number_of_Comments"]);
      description = row["descriptiom"] || "";
      image_urls = [...extractImageUrls(row["image_3"]), ...extractImageUrls(row["image_7"])];
      specs_raw = [row["specs1"], row["specs 2"]].filter(Boolean).join(" ||| ");
      brand = row["bramd"] || "";
      category = "الکترونیک";
      subcategory = "ساعت و مچ‌بند هوشمند";
      break;
    }
    case "hdd": {
      name = row["product title"] || row["title"] || "";
      price = parsePersianNumber(row["final price"]);
      original_price = parsePersianNumber(row["original price"]) || null;
      rating = parsePersianFloat(row["rate"]);
      description = row["Product_Description"] || "";
      image_urls = [...extractImageUrls(row["image_1"]), ...extractImageUrls(row["image_3"])];
      specs_raw = [row["specs1"], row["specs 2"]].filter(Boolean).join(" ||| ");
      category = "الکترونیک";
      subcategory = "هارد اکسترنال";
      break;
    }
    case "mobile_acc": {
      name = row["product title"] || row["title"] || "";
      price = parsePersianNumber(row["final price"]);
      original_price = parsePersianNumber(row["org price"]) || null;
      rating = parsePersianFloat(row["rate"]);
      review_count = parseCommentCount(row["comment count"]);
      description = row["Product_Description"] || "";
      image_urls = [...extractImageUrls(row["image_1"]), ...extractImageUrls(row["image_3"])];
      specs_raw = [row["specs 1"], row["specs 2"]].filter(Boolean).join(" ||| ");
      brand = row["brand"] || "";
      category = "کالای دیجیتال";
      subcategory = row["sub cat"] || "لوازم جانبی گوشی موبایل";
      break;
    }
  }

  // Clean name
  name = name.replace(/\s+/g, " ").trim();

  // Filter invalid
  if (!name || name.length < 3) return null;
  if (price === 0) return null;
  if (image_urls.length === 0) return null;

  // Deduplicate images
  image_urls = [...new Set(image_urls)];

  return {
    name,
    price,
    original_price: original_price && original_price > price ? original_price : null,
    rating: rating > 0 && rating <= 5 ? rating : 4.0,
    review_count,
    description: description.replace(/\.\.\.$/, "").trim(),
    image_urls,
    specs_raw,
    brand,
    source_url,
    category,
    subcategory,
  };
}

// AI enrichment for a batch of products
async function enrichProducts(
  products: NormalizedProduct[],
  apiKey: string
): Promise<any[]> {
  // Build enrichment prompt
  const batch = products.map((p, i) => ({
    index: i,
    name: p.name,
    description: p.description.slice(0, 500),
    specs_raw: p.specs_raw.slice(0, 1000),
    rating: p.rating,
    review_count: p.review_count,
  }));

  const prompt = `You are a product data enrichment assistant for a Persian e-commerce store. 
For each product below, return a JSON array with objects containing:
- "index": the original index
- "description": A clean, concise Persian product description (2-3 sentences, max 200 chars). If the original is good, keep it. If empty or truncated, generate one based on the product name.
- "specs": An array of {"label": string, "value": string} objects parsed from the raw specs text. The raw text has labels and values concatenated without separators - you need to intelligently split them. Max 8 specs per product.
- "reviews_summary": A brief Persian sentence summarizing the product reception based on rating and review count (e.g., "با امتیاز ۴.۲ از ۵ و ۵۳ دیدگاه، محصول پرطرفداری است"). If no reviews, return empty string.
- "tags": Array of 3-5 Persian search keywords for this product.

IMPORTANT: Return ONLY a valid JSON array, no markdown, no explanation.

Products:
${JSON.stringify(batch, null, 0)}`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a data processing assistant. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI enrichment failed:", response.status);
      return products.map((p) => ({
        description: p.description || `${p.name} - محصولی با کیفیت از فروشگاه فلوکارت`,
        specs: [],
        reviews_summary: p.review_count > 0 ? `${p.review_count} دیدگاه` : "",
        tags: [],
      }));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Extract JSON from potential markdown code blocks
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    
    const enriched = JSON.parse(jsonStr.trim());
    return enriched;
  } catch (error) {
    console.error("AI enrichment error:", error);
    return products.map((p) => ({
      description: p.description || `${p.name}`,
      specs: [],
      reviews_summary: "",
      tags: [],
    }));
  }
}

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { csv_content, file_type, clear_existing } = await req.json();

    if (!csv_content || !file_type) {
      return new Response(JSON.stringify({ error: "csv_content and file_type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${file_type}, CSV length: ${csv_content.length}`);

    // Step 1: Parse CSV
    const rows = parseCSV(csv_content);
    console.log(`Parsed ${rows.length} rows`);

    // Debug: log first non-empty row
    const firstDataRow = rows.find(r => {
      const vals = Object.values(r).filter(v => v && v.trim());
      return vals.length > 3;
    });
    if (firstDataRow) {
      console.log("First data row keys:", Object.keys(firstDataRow).join(", "));
      console.log("First data row title:", firstDataRow["title"] || firstDataRow["Product Title"] || firstDataRow["product title"] || firstDataRow["title_1"] || "NOT FOUND");
      console.log("First data row price:", firstDataRow["Price"] || firstDataRow["final price"] || "NOT FOUND");
    }

    // Step 2: Normalize and filter
    const products: NormalizedProduct[] = [];
    for (const row of rows) {
      const normalized = normalizeRow(row, file_type);
      if (normalized) products.push(normalized);
    }
    console.log(`Normalized ${products.length} valid products`);

    if (products.length === 0) {
      return new Response(JSON.stringify({ error: "No valid products found", rows_parsed: rows.length }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Clear existing if requested
    if (clear_existing) {
      const { error: deleteError } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (deleteError) console.error("Delete error:", deleteError);
      else console.log("Cleared existing products");
    }

    // Step 4: Build inserts (skip AI enrichment to avoid timeout, enrich later)
    const merchants = ["m1", "m2", "m3", "m4", "m5"];
    const allInserts = products.map((p, idx) => ({
      name: p.name,
      price: p.price,
      original_price: p.original_price,
      rating: p.rating,
      review_count: p.review_count,
      description: p.description || "",
      image_url: p.image_urls[0],
      image_urls: p.image_urls,
      specs: [],
      reviews_summary: "",
      tags: [],
      brand: p.brand || null,
      category: p.category,
      subcategory: p.subcategory,
      source_url: p.source_url || null,
      merchant_id: merchants[idx % merchants.length],
      in_stock: true,
      fast_delivery: Math.random() > 0.5,
      return_guarantee: true,
    }));

    // Step 5: Insert in batches
    let inserted = 0;
    const INSERT_BATCH = 50;
    const errors: string[] = [];

    for (let i = 0; i < allInserts.length; i += INSERT_BATCH) {
      const batch = allInserts.slice(i, i + INSERT_BATCH);
      const { error } = await supabase.from("products").insert(batch);
      if (error) {
        console.error(`Insert error at batch ${i}:`, error);
        errors.push(error.message);
      } else {
        inserted += batch.length;
      }
    }

    console.log(`Inserted ${inserted}/${allInserts.length} products`);

    return new Response(
      JSON.stringify({
        success: true,
        file_type,
        rows_parsed: rows.length,
        products_found: products.length,
        products_inserted: inserted,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Processing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
