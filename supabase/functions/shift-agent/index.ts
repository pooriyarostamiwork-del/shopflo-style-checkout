import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normalizePersian(text: string): string {
  return text
    .replace(/\u200C/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u0640/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface ChatMsg { role: "user" | "assistant" | "system" | "tool"; content: string; tool_call_id?: string; tool_calls?: any[]; }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { store_id, messages } = await req.json();
    if (!store_id || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "store_id و messages الزامی است" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load store branding
    const { data: store } = await supabase
      .from("shift_stores").select("name_fa, tagline_fa").eq("id", store_id).maybeSingle();
    const storeName = store?.name_fa || "این فروشگاه";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const systemPrompt = `تو دستیار فروش هوشمند فروشگاه «${storeName}» هستی.
این یک فروشگاه تک‌برندی است و فقط محصولات همین فروشگاه را می‌فروشی. هرگز به فروشگاه‌های دیگر اشاره نکن.
${store?.tagline_fa ? `معرفی فروشگاه: ${store.tagline_fa}` : ""}

قوانین:
- همیشه فارسی صحبت کن.
- لحن صمیمی، حرفه‌ای و کمک‌کننده داشته باش.
- از مارک‌داون استفاده نکن (نه ستاره، نه هشتگ، نه لیست با خط تیره).
- قیمت‌ها به تومان هستن.
- وقتی کاربر دنبال محصولی می‌گرده یا پیشنهاد می‌خواد، حتماً از ابزار search_catalog استفاده کن.
- بعد از دریافت نتایج، حداکثر ۴ محصول مرتبط رو انتخاب کن و در یک پاراگراف کوتاه معرفی کن.
- در انتهای پاسخ در یک خط جدید دقیقاً بنویس: SELECTED_IDS:["id1","id2"]
- اگه نتیجه‌ای پیدا نشد، صادقانه بگو در حال حاضر چنین محصولی نداریم و چیز دیگه‌ای پیشنهاد بده.`;

    const tools = [{
      type: "function",
      function: {
        name: "search_catalog",
        description: "جستجو در کاتالوگ این فروشگاه",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "۲ تا ۴ کلمه کلیدی فارسی" },
            category: { type: "string" },
            species: { type: "string", description: "نوع حیوون (سگ، گربه، پرنده، ...) اگه مرتبطه" },
            max_price: { type: "number" },
            min_price: { type: "number" },
          },
          required: ["query"],
        },
      },
    }];

    const aiMessages = [{ role: "system", content: systemPrompt }, ...messages];

    const firstResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: aiMessages, tools }),
    });

    if (!firstResp.ok) {
      const t = await firstResp.text();
      console.error("LLM error", firstResp.status, t);
      const code = firstResp.status === 429 ? 429 : firstResp.status === 402 ? 402 : 500;
      const msg = code === 429 ? "سرعت درخواست‌ها زیاد شده."
        : code === 402 ? "اعتبار سرویس هوش مصنوعی تمام شده."
        : "خطا در سرویس هوش مصنوعی";
      return new Response(JSON.stringify({ error: msg }), {
        status: code, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const firstData = await firstResp.json();
    const choice = firstData.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      return new Response(JSON.stringify({
        content: choice?.message?.content || "متوجه نشدم. می‌تونی دوباره بگی؟",
        products: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Execute search
    const tc = toolCalls[0];
    let args: any = {};
    try { args = JSON.parse(tc.function.arguments); } catch {}
    const query = normalizePersian(args.query || "");

    const { data: hits } = await supabase.rpc("shift_hybrid_search", {
      p_store_id: store_id,
      p_query: query,
      p_embedding: null,
      p_category: args.category || null,
      p_subcategory: null,
      p_species: args.species || null,
      p_max_price: args.max_price ?? null,
      p_min_price: args.min_price ?? null,
      p_in_stock: true,
      p_limit: 10,
    });

    const products = (hits || []) as any[];
    const toolContent = products.map((p) => ({
      id: p.id, name: p.name_fa, price: p.price,
      brand: p.brand, category: p.category, species: p.species,
      description: (p.description_fa || "").slice(0, 200),
      in_stock: p.in_stock, tags: p.tags,
    }));

    const followUp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          ...aiMessages,
          choice.message,
          { role: "tool", tool_call_id: tc.id, content: JSON.stringify(toolContent) },
        ],
      }),
    });

    if (!followUp.ok) {
      return new Response(JSON.stringify({
        content: "نتایج پیدا شد ولی توضیحش برام دشوار بود.",
        products,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const followData = await followUp.json();
    const rawContent: string = followData.choices?.[0]?.message?.content || "";

    // Extract SELECTED_IDS
    let selectedIds: string[] = [];
    const m = rawContent.match(/SELECTED_IDS:\s*(\[[^\]]*\])/);
    if (m) {
      try { selectedIds = JSON.parse(m[1]); } catch {}
    }
    const cleanContent = rawContent.replace(/SELECTED_IDS:\s*\[[^\]]*\]/, "").trim();
    const idSet = new Set(selectedIds);
    const selectedProducts = selectedIds.length
      ? products.filter((p) => idSet.has(p.id))
      : products.slice(0, 4);

    return new Response(JSON.stringify({
      content: cleanContent || "این چندتا گزینه پیدا کردم:",
      products: selectedProducts,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("shift-agent error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
