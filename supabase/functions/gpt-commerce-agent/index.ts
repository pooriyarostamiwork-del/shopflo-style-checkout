import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Persian normalization (mirrors DB function) ──
function normalizePersian(text: string): string {
  return text
    .replace(/\u200C/g, " ")   // half-space → space
    .replace(/ي/g, "ی")        // Arabic yeh → Persian yeh
    .replace(/ك/g, "ک")        // Arabic kaf → Persian kaf
    .replace(/\u0640/g, "")     // remove tatweel
    .replace(/\s+/g, " ")
    .trim();
}

// ── System prompt: Intent extraction mode ──
const SYSTEM_PROMPT = `تو دستیار خرید هوشمند فلوکارت هستی. یک فروشگاه آنلاین فارسی‌زبان.

وظایف تو:
- کمک به کاربران برای پیدا کردن محصولات مورد نظرشون
- پاسخ‌دهی به سوالات درباره محصولات
- پیشنهاد محصولات بر اساس نیاز کاربر
- مقایسه محصولات مختلف

قوانین مهم:
- همیشه فارسی صحبت کن
- لحن صمیمی و دوستانه داشته باش
- پاسخ‌ها رو بدون فرمت مارک‌داون بنویس. از ستاره، هشتگ، و علائم مارک‌داون استفاده نکن. متن ساده بنویس.
- قیمت‌ها به تومان هستن

وقتی کاربر دنبال محصولی می‌گرده، حتماً از ابزار search_products استفاده کن.

نکات مهم برای استخراج نیت:
- query_text باید حداکثر ۲-۳ کلمه اصلی فارسی باشه (نه جمله کامل)
- نیازهای ضمنی کاربر رو به semantic_tags تبدیل کن
- مثال: "گم نشه" → semantic_tags: ["hard_to_lose"]
- مثال: "برای بچم" → semantic_tags: ["child_safe"]
- مثال: "برای ورزش" → semantic_tags: ["sport_use", "sweat_resistant"]

زیرمجموعه‌های موجود در فروشگاه:
- هدفون، هدست و هندزفری
- دوربین دیجیتال
- ساعت و مچ‌بند هوشمند
- هارد اکسترنال
- لوازم جانبی گوشی موبایل

اگه کاربر سوال عمومی پرسید (مثل سلام)، جواب بده و بگو چطور می‌تونی کمکش کنی. از ابزار استفاده نکن.`;

// ── Tool definition: structured intent extraction ──
const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search product catalog. Extract structured intent from user query. Do NOT generate keyword strings — extract structured filters and semantic tags.",
      parameters: {
        type: "object",
        properties: {
          query_text: {
            type: "string",
            description: "Cleaned search keywords for full-text search (max 2-3 core Persian words). Example: 'هدفون بی سیم' not 'یک هدفون بی سیم خوب برای ورزش'",
          },
          subcategory: {
            type: "string",
            description: "Exact subcategory filter. Must be one of: هدفون، هدست و هندزفری | دوربین دیجیتال | ساعت و مچ‌بند هوشمند | هارد اکسترنال | لوازم جانبی گوشی موبایل",
          },
          filters: {
            type: "object",
            properties: {
              price_min: { type: "number", description: "Minimum price in Toman" },
              price_max: { type: "number", description: "Maximum price in Toman" },
              brand: { type: "string", description: "Brand name filter" },
              features: {
                type: "array",
                items: { type: "string" },
                description: "Functional requirements: wireless, noise_canceling, waterproof, fast_delivery, etc.",
              },
            },
          },
          semantic_tags: {
            type: "array",
            items: { type: "string" },
            description: "Abstract inferred intent: hard_to_lose, child_safe, lightweight, gift, sport_use, budget, premium, durable",
          },
          sort_by: {
            type: "string",
            enum: ["relevance", "price_low", "price_high", "rating"],
            description: "Sort preference. Default: relevance",
          },
        },
        required: ["query_text"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_details",
      description: "Get full details of a specific product by its ID.",
      parameters: {
        type: "object",
        properties: {
          product_id: { type: "string", description: "The UUID of the product" },
        },
        required: ["product_id"],
        additionalProperties: false,
      },
    },
  },
];

// ── Generate query embedding using built-in gte-small ──
async function generateQueryEmbedding(text: string): Promise<number[] | null> {
  try {
    // @ts-ignore - Supabase AI is available in edge runtime
    const session = new Supabase.ai.Session("gte-small");
    // @ts-ignore
    const embedding = await session.run(text, { mean_pool: true, normalize: true });
    return Array.from(embedding);
  } catch (e) {
    console.error("Query embedding error:", e);
    return null;
  }
}

// ── Execute tool calls ──
async function executeSearch(supabase: any, args: any, originalQuery: string): Promise<any> {
  const { query_text, subcategory, filters, sort_by } = args;
  const normalizedQuery = normalizePersian(query_text);

  // Generate query embedding for semantic search
  const queryEmbedding = await generateQueryEmbedding(normalizePersian(originalQuery));

  // Call hybrid_product_search RPC
  const rpcParams: any = {
    p_query: normalizedQuery,
    p_in_stock: true,
  };
  if (queryEmbedding) rpcParams.p_embedding = JSON.stringify(queryEmbedding);
  if (subcategory) rpcParams.p_subcategory = subcategory;
  if (filters?.price_max) rpcParams.p_max_price = filters.price_max;
  if (filters?.price_min) rpcParams.p_min_price = filters.price_min;
  if (filters?.brand) rpcParams.p_brand = filters.brand;

  const { data, error } = await supabase.rpc("hybrid_product_search", rpcParams);

  if (error) {
    console.error("Hybrid search error:", error);
    return { products: [], message: "جستجو با مشکل مواجه شد" };
  }

  let results = data || [];

  // Post-sort if requested
  if (sort_by === "price_low") results.sort((a: any, b: any) => a.price - b.price);
  else if (sort_by === "price_high") results.sort((a: any, b: any) => b.price - a.price);
  else if (sort_by === "rating") results.sort((a: any, b: any) => b.rating - a.rating);

  return { products: results };
}

async function getProductDetails(supabase: any, productId: string): Promise<any> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();
  if (error) return { error: "محصول پیدا نشد" };
  return { product: data };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { messages: userMessages } = await req.json();
    if (!userMessages || !Array.isArray(userMessages)) {
      return new Response(
        JSON.stringify({ error: "messages array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...userMessages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    // ── Step 1: Intent Extraction (LLM call with tools) ──
    console.log("Step 1: Intent extraction...");
    const intentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        tools: TOOLS,
      }),
    });

    if (!intentResponse.ok) {
      const status = intentResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "سرعت درخواست‌ها زیاد شده، لطفاً کمی صبر کنید." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "اعتبار سرویس هوش مصنوعی تمام شده." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await intentResponse.text();
      console.error("AI gateway error:", status, errText);
      return new Response(
        JSON.stringify({ error: "خطا در سرویس هوش مصنوعی" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const intentData = await intentResponse.json();
    const choice = intentData.choices?.[0];

    if (!choice) {
      return new Response(
        JSON.stringify({ content: "متوجه نشدم. می‌تونی دوباره بگی؟", products: [], quickReplies: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── No tool call = conversational response ──
    if (!choice.message?.tool_calls || choice.message.tool_calls.length === 0) {
      return new Response(
        JSON.stringify({
          content: choice.message?.content || "متوجه نشدم. می‌تونی دوباره بگی؟",
          products: [],
          quickReplies: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: Hybrid Retrieval ──
    console.log("Step 2: Hybrid retrieval...");
    const originalQuery = userMessages[userMessages.length - 1]?.content || "";
    const toolResults: any[] = [];
    let allProducts: any[] = [];
    let extractedIntent: any = null;

    for (const toolCall of choice.message.tool_calls) {
      const funcName = toolCall.function.name;
      let funcArgs: any;
      try {
        funcArgs = JSON.parse(toolCall.function.arguments);
      } catch {
        funcArgs = {};
      }

      console.log(`Tool: ${funcName}`, JSON.stringify(funcArgs));

      let result: any;
      if (funcName === "search_products") {
        extractedIntent = funcArgs;
        result = await executeSearch(supabase, funcArgs, originalQuery);
        if (result.products) allProducts = [...allProducts, ...result.products];
      } else if (funcName === "get_product_details") {
        result = await getProductDetails(supabase, funcArgs.product_id);
      } else {
        result = { error: "Unknown tool" };
      }

      toolResults.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    // ── Step 3: LLM Re-Ranker + Response ──
    console.log("Step 3: Re-ranking + response generation...");

    // Build re-ranker prompt with top candidates
    const candidatesForRerank = allProducts.slice(0, 10);
    // originalQuery already defined above

    // Build candidate list with IDs for the re-ranker
    const candidateList = candidatesForRerank.map((p: any, i: number) => 
      `${i + 1}. [${p.id}] ${p.name} - ${p.price?.toLocaleString()} تومان`
    ).join("\n");

    const rerankerSystemAddendum = candidatesForRerank.length > 0
      ? `\n\nتو الان ${candidatesForRerank.length} محصول کاندیدا داری. با توجه به درخواست اصلی کاربر ("${originalQuery}")${extractedIntent?.semantic_tags?.length ? ` و تگ‌های معنایی استخراج‌شده (${extractedIntent.semantic_tags.join(", ")})` : ""}:
- محصولاتی که با نیت کاربر مطابقت ندارن رو حذف کن
- بهترین ۳ تا ۶ محصول رو انتخاب کن
- یه توضیح کوتاه و مفید بنویس
- از مارک‌داون استفاده نکن

لیست کاندیداها:
${candidateList}

مهم: در انتهای پاسخت، در یک خط جدید، دقیقاً بنویس:
SELECTED_IDS:["id1","id2","id3"]
که id ها همان شناسه‌های محصولات انتخابی تو هستن (UUID ها از لیست بالا). ترتیب id ها باید با ترتیب معرفی محصولات در متنت یکی باشه.`
      : "";

    const followUpMessages = [
      ...aiMessages,
      choice.message,
      ...toolResults,
      ...(rerankerSystemAddendum
        ? [{ role: "system", content: rerankerSystemAddendum }]
        : []),
    ];

    const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: followUpMessages,
      }),
    });

    if (!followUpResponse.ok) {
      const errText = await followUpResponse.text();
      console.error("Re-ranker error:", followUpResponse.status, errText);
      return new Response(
        JSON.stringify({
          content: allProducts.length > 0
            ? "این محصولات رو برات پیدا کردم:"
            : "متأسفانه محصولی پیدا نکردم. می‌خوای یه جستجوی دیگه انجام بدم؟",
          products: allProducts.slice(0, 6),
          quickReplies: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const followUpData = await followUpResponse.json();
    let finalContent = followUpData.choices?.[0]?.message?.content || "محصولات رو ببین:";

    // Parse SELECTED_IDS from re-ranker output
    let selectedProducts = allProducts.slice(0, 6); // fallback
    const selectedIdsMatch = finalContent.match(/SELECTED_IDS:\s*(\[.*?\])/);
    if (selectedIdsMatch) {
      try {
        const selectedIds: string[] = JSON.parse(selectedIdsMatch[1]);
        const idToProduct = new Map(allProducts.map((p: any) => [p.id, p]));
        const reordered = selectedIds
          .map((id: string) => idToProduct.get(id))
          .filter(Boolean);
        if (reordered.length > 0) selectedProducts = reordered;
        console.log(`Re-ranker selected ${reordered.length} products`);
      } catch (e) {
        console.error("Failed to parse SELECTED_IDS:", e);
      }
      // Strip the SELECTED_IDS line from content
      finalContent = finalContent.replace(/\n?SELECTED_IDS:\s*\[.*?\]/, "").trim();
    }

    return new Response(
      JSON.stringify({
        content: finalContent,
        products: selectedProducts,
        quickReplies: selectedProducts.length > 0
          ? [{ id: "more", label: "🔍 نتایج بیشتر", type: "custom", action: "more_results" }]
          : [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
