import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Persian normalization (mirrors DB function) ──
function normalizePersian(text: string): string {
  return text
    .replace(/\u200C/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u0640/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Mode-specific system prompts ──
const PROMPTS: Record<string, string> = {
  discovery: `تو دستیار خرید هوشمند فلوکارت هستی. یک فروشگاه آنلاین فارسی‌زبان.

وظایف تو:
- کمک به کاربران برای پیدا کردن محصولات مورد نظرشون
- پاسخ‌دهی به سوالات درباره محصولات
- پیشنهاد محصولات بر اساس نیاز کاربر

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
- مهم: هرگز price_min یا price_max رو حدس نزن. فقط وقتی مقدار عددی مشخصی رو ست کن که کاربر عدد دقیق گفته باشه.

زیرمجموعه‌های موجود در فروشگاه:
- هدفون، هدست و هندزفری
- دوربین دیجیتال
- ساعت و مچ‌بند هوشمند
- هارد اکسترنال
- لوازم جانبی گوشی موبایل
- گوشی موبایل
- لپ تاپ
- کیبورد و ماوس
- تبلت

اگه کاربر سوال عمومی پرسید (مثل سلام)، جواب بده و بگو چطور می‌تونی کمکش کنی. از ابزار استفاده نکن.`,

  comparison: `تو متخصص مقایسه محصولات در فلوکارت هستی.

وظیفه تو: مقایسه دقیق و ساختارمند محصولات بر اساس مشخصات فنی‌شون.

قوانین:
- فارسی صحبت کن
- بدون مارک‌داون بنویس - متن ساده
- روی تفاوت‌های کلیدی تمرکز کن
- مزایا و معایب هر کدوم رو بگو
- در نهایت پیشنهادت رو بده
- قیمت‌ها به تومان هستن`,

  info_retrieval: `تو دستیار اطلاعاتی فلوکارت هستی.

وظیفه تو: پاسخ دقیق و مختصر به سوالات کاربر درباره محصولات، سفارش‌ها، ارسال، و سیاست‌های فروشگاه.

سیاست‌های فروشگاه:
- ارسال رایگان برای سفارش‌های بالای ۵۰۰ هزار تومان
- ضمانت بازگشت ۷ روزه
- ارسال سریع ۱-۳ روز کاری
- پشتیبانی ۲۴/۷

قوانین:
- فارسی صحبت کن
- بدون مارک‌داون - متن ساده
- مختصر و دقیق باش`,

  conversational: `تو دستیار خرید دوستانه فلوکارت هستی.

قوانین:
- فارسی صحبت کن
- لحن صمیمی و گرم داشته باش
- بدون مارک‌داون - متن ساده
- اگه سلام کرد، خوش‌آمد بگو و بپرس چطور می‌تونی کمکش کنی
- اگه تشکر کرد، خواهش کن و بگو اگه کمکی نیاز داشت در خدمتشی
- اگه سوالی درباره قابلیت‌هات داشت، توضیح بده می‌تونی محصول جستجو کنی، مقایسه کنی، و کمک به خرید کنی`,
};

// ── Tool definitions ──
const SEARCH_TOOL = {
  type: "function",
  function: {
    name: "search_products",
    description: "Search product catalog. Extract structured intent from user query.",
    parameters: {
      type: "object",
      properties: {
        query_text: {
          type: "string",
          description: "Cleaned search keywords (max 2-3 core Persian words)",
        },
        subcategory: {
          type: "string",
          description: "Exact subcategory filter",
        },
        filters: {
          type: "object",
          properties: {
            price_min: { type: "number" },
            price_max: { type: "number" },
            brand: { type: "string" },
            features: { type: "array", items: { type: "string" } },
          },
        },
        semantic_tags: {
          type: "array",
          items: { type: "string" },
          description: "Abstract inferred intent: hard_to_lose, child_safe, budget, premium, etc.",
        },
        sort_by: {
          type: "string",
          enum: ["relevance", "price_low", "price_high", "rating"],
        },
      },
      required: ["query_text"],
      additionalProperties: false,
    },
  },
};

const DETAILS_TOOL = {
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
};

// Mode → tools mapping
const MODE_TOOLS: Record<string, any[]> = {
  discovery: [SEARCH_TOOL, DETAILS_TOOL],
  comparison: [], // data injected, no tools needed
  info_retrieval: [DETAILS_TOOL],
  conversational: [], // no tools
};

// ── Generate query embedding ──
async function generateQueryEmbedding(text: string): Promise<number[] | null> {
  try {
    // @ts-ignore
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
  const queryEmbedding = await generateQueryEmbedding(normalizePersian(originalQuery));

  const rpcParams: any = { p_query: normalizedQuery, p_in_stock: true };
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

    const { messages: userMessages, mode = "discovery", products_context } = await req.json();
    if (!userMessages || !Array.isArray(userMessages)) {
      return new Response(
        JSON.stringify({ error: "messages array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const effectiveMode = mode in PROMPTS ? mode : "discovery";
    console.log(`Agent mode: ${effectiveMode}`);

    // Build system prompt
    let systemPrompt = PROMPTS[effectiveMode];

    // For comparison mode, inject product data
    if (effectiveMode === "comparison" && products_context) {
      const productsList = products_context.map((p: any, i: number) =>
        `محصول ${i + 1}: ${p.name}\n- قیمت: ${p.price?.toLocaleString()} تومان\n- برند: ${p.brand || "نامشخص"}\n- امتیاز: ${p.rating}\n- مشخصات: ${JSON.stringify(p.specs || {})}`
      ).join("\n\n");
      systemPrompt += `\n\nمحصولات برای مقایسه:\n${productsList}`;
    }

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...userMessages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const tools = MODE_TOOLS[effectiveMode] || [];

    // ── Step 1: LLM call (with or without tools based on mode) ──
    console.log(`Step 1: ${effectiveMode} LLM call...`);
    const llmBody: any = {
      model: "google/gemini-3-flash-preview",
      messages: aiMessages,
    };
    if (tools.length > 0) {
      llmBody.tools = tools;
    }

    const intentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(llmBody),
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

    // ── No tool call = direct response (comparison, conversational, info_retrieval, or discovery without search) ──
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

    // ── Step 2: Execute tool calls (discovery/info_retrieval modes) ──
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
    const candidatesForRerank = allProducts.slice(0, 10);
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
که id ها همان شناسه‌های محصولات انتخابی تو هستن. ترتیب id ها باید با ترتیب معرفی محصولات در متنت یکی باشه.`
      : "";

    const followUpMessages = [
      ...aiMessages,
      choice.message,
      ...toolResults,
      ...(rerankerSystemAddendum ? [{ role: "system", content: rerankerSystemAddendum }] : []),
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
    let selectedProducts = allProducts.slice(0, 6);
    const selectedIdsMatch = finalContent.match(/SELECTED_IDS:\s*(\[.*?\])/);
    if (selectedIdsMatch) {
      try {
        const selectedIds: string[] = JSON.parse(selectedIdsMatch[1]);
        const idToProduct = new Map(allProducts.map((p: any) => [p.id, p]));
        const reordered = selectedIds.map((id: string) => idToProduct.get(id)).filter(Boolean);
        if (reordered.length > 0) selectedProducts = reordered;
        console.log(`Re-ranker selected ${reordered.length} products`);
      } catch (e) {
        console.error("Failed to parse SELECTED_IDS:", e);
      }
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
