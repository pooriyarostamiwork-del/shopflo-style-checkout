import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an intent classifier for a Persian e-commerce chat assistant called Flowcart (فلوکارت).

Given the user's message, conversation context, and shopping context, classify the intent into exactly one category.

IMPORTANT RULES:
- When user references a product by number (محصول ۲, شماره ۳, #1) AND wants to buy/add it → cart_add
- When user says "بخر" (buy) with a product reference → cart_add, NOT product_search
- When user says "مقایسه کن" or "فرق" → compare_products
- When user asks about specs/details of a previously shown product → product_details
- When user wants to finalize/checkout → checkout_initiate
- When user greets or asks general questions → greeting/help
- When user is searching for NEW products (no specific reference to shown products) → product_search
- "بخر" without a product reference but with a product description → product_search (they want to find and buy)
- "بخر" WITH a product number/name from shown products → cart_add (they want to add a specific shown product)

Context interpretation:
- last_recommended_count > 0 means products were recently shown to the user
- product references (#1, محصول ۲, etc.) refer to those shown products
- If has_cart_items is true, checkout-related intents are more likely`;

const CLASSIFY_TOOL = {
  type: "function",
  function: {
    name: "classify_intent",
    description: "Classify the user's shopping intent from their Persian message",
    parameters: {
      type: "object",
      properties: {
        intent_type: {
          type: "string",
          enum: ["transactional", "discovery", "comparison", "info_retrieval", "conversational"],
          description: "High-level intent category",
        },
        intent_subtype: {
          type: "string",
          enum: [
            "cart_add", "cart_add_by_name", "cart_remove", "quantity_update",
            "checkout_initiate", "checkout_direct", "coupon_apply", "save_for_later",
            "product_search", "product_filter", "product_details", "product_alternatives", "product_availability",
            "compare_products", "compare_with_external",
            "order_status", "return_policy", "shipping_info",
            "greeting", "clarification", "correction", "thanks", "help",
          ],
          description: "Specific intent subtype",
        },
        entities: {
          type: "object",
          properties: {
            product_ref: {
              type: "number",
              description: "Numeric product reference (1-based index) from shown products. e.g. محصول ۲ → 2",
            },
            product_name: {
              type: "string",
              description: "Product name mentioned by user for name-based matching. e.g. 'ایرپاد' or 'سامسونگ'",
            },
            product_refs: {
              type: "array",
              items: { type: "number" },
              description: "Multiple product references for comparison. e.g. [1, 3]",
            },
            quantity: {
              type: "number",
              description: "Desired quantity. e.g. ۲ تاش کن → 2",
            },
            delta: {
              type: "number",
              description: "Relative quantity change. e.g. یکی اضافه کن → +1, یکی کم کن → -1",
            },
            coupon_code: {
              type: "string",
              description: "Coupon/discount code mentioned",
            },
          },
          additionalProperties: false,
        },
        confidence: {
          type: "number",
          description: "Confidence score 0-1. Use lower values when intent is ambiguous.",
        },
      },
      required: ["intent_type", "intent_subtype", "confidence"],
      additionalProperties: false,
    },
  },
};

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

    const { message, conversation_history, context } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "message required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context description for the classifier
    const contextDesc = context
      ? `\n\nShopping context:
- Cart has items: ${context.has_cart_items ? "yes" : "no"}
- Products currently shown to user: ${context.last_recommended_count || 0}
- Shown product names: ${(context.last_recommended_names || []).map((n: string, i: number) => `#${i + 1} ${n}`).join(", ") || "none"}
- Current checkout step: ${context.checkout_step || "idle"}`
      : "";

    const messages = [
      { role: "system", content: SYSTEM_PROMPT + contextDesc },
      ...(conversation_history || []).slice(-3).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages,
        tools: [CLASSIFY_TOOL],
        tool_choice: { type: "function", function: { name: "classify_intent" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("Classify intent error:", status, errText);
      // Fallback to discovery
      return new Response(
        JSON.stringify({
          intent_type: "discovery",
          intent_subtype: "product_search",
          entities: {},
          confidence: 0.3,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error("No tool call returned from classifier");
      return new Response(
        JSON.stringify({
          intent_type: "discovery",
          intent_subtype: "product_search",
          entities: {},
          confidence: 0.3,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    try {
      result = JSON.parse(toolCall.function.arguments);
    } catch {
      result = {
        intent_type: "discovery",
        intent_subtype: "product_search",
        entities: {},
        confidence: 0.3,
      };
    }

    console.log("Intent classified:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Classify intent error:", error);
    return new Response(
      JSON.stringify({
        intent_type: "discovery",
        intent_subtype: "product_search",
        entities: {},
        confidence: 0.3,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
