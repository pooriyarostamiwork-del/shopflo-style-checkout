

# New Agent Mode: `cart_manipulation`

## Problem

Transactional cart intents are currently handled entirely client-side after classification. This works for simple cases (add by number, remove, update quantity), but fails for ambiguous or complex cart operations where the user needs intelligent resolution — e.g.:

- "ایرپاد رو بخر" when multiple AirPods exist in recommendations
- "ارزون‌ترین رو بذار سبد" — requires sorting + selecting
- "همه رو بخر" — batch add
- "عوضش کن با اون یکی" — replace item
- "یه دونه از هر کدوم بذار" — multi-add with quantity logic
- Disambiguation: "کدوم سامسونگ؟" when user said "سامسونگ رو بخر" but 3 Samsung products exist

The client-side handlers can't reason about these. A dedicated `cart_manipulation` agent mode would receive the current cart state + recommended products as context, reason about the user's request, and return structured cart operations.

## Architecture

```text
classify-intent returns:
  intent_type: "transactional"
  intent_subtype: "cart_add_by_name" | "cart_add" | "cart_remove" | ...
  confidence: 0.7 (ambiguous)
       │
       ▼
  confidence >= 0.85 AND entities fully resolved?
       │                    │
      YES                  NO
       │                    │
       ▼                    ▼
  Client-side          Call gpt-commerce-agent
  (current behavior)   mode: "cart_manipulation"
                            │
                            ▼
                       Returns structured JSON:
                       { actions: [...], message: "..." }
                            │
                            ▼
                       Client executes actions
```

## New Mode: `cart_manipulation` in `gpt-commerce-agent`

### System Prompt
A Persian cart management assistant that receives:
- Current cart contents (items, quantities, prices)
- Last recommended products (with indices)
- User's request

And returns structured cart operations.

### Input (injected via `products_context` and new `cart_context`)
```typescript
// Request body additions:
{
  mode: "cart_manipulation",
  cart_context: {
    items: [{ id, name, price, quantity, merchant }],
    total: number,
  },
  products_context: [{ id, name, price, merchant, rating }],  // lastRecommended
}
```

### Output Schema (via tool-calling)
The agent calls a `execute_cart_operations` tool returning:
```typescript
{
  actions: [
    { type: "add", product_index: 2, quantity: 1 },
    { type: "remove", product_id: "uuid" },
    { type: "update_quantity", product_id: "uuid", quantity: 3 },
    { type: "replace", remove_product_id: "uuid", add_product_index: 1 },
  ],
  message: "string",  // Persian confirmation message
  needs_clarification: boolean,
  clarification_options?: string[],
}
```

### Tool Definition
```typescript
{
  name: "execute_cart_operations",
  description: "Execute one or more cart operations based on user request",
  parameters: {
    actions: [{
      type: "add" | "remove" | "update_quantity" | "replace",
      product_index?: number,      // 1-based index from recommended products
      product_id?: string,         // UUID from cart items
      quantity?: number,
    }],
    message: string,               // Persian response to show user
    needs_clarification: boolean,  // true if ambiguous
    clarification_options: string[], // quick-reply options for disambiguation
  }
}
```

## Intent Subtypes That Route to This Mode

| Subtype | When routed to agent | Example |
|---|---|---|
| `cart_add` | `product_ref` missing OR confidence < 0.85 | "اون رو بذار سبد" |
| `cart_add_by_name` | fuzzy match returns 0 or 2+ results | "سامسونگ رو بخر" (3 Samsungs) |
| `cart_remove` | no ref, no name, multiple cart items | "یکیشو حذف کن" |
| `quantity_update` | ambiguous target | "بیشتر بذار" |
| `checkout_direct` | ref missing | "خریدش کن بفرست" |
| `cart_batch_add` | NEW subtype: "همه رو بخر" | batch operations |
| `cart_replace` | NEW subtype: "عوضش کن" | swap item |
| `cart_cheapest` | NEW subtype: "ارزون‌ترین رو بذار" | selection by criteria |

## Implementation Steps

### Step 1: Add `cart_manipulation` prompt and tool to `gpt-commerce-agent`
- New system prompt in `PROMPTS` object
- New `CART_OPERATIONS_TOOL` definition
- New `MODE_TOOLS` entry: `cart_manipulation: [CART_OPERATIONS_TOOL]`
- Parse tool response and return structured actions

### Step 2: Add routing logic in `useAgentMessages.ts`
- After transactional classification, check if entities are fully resolved and confidence is high
- If not, route to `callAgent(content, history, 'cart_manipulation', productsContext, cartContext)`
- Add `cartContext` parameter to `callAgent`
- Process returned `actions` array to execute each operation locally

### Step 3: Add new subtypes to `classify-intent`
- Add `cart_batch_add`, `cart_replace`, `cart_cheapest` to the subtype enum
- Update system prompt examples for these new subtypes

### Step 4: Handle agent response actions client-side
- New function `executeCartActions(actions)` that loops through the returned actions array and calls existing handlers (`handleAddToCart`, `handleRemoveItem`, `handleUpdateQuantity`)
- Render the agent's `message` as the confirmation
- If `needs_clarification`, render `clarification_options` as quick replies

## Files

| File | Change |
|---|---|
| `supabase/functions/gpt-commerce-agent/index.ts` | Add `cart_manipulation` prompt, `CART_OPERATIONS_TOOL`, mode routing |
| `supabase/functions/classify-intent/index.ts` | Add new subtypes, update prompt examples |
| `src/features/gpt-commerce/hooks/useAgentMessages.ts` | Add ambiguity detection, `cart_manipulation` routing, `executeCartActions` |

