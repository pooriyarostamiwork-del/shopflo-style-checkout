import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Digikala category URLs to scrape
const DIGIKALA_CATEGORIES = [
  { url: "https://www.digikala.com/search/category-mobile-phone/", category: "الکترونیک", subcategory: "گوشی موبایل" },
  { url: "https://www.digikala.com/search/category-laptop/", category: "الکترونیک", subcategory: "لپ‌تاپ" },
  { url: "https://www.digikala.com/search/category-headphone/", category: "الکترونیک", subcategory: "هدفون" },
  { url: "https://www.digikala.com/search/category-smart-watch/", category: "الکترونیک", subcategory: "ساعت هوشمند" },
  { url: "https://www.digikala.com/search/category-tablet/", category: "الکترونیک", subcategory: "تبلت" },
  { url: "https://www.digikala.com/search/category-kitchen-appliance/", category: "خانه و آشپزخانه", subcategory: "لوازم آشپزخانه" },
  { url: "https://www.digikala.com/search/category-home-decoration/", category: "خانه و آشپزخانه", subcategory: "دکوراسیون" },
  { url: "https://www.digikala.com/search/category-cosmetic/", category: "زیبایی و بهداشت", subcategory: "آرایشی" },
  { url: "https://www.digikala.com/search/category-skin-care/", category: "زیبایی و بهداشت", subcategory: "مراقبت پوست" },
  { url: "https://www.digikala.com/search/category-perfume/", category: "زیبایی و بهداشت", subcategory: "عطر و ادکلن" },
  { url: "https://www.digikala.com/search/category-men-clothing/", category: "مد و پوشاک", subcategory: "لباس مردانه" },
  { url: "https://www.digikala.com/search/category-women-clothing/", category: "مد و پوشاک", subcategory: "لباس زنانه" },
  { url: "https://www.digikala.com/search/category-men-shoes/", category: "مد و پوشاک", subcategory: "کفش مردانه" },
  { url: "https://www.digikala.com/search/category-women-shoes/", category: "مد و پوشاک", subcategory: "کفش زنانه" },
  { url: "https://www.digikala.com/search/category-sport-equipment/", category: "ورزش و سلامت", subcategory: "تجهیزات ورزشی" },
  { url: "https://www.digikala.com/search/category-supplement/", category: "ورزش و سلامت", subcategory: "مکمل" },
  { url: "https://www.digikala.com/search/category-baby-feeding/", category: "کودک و نوزاد", subcategory: "تغذیه" },
  { url: "https://www.digikala.com/search/category-toy/", category: "کودک و نوزاد", subcategory: "اسباب‌بازی" },
  { url: "https://www.digikala.com/search/category-book/", category: "کتاب و لوازم‌تحریر", subcategory: "کتاب" },
  { url: "https://www.digikala.com/search/category-stationery/", category: "کتاب و لوازم‌تحریر", subcategory: "لوازم‌تحریر" },
  { url: "https://www.digikala.com/search/category-coffee/", category: "خوراکی و نوشیدنی", subcategory: "قهوه و چای" },
  { url: "https://www.digikala.com/search/category-snack/", category: "خوراکی و نوشیدنی", subcategory: "تنقلات" },
  { url: "https://www.digikala.com/search/category-gaming-accessories/", category: "گیمینگ", subcategory: "لوازم جانبی" },
  { url: "https://www.digikala.com/search/category-console/", category: "گیمینگ", subcategory: "کنسول بازی" },
  { url: "https://www.digikala.com/search/category-power-tool/", category: "ابزار و باغبانی", subcategory: "ابزار برقی" },
  { url: "https://www.digikala.com/search/category-garden/", category: "ابزار و باغبانی", subcategory: "باغبانی" },
];

const MERCHANTS = ["m1", "m2", "m3", "m4", "m5"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional params
    let batchSize = 5;
    let startIndex = 0;
    try {
      const body = await req.json();
      batchSize = body.batchSize || 5;
      startIndex = body.startIndex || 0;
    } catch { /* default values */ }

    const categoriesToScrape = DIGIKALA_CATEGORIES.slice(startIndex, startIndex + batchSize);
    
    const results: { category: string; productsInserted: number; error?: string }[] = [];

    for (const cat of categoriesToScrape) {
      try {
        console.log(`Scraping: ${cat.category} > ${cat.subcategory} from ${cat.url}`);

        // Use Firecrawl scrape with JSON extraction
        const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: cat.url,
            formats: ["extract"],
            extract: {
              schema: {
                type: "object",
                properties: {
                  products: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Product name in Persian/Farsi" },
                        price: { type: "number", description: "Current price in Toman (without comma separators)" },
                        original_price: { type: "number", description: "Original price before discount in Toman, null if no discount" },
                        image_url: { type: "string", description: "Product image URL" },
                        brand: { type: "string", description: "Brand name" },
                        rating: { type: "number", description: "Rating out of 5" },
                        review_count: { type: "number", description: "Number of reviews" },
                        in_stock: { type: "boolean", description: "Whether product is in stock" },
                        fast_delivery: { type: "boolean", description: "Whether fast/express delivery is available" },
                        source_url: { type: "string", description: "Link to product page" },
                      },
                      required: ["name", "price"],
                    },
                  },
                },
                required: ["products"],
              },
              prompt: "Extract all product listings from this Digikala category page. For each product, get the Persian name, price in Toman (as a number without separators), original price if discounted, image URL, brand, rating, review count, stock status, and delivery info. Return prices as numbers.",
            },
            waitFor: 3000,
          }),
        });

        const scrapeData = await scrapeResponse.json();

        if (!scrapeResponse.ok) {
          console.error(`Firecrawl error for ${cat.subcategory}:`, scrapeData);
          results.push({ category: `${cat.category}/${cat.subcategory}`, productsInserted: 0, error: scrapeData.error || "Scrape failed" });
          continue;
        }

        // Extract products from response
        const extractData = scrapeData.data?.extract || scrapeData.extract;
        const products = extractData?.products || [];

        if (products.length === 0) {
          console.log(`No products found for ${cat.subcategory}`);
          results.push({ category: `${cat.category}/${cat.subcategory}`, productsInserted: 0, error: "No products extracted" });
          continue;
        }

        // Map to database schema
        const dbProducts = products.map((p: any, idx: number) => ({
          name: p.name || "محصول بدون نام",
          description: p.description || "",
          price: typeof p.price === "number" ? Math.round(p.price) : 0,
          original_price: p.original_price && typeof p.original_price === "number" ? Math.round(p.original_price) : null,
          image_url: p.image_url || "",
          category: cat.category,
          subcategory: cat.subcategory,
          brand: p.brand || null,
          merchant_id: MERCHANTS[idx % MERCHANTS.length], // Distribute across merchants
          rating: p.rating && typeof p.rating === "number" ? Math.min(5, Math.max(1, p.rating)) : 4.0 + Math.random() * 0.9,
          review_count: p.review_count || Math.floor(Math.random() * 500) + 10,
          in_stock: p.in_stock !== false,
          fast_delivery: p.fast_delivery || Math.random() > 0.4,
          return_guarantee: Math.random() > 0.2,
          tags: [cat.category, cat.subcategory, p.brand].filter(Boolean),
          source_url: p.source_url || null,
        })).filter((p: any) => p.price > 0 && p.name !== "محصول بدون نام");

        // Insert into database
        if (dbProducts.length > 0) {
          const { error: insertError } = await supabase.from("products").insert(dbProducts);
          if (insertError) {
            console.error(`DB insert error for ${cat.subcategory}:`, insertError);
            results.push({ category: `${cat.category}/${cat.subcategory}`, productsInserted: 0, error: insertError.message });
          } else {
            console.log(`Inserted ${dbProducts.length} products for ${cat.subcategory}`);
            results.push({ category: `${cat.category}/${cat.subcategory}`, productsInserted: dbProducts.length });
          }
        }

        // Rate limit: wait between scrapes
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (catError) {
        console.error(`Error processing ${cat.subcategory}:`, catError);
        results.push({
          category: `${cat.category}/${cat.subcategory}`,
          productsInserted: 0,
          error: catError instanceof Error ? catError.message : "Unknown error",
        });
      }
    }

    const totalInserted = results.reduce((sum, r) => sum + r.productsInserted, 0);

    return new Response(
      JSON.stringify({
        success: true,
        totalInserted,
        batchProcessed: categoriesToScrape.length,
        totalCategories: DIGIKALA_CATEGORIES.length,
        nextStartIndex: startIndex + batchSize < DIGIKALA_CATEGORIES.length ? startIndex + batchSize : null,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scrape error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
