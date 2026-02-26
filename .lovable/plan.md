

# Intent Classification & Multi-Mode Agent Architecture

## Problem

Current system has one monolithic path: client-side regex shortcuts (lines 210-322 in `useAgentMessages.ts`) handle a few Persian keywords, everything else goes to `gpt-commerce-agent` which only knows how to search products. When user says "محصول ۲ رو بخر" the agent searches for products instead of adding to cart.

## Architecture

```text
User Message
     │
     ▼
┌─────────────────────────────┐
│  classify-intent (edge fn)  │  gemini-2.5-flash-lite (~50ms)
│  Returns structured intent  │
└──────────┬──────────────────┘
           │
    ┌──────┴───────────────────────────┐
    │              │                   │
    ▼              ▼                   ▼
TRANSACTIONAL   DISCOVERY/          CONVERSATIONAL
(client-side)   COMPARISON          (agent, no tools)
                (agent + tools)
```

## Complete Intent Taxonomy

### Group A: Transactional — executed client-side, zero LLM calls after classification

| Subtype | Persian triggers (examples) | Entities extracted | Client action |
|---|---|---|---|
| `cart_add` | محصول ۲ رو بخر، شماره ۳ اضافه کن، #1 رو بذار | `product_ref: number` | Resolve from `lastRecommendedProducts[ref-1]`, add to cart, confirm message |
| `cart_add_by_name` | ایرپاد رو بخر، همون سامسونگ رو اضافه کن | `product_name: string` | Fuzzy match against `lastRecommendedProducts` by name, add to cart |
| `cart_remove` | حذفش کن، محصول ۲ رو بردار، از سبد حذف کن | `product_ref?: number, product_name?: string` | Remove from `cartItems` |
| `quantity_update` | ۲ تاش کن، تعداد رو ۳ کن، یکی کم کن | `product_ref?: number, quantity: number, delta?: number` | Update quantity in cart |
| `checkout_initiate` | نهایی کن، بخرشون، خرید رو انجام بده، تموم کن | (none) | Call `handleFinalizePurchase()` |
| `checkout_direct` | محصول ۲ رو بخر بفرست خونه، پرداخت مستقیم | `product_ref: number` | Add + initiate checkout in one shot |
| `coupon_apply` | کد تخفیف SALE20، تخفیف بزن | `coupon_code: string` | Apply coupon to cart |
| `save_for_later` | ذخیره کن، بعداً میخرم | `product_ref?: number` | Move to saved items |

### Group B: Discovery — routed to agent with search/detail tools

| Subtype | Persian triggers (examples) | Agent mode | Tools available |
|---|---|---|---|
| `product_search` | هدفون بلوتوثی میخوام، لپتاپ زیر ۱۰ میلیون | `discovery` | `search_products` |
| `product_filter` | ارزان‌ترینش، فقط سامسونگ رو نشون بده | `discovery` | `search_products` (with filters from context) |
| `product_details` | مشخصاتش چیه، جزئیات بیشتر بده | `discovery` | `get_product_details` |
| `product_alternatives` | مشابهش چی داری، جایگزین بده | `discovery` | `search_products` |
| `product_availability` | موجوده؟ کی میرسه؟ | `discovery` | `get_product_details` |

### Group C: Comparison — routed to agent with product data injected, no search

| Subtype | Persian triggers (examples) | Agent mode | Data injected |
|---|---|---|---|
| `compare_products` | فرق ۱ و ۳ چیه، مقایسه کن | `comparison` | Full specs of referenced products from `lastRecommendedProducts` |
| `compare_with_external` | این با ایرپاد پرو چه فرقی داره | `comparison` | One from context + search for the other |

### Group D: Information Retrieval — routed to agent, read-only context

| Subtype | Persian triggers (examples) | Agent mode | Context |
|---|---|---|---|
| `order_status` | سفارشم کجاست، پیگیری سفارش | `info_retrieval` | User's order data |
| `return_policy` | گارانتی داره؟ مرجوع میشه؟ | `info_retrieval` | Store policies |
| `shipping_info` | چند روزه میرسه، ارسال رایگانه؟ | `info_retrieval` | Product/shipping data |

### Group E: Conversational Control — routed to agent, lightweight

| Subtype | Persian triggers (examples) | Agent mode | Behavior |
|---|---|---|---|
| `greeting` | سلام، خسته نباشی | `conversational` | Greeting + suggest help |
| `clarification` | منظورم آبی بود، نه اون یکی | `conversational` | Re-interpret with context |
| `correction` | نه اشتباه شد، بردار | `conversational` | Undo/correct last action |
| `thanks` | ممنون، دستت درد نکنه | `conversational` | Polite close |
| `help` | چیکار میتونی بکنی | `conversational` | Capability overview |

## Classifier Edge Function: `classify-intent`

**Model**: `google/gemini-2.5-flash-lite` (fastest, cheapest)

**Input**: last user message + last 3 conversation turns + `context` object containing:
- `has_cart_items`: boolean
- `last_recommended_count`: number  
- `last_recommended_names`: string[] (first 6)
- `checkout_step`: current agentic step

**Output schema** (via tool-calling):
```typescript
{
  intent_type: "transactional" | "discovery" | "comparison" | "info_retrieval" | "conversational",
  intent_subtype: string,  // e.g. "cart_add", "product_search", "compare_products"
  entities: {
    product_ref?: number,        // numeric reference like #2
    product_name?: string,       // name-based reference
    product_refs?: number[],     // for comparison: [1, 3]
    quantity?: number,
    coupon_code?: string,
  },
  confidence: number  // 0-1
}
```

**Fallback**: If confidence < 0.5 or classification fails, default to `discovery` mode (current behavior).

## Agent Modes in `gpt-commerce-agent`

The existing edge function gets a new `mode` parameter. Each mode has a specialized system prompt and tool set:

### Mode: `discovery` (default, current behavior)
- System prompt: current prompt (product search assistant)
- Tools: `search_products`, `get_product_details`
- Pipeline: Intent extraction → Hybrid retrieval → Re-ranker → Response
- No changes needed except accepting `mode` param

### Mode: `comparison`
- System prompt: "You are comparing products. Given the product specs below, provide a clear structured comparison in Persian. Focus on key differences. No markdown."
- Tools: none (data injected in request body as `products_context`)
- Pipeline: Single LLM call with product data → Comparison response
- No search, no re-ranking

### Mode: `info_retrieval`
- System prompt: "You answer factual questions about products, orders, shipping, and store policies. Be concise and accurate."
- Tools: `get_product_details` only
- Pipeline: Single LLM call, optionally fetch product details
- Context: order data, product data from client

### Mode: `conversational`
- System prompt: "You are a friendly Persian shopping assistant. Respond naturally. No product search needed."
- Tools: none
- Pipeline: Single LLM call → Response
- Fastest path

## Client-Side Transactional Handlers

New handlers added to `useAgentMessages.ts`, replacing the current regex block:

- `handleCartAddByRef(ref: number)` — resolves `lastRecommendedProducts[ref-1]`, calls existing `handleAddToCart`
- `handleCartAddByName(name: string)` — fuzzy match against `lastRecommendedProducts`, calls `handleAddToCart`
- `handleCartRemoveByRef(ref?: number, name?: string)` — resolves and removes
- `handleQuantityUpdateByRef(ref?: number, qty: number)` — resolves and updates
- `handleCheckoutDirect(ref: number)` — add + finalize in one shot

Each produces a confirmation `ChatMessage` immediately, no LLM call.

## Implementation Steps

### Step 1: Create `supabase/functions/classify-intent/index.ts`
- Lightweight edge function
- Single LLM call with tool-calling to extract structured intent
- ~50ms latency, minimal token usage

### Step 2: Update `supabase/functions/gpt-commerce-agent/index.ts`
- Accept `mode` parameter in request body
- Switch system prompt and tools based on mode
- Accept optional `products_context` for comparison mode
- Keep existing logic as `discovery` mode (default)

### Step 3: Refactor `src/features/gpt-commerce/hooks/useAgentMessages.ts`
- Remove regex-based intent detection (lines 210-322)
- Add `classifyIntent()` call as first step in `handleSendMessage`
- Route based on `intent_type`:
  - `transactional` → client-side handlers (no LLM)
  - `discovery` → call agent with `mode: "discovery"` 
  - `comparison` → inject product data, call agent with `mode: "comparison"`
  - `info_retrieval` → call agent with `mode: "info_retrieval"`
  - `conversational` → call agent with `mode: "conversational"`
- Add all transactional handler functions
- Same refactoring for `sendMessageToBasket`

### Step 4: Update `supabase/config.toml`
- Add `[functions.classify-intent]` with `verify_jwt = false`

## Files

| File | Change |
|---|---|
| `supabase/functions/classify-intent/index.ts` | **NEW** — intent classifier |
| `supabase/functions/gpt-commerce-agent/index.ts` | Add `mode` parameter, mode-specific prompts and tool sets |
| `src/features/gpt-commerce/hooks/useAgentMessages.ts` | Replace regex with classifier → router, add transactional handlers |
| `supabase/config.toml` | Add classify-intent config (auto-managed) |

