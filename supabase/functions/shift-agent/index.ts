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

// ── No-greeting instruction ──
const NO_GREETING = `مهم: این یک مکالمه ادامه‌دار است. هرگز با سلام، خوش‌آمدگویی، یا معرفی خودت شروع نکن. مستقیم برو سر اصل مطلب.`;

// ── Fallback base prompts (used if DB has no chapters for the store) ──
const FALLBACK_PROMPTS: Record<string, string> = {
  discovery: `تو فروشنده و دستیار خرید این فروشگاه هستی. فروشگاه تک‌فروشنده — فقط محصولات همین فروشگاه. همیشه فارسی، بدون مارک‌داون، قیمت به تومان.`,
  comparison: `تو متخصص مقایسه محصولات همین فروشگاه هستی. فارسی، بدون مارک‌داون، ساختارمند.`,
  info_retrieval: `تو دستیار اطلاعاتی این فروشگاه هستی. فارسی، مختصر، بدون مارک‌داون.`,
  conversational: `تو دستیار خرید دوستانه این فروشگاه هستی. فارسی، صمیمی، بدون مارک‌داون.`,
  cart_manipulation: `تو دستیار مدیریت سبد خرید هستی. فارسی، بدون مارک‌داون.`,
};

// Mode-specific behavioral rules appended after the DB master prompt.
const MODE_RULES: Record<string, string> = {
  discovery: `\n\n# قوانین حالت جستجو
- وقتی کاربر دنبال محصولی می‌گرده، حتماً از ابزار search_products استفاده کن.
- query_text حداکثر ۲-۳ کلمه اصلی فارسی.
- نیت ضمنی رو به semantic_tags تبدیل کن.
- هرگز price_min/price_max رو حدس نزن؛ فقط با عدد صریح کاربر.
- بعد از جستجو، ۳ تا ۶ بهترین رو انتخاب کن و در انتها یک خط جدید بنویس:
SELECTED_IDS:["id1","id2","id3"]`,
  cart_manipulation: `\n\n# قوانین حالت سبد خرید
- product_index شماره ۱-based از لیست پیشنهادی؛ product_id UUID آیتم سبد.
- اگر مبهم بود needs_clarification=true و گزینه‌ها رو بده.
- پیام تأیید فارسی بنویس.`,
  comparison: ``,
  info_retrieval: ``,
  conversational: ``,
};

// ── Assemble master prompt from DB (volumes → chapters) ──
async function assembleStorePrompt(
  supabase: any,
  storeId: string,
): Promise<{ prompt: string; productsTable: string; searchRpc: string } | null> {
  const { data: store, error: storeErr } = await supabase
    .from("shift_stores")
    .select("id, name_fa, currency, vendor_prompt, category_id, master_prompt_id")
    .eq("id", storeId)
    .maybeSingle();
  if (storeErr || !store) {
    console.error("Store lookup failed:", storeErr);
    return null;
  }

  let masterPromptId: string | null = store.master_prompt_id ?? null;
  let productsTable = "shift_products";
  let searchRpc = "shift_hybrid_search";

  if (store.category_id) {
    const { data: cat } = await supabase
      .from("shift_categories")
      .select("id, slug, products_table_name")
      .eq("id", store.category_id)
      .maybeSingle();
    if (cat?.products_table_name) {
      productsTable = cat.products_table_name;
      searchRpc = cat.slug === "general" ? "shift_hybrid_search" : `shift_hybrid_search_${cat.slug}`;
    }
    if (!masterPromptId) {
      const { data: mp } = await supabase
        .from("shift_master_prompts")
        .select("id")
        .eq("category_id", store.category_id)
        .eq("is_default", true)
        .eq("is_active", true)
        .maybeSingle();
      if (mp) masterPromptId = mp.id;
    }
  }

  let assembled = "";
  if (masterPromptId) {
    const { data: volumes } = await supabase
      .from("shift_prompt_volumes")
      .select("id, title, order_index")
      .eq("master_prompt_id", masterPromptId)
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    for (const v of volumes ?? []) {
      const { data: chapters } = await supabase
        .from("shift_prompt_chapters")
        .select("title, body, order_index")
        .eq("volume_id", v.id)
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      if (!chapters?.length) continue;
      assembled += `\n\n# ${v.title}`;
      for (const ch of chapters) {
        assembled += `\n\n## ${ch.title}\n${ch.body}`;
      }
    }
  }

  if (store.vendor_prompt && store.vendor_prompt.trim().length > 0) {
    assembled += `\n\n# شخصی‌سازی فروشگاه\n${store.vendor_prompt.trim()}`;
  }

  assembled += `\n\n# اطلاعات فروشگاه\nنام: ${store.name_fa}\nواحد پول: ${store.currency}`;

  return { prompt: assembled.trim(), productsTable, searchRpc };
}


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

// ── Cart operations tool ──
const CART_OPERATIONS_TOOL = {
  type: "function",
  function: {
    name: "execute_cart_operations",
    description: "Execute one or more cart operations based on user request. Use product_index (1-based) to reference recommended products, product_id (UUID) to reference cart items.",
    parameters: {
      type: "object",
      properties: {
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["add", "remove", "update_quantity", "replace"],
              },
              product_index: {
                type: "number",
                description: "1-based index from recommended products list (for add operations)",
              },
              product_id: {
                type: "string",
                description: "UUID from cart items (for remove/update operations)",
              },
              remove_product_id: {
                type: "string",
                description: "UUID of cart item to remove (for replace operations)",
              },
              add_product_index: {
                type: "number",
                description: "1-based index of recommended product to add (for replace operations)",
              },
              quantity: {
                type: "number",
                description: "Quantity for add or update_quantity operations",
              },
            },
            required: ["type"],
          },
          description: "List of cart operations to execute",
        },
        message: {
          type: "string",
          description: "Persian confirmation message to show the user",
        },
        needs_clarification: {
          type: "boolean",
          description: "True if the request is ambiguous and needs user clarification",
        },
        clarification_options: {
          type: "array",
          items: { type: "string" },
          description: "Quick-reply options for disambiguation when needs_clarification is true",
        },
      },
      required: ["actions", "message", "needs_clarification"],
      additionalProperties: false,
    },
  },
};

// Mode → tools mapping
const MODE_TOOLS: Record<string, any[]> = {
  discovery: [SEARCH_TOOL, DETAILS_TOOL],
  comparison: [],
  info_retrieval: [DETAILS_TOOL],
  conversational: [],
  cart_manipulation: [CART_OPERATIONS_TOOL],
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
async function executeSearch(
  supabase: any,
  args: any,
  precomputedEmbedding: number[] | null,
  searchRpc: string,
  storeId: string,
): Promise<any> {
  const { query_text, subcategory, filters, sort_by } = args;
  const normalizedQuery = normalizePersian(query_text);

  const rpcParams: any = { p_query: normalizedQuery, p_in_stock: true, p_store_id: storeId };
  if (precomputedEmbedding) rpcParams.p_embedding = JSON.stringify(precomputedEmbedding);
  if (subcategory) rpcParams.p_subcategory = subcategory;
  if (filters?.price_max) rpcParams.p_max_price = filters.price_max;
  if (filters?.price_min) rpcParams.p_min_price = filters.price_min;

  const { data, error } = await supabase.rpc(searchRpc, rpcParams);
  if (error) {
    console.error(`Hybrid search error (${searchRpc}):`, error);
    return { products: [], message: "جستجو با مشکل مواجه شد" };
  }

  // Normalize to legacy `name` field for downstream code that expects it.
  let results = (data || []).map((r: any) => ({ ...r, name: r.name_fa ?? r.name, description: r.description_fa ?? r.description }));
  if (sort_by === "price_low") results.sort((a: any, b: any) => a.price - b.price);
  else if (sort_by === "price_high") results.sort((a: any, b: any) => b.price - a.price);
  else if (sort_by === "rating") results.sort((a: any, b: any) => b.rating - a.rating);

  return { products: results };
}

async function getProductDetails(supabase: any, productId: string, productsTable: string): Promise<any> {
  const { data, error } = await supabase
    .from(productsTable)
    .select("*")
    .eq("id", productId)
    .maybeSingle();
  if (error || !data) return { error: "محصول پیدا نشد" };
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

    const { messages: userMessages, mode = "discovery", products_context, cart_context, is_first_message = false, store_id, store_slug } = await req.json();
    if (!userMessages || !Array.isArray(userMessages)) {
      return new Response(
        JSON.stringify({ error: "messages array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const effectiveMode = mode in FALLBACK_PROMPTS ? mode : "discovery";
    console.log(`Agent mode: ${effectiveMode}, is_first_message: ${is_first_message}, store_id: ${store_id}, store_slug: ${store_slug}`);

    // Resolve store_id from slug if only slug provided
    let resolvedStoreId: string | null = store_id ?? null;
    if (!resolvedStoreId && store_slug) {
      const { data: s } = await supabase.from("shift_stores").select("id").eq("slug", store_slug).eq("is_active", true).maybeSingle();
      resolvedStoreId = s?.id ?? null;
    }
    if (!resolvedStoreId) {
      // Fall back to default shift store
      const { data: s } = await supabase.from("shift_stores").select("id").eq("slug", "shift").maybeSingle();
      resolvedStoreId = s?.id ?? null;
    }

    // Assemble DB-driven prompt (with fallback if empty)
    let systemPrompt = FALLBACK_PROMPTS[effectiveMode];
    let productsTable = "shift_products";
    let searchRpc = "shift_hybrid_search";
    if (resolvedStoreId) {
      const assembled = await assembleStorePrompt(supabase, resolvedStoreId);
      if (assembled) {
        productsTable = assembled.productsTable;
        searchRpc = assembled.searchRpc;
        if (assembled.prompt.length > 0) {
          systemPrompt = assembled.prompt;
        }
      }
    }
    systemPrompt += MODE_RULES[effectiveMode] || "";
    if (!is_first_message) {
      systemPrompt = NO_GREETING + "\n\n" + systemPrompt;
    }


    // For comparison mode, inject product data
    if (effectiveMode === "comparison" && products_context) {
      const productsList = products_context.map((p: any, i: number) =>
        `محصول ${i + 1}: ${p.name}\n- قیمت: ${p.price?.toLocaleString()} تومان\n- برند: ${p.brand || "نامشخص"}\n- امتیاز: ${p.rating}\n- مشخصات: ${JSON.stringify(p.specs || {})}`
      ).join("\n\n");
      systemPrompt += `\n\nمحصولات برای مقایسه:\n${productsList}`;
    }

    // For cart_manipulation mode, inject cart + recommended products context
    if (effectiveMode === "cart_manipulation") {
      if (cart_context?.items?.length > 0) {
        const cartList = cart_context.items.map((item: any, i: number) =>
          `${i + 1}. [${item.id}] ${item.name} - ${item.price?.toLocaleString()} تومان × ${item.quantity}`
        ).join("\n");
        systemPrompt += `\n\nسبد خرید فعلی:\n${cartList}\nجمع: ${cart_context.total?.toLocaleString()} تومان`;
      } else {
        systemPrompt += `\n\nسبد خرید فعلی: خالی`;
      }
      if (products_context?.length > 0) {
        const recList = products_context.map((p: any, i: number) =>
          `${i + 1}. [${p.id}] ${p.name} - ${p.price?.toLocaleString()} تومان (${p.brand || "نامشخص"})`
        ).join("\n");
        systemPrompt += `\n\nمحصولات پیشنهادی اخیر:\n${recList}`;
      }
    }

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...userMessages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const tools = MODE_TOOLS[effectiveMode] || [];

    // ── Start embedding generation in parallel for discovery mode ──
    const originalQuery = userMessages[userMessages.length - 1]?.content || "";
    let embeddingPromise: Promise<number[] | null> | null = null;
    if (effectiveMode === "discovery") {
      embeddingPromise = generateQueryEmbedding(normalizePersian(originalQuery));
    }

    // ── Step 1: LLM call (with or without tools based on mode) ──
    console.log(`Step 1: ${effectiveMode} LLM call...`);
    const llmBody: any = {
      model: "google/gemini-2.5-flash",
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

    // ── No tool call = direct response ──
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

    // ── cart_manipulation mode: parse tool call and return structured actions ──
    if (effectiveMode === "cart_manipulation") {
      const toolCall = choice.message.tool_calls[0];
      let cartResult: any;
      try {
        cartResult = JSON.parse(toolCall.function.arguments);
      } catch {
        cartResult = { actions: [], message: "متوجه نشدم. دوباره بگو.", needs_clarification: false };
      }
      console.log("Cart manipulation result:", JSON.stringify(cartResult));
      return new Response(
        JSON.stringify({
          cart_actions: cartResult.actions || [],
          content: cartResult.message || "عملیات انجام شد.",
          needs_clarification: cartResult.needs_clarification || false,
          clarification_options: cartResult.clarification_options || [],
          products: [],
          quickReplies: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: Execute tool calls + get embedding result ──
    console.log("Step 2: Hybrid retrieval...");
    const precomputedEmbedding = embeddingPromise ? await embeddingPromise : null;
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
        result = await executeSearch(supabase, funcArgs, precomputedEmbedding);
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

    // ── Step 3: Single follow-up LLM call for response generation + re-ranking ──
    console.log("Step 3: Response generation...");
    const candidatesForRerank = allProducts.slice(0, 10);
    const candidateList = candidatesForRerank.map((p: any, i: number) =>
      `${i + 1}. [${p.id}] ${p.name} - ${p.price?.toLocaleString()} تومان`
    ).join("\n");

    const rerankerInstruction = candidatesForRerank.length > 0
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
      ...(rerankerInstruction ? [{ role: "system", content: rerankerInstruction }] : []),
    ];

    const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
