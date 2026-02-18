import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `تو دستیار خرید هوشمند فلوکارت هستی. یک فروشگاه آنلاین فارسی‌زبان.

وظایف تو:
- کمک به کاربران برای پیدا کردن محصولات مورد نظرشون
- پاسخ‌دهی به سوالات درباره محصولات
- پیشنهاد محصولات بر اساس نیاز کاربر
- مقایسه محصولات مختلف

قوانین:
- همیشه فارسی صحبت کن
- لحن صمیمی و دوستانه داشته باش
- پاسخ‌ها رو بدون فرمت مارک‌داون بنویس. از ستاره، هشتگ، و علائم مارک‌داون استفاده نکن. متن ساده بنویس.
- وقتی کاربر دنبال محصولی می‌گرده، حتماً از ابزار search_products استفاده کن
- وقتی محصولاتی پیدا کردی، یک توضیح کوتاه و مفید درباره‌شون بده
- اگه کاربر سوال عمومی پرسید (مثل سلام)، جواب بده و بگو چطور می‌تونی کمکش کنی
- برای هر درخواست محصول، حداکثر ۶ محصول نشون بده
- قیمت‌ها به تومان هستن

مثال‌های نوع درخواست:
- "هدفون بی‌سیم می‌خوام" → search_products
- "یه هدیه برای مادرم" → search_products با کلمات کلیدی مرتبط
- "لپ‌تاپ زیر ۳۰ میلیون" → search_products با max_price
- "بهترین گوشی‌ها" → search_products
- "سلام" → پاسخ خوش‌آمدگویی بدون ابزار`;

// Tool definitions for the AI
const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search for products in the database. Use this whenever the user is looking for products, wants recommendations, or mentions any product category.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query in Persian/Farsi. Use keywords from the user's request.",
          },
          category: {
            type: "string",
            description: "Optional category filter. Options: الکترونیک, کالای دیجیتال",
          },
          subcategory: {
            type: "string",
            description: "Optional subcategory filter. Options: هدفون، هدست و هندزفری, دوربین دیجیتال, ساعت و مچ‌بند هوشمند, هارد اکسترنال, لوازم جانبی گوشی موبایل",
          },
          max_price: {
            type: "number",
            description: "Maximum price in Toman",
          },
          min_rating: {
            type: "number",
            description: "Minimum rating (1-5)",
          },
        },
        required: ["query"],
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
          product_id: {
            type: "string",
            description: "The UUID of the product",
          },
        },
        required: ["product_id"],
        additionalProperties: false,
      },
    },
  },
];

// Execute tool calls
async function executeTool(
  supabase: any,
  toolName: string,
  args: any
): Promise<any> {
  if (toolName === "search_products") {
    const { query, category, subcategory, max_price, min_rating } = args;
    
    // Split query into individual words for broader matching
    const queryWords = query.split(/\s+/).filter((w: string) => w.length > 1);

    // Try full-text search first (with category if provided)
    let dbQuery = supabase
      .from("products")
      .select("*")
      .eq("in_stock", true)
      .textSearch("search_vector", queryWords.join(" & "), {
        type: "plain",
        config: "simple",
      })
      .limit(6);

    if (category) dbQuery = dbQuery.eq("category", category);
    if (subcategory) dbQuery = dbQuery.eq("subcategory", subcategory);
    if (max_price) dbQuery = dbQuery.lte("price", max_price);
    if (min_rating) dbQuery = dbQuery.gte("rating", min_rating);

    let { data, error } = await dbQuery;

    // If category filter returned 0, retry without category
    if ((!data || data.length === 0) && category && !error) {
      console.log("Retrying without category filter");
      let retryQuery = supabase
        .from("products")
        .select("*")
        .eq("in_stock", true)
        .textSearch("search_vector", queryWords.join(" & "), { type: "plain", config: "simple" })
        .limit(6);
      if (max_price) retryQuery = retryQuery.lte("price", max_price);
      if (min_rating) retryQuery = retryQuery.gte("rating", min_rating);
      const retry = await retryQuery;
      data = retry.data;
      error = retry.error;
    }

    // Fallback to ilike if full-text returned nothing
    if (error || !data || data.length === 0) {
      if (error) console.error("Search error:", error);
      
      // Build OR conditions for each query word
      const orConditions = queryWords
        .map((w: string) => `name.ilike.%${w}%,description.ilike.%${w}%,tags.cs.{${w}}`)
        .join(",");
      
      let fallbackQuery = supabase
        .from("products")
        .select("*")
        .eq("in_stock", true)
        .or(orConditions)
        .limit(6);
      
      if (max_price) fallbackQuery = fallbackQuery.lte("price", max_price);
      if (min_rating) fallbackQuery = fallbackQuery.gte("rating", min_rating);

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      if (fallbackError) {
        console.error("Fallback search error:", fallbackError);
        return { products: [], message: "جستجو با مشکل مواجه شد" };
      }
      return { products: fallbackData || [] };
    }

    return { products: data };
  }

  if (toolName === "get_product_details") {
    const { product_id } = args;
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", product_id)
      .single();

    if (error) {
      return { error: "محصول پیدا نشد" };
    }
    return { product: data };
  }

  return { error: "Unknown tool" };
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

    // Build messages for AI
    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...userMessages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    // Call Lovable AI with tools
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "سرعت درخواست‌ها زیاد شده، لطفاً کمی صبر کنید." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "اعتبار سرویس هوش مصنوعی تمام شده." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "خطا در سرویس هوش مصنوعی" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0];

    if (!choice) {
      return new Response(
        JSON.stringify({ content: "متوجه نشدم. می‌تونی دوباره بگی؟", products: [], quickReplies: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if AI wants to call tools
    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolResults: any[] = [];
      let allProducts: any[] = [];

      for (const toolCall of choice.message.tool_calls) {
        const funcName = toolCall.function.name;
        let funcArgs;
        try {
          funcArgs = JSON.parse(toolCall.function.arguments);
        } catch {
          funcArgs = {};
        }

        console.log(`Executing tool: ${funcName}`, funcArgs);
        const result = await executeTool(supabase, funcName, funcArgs);
        
        if (result.products) {
          allProducts = [...allProducts, ...result.products];
        }
        
        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Second AI call with tool results to get final response
      const followUpMessages = [
        ...aiMessages,
        choice.message,
        ...toolResults,
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
        console.error("Follow-up AI error:", followUpResponse.status, errText);
        // Still return products even if follow-up fails
        return new Response(
          JSON.stringify({
            content: allProducts.length > 0 
              ? "این محصولات رو برات پیدا کردم:\n\nبرای اضافه کردن به سبد، بگو «محصول شماره X رو اضافه کن»" 
              : "متأسفانه محصولی با این مشخصات پیدا نکردم. می‌خوای یه جستجوی دیگه انجام بدم؟",
            products: allProducts.slice(0, 6),
            quickReplies: [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const followUpData = await followUpResponse.json();
      const finalContent = followUpData.choices?.[0]?.message?.content || "محصولات رو ببین:";

      return new Response(
        JSON.stringify({
          content: finalContent,
          products: allProducts.slice(0, 6),
          quickReplies: allProducts.length > 0
            ? [
                { id: "more", label: "🔍 نتایج بیشتر", type: "custom", action: "more_results" },
              ]
            : [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No tool call - just text response
    const textContent = choice.message?.content || "متوجه نشدم. می‌تونی دوباره بگی؟";

    return new Response(
      JSON.stringify({
        content: textContent,
        products: [],
        quickReplies: [],
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
