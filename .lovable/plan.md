


# New Agent Mode: `cart_manipulation` ✅ IMPLEMENTED

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

## Implementation (Completed)

### Step 1: `gpt-commerce-agent` — `cart_manipulation` mode
- Added `cart_manipulation` system prompt to `PROMPTS`
- Added `CART_OPERATIONS_TOOL` with `execute_cart_operations` function
- Added `cart_manipulation: [CART_OPERATIONS_TOOL]` to `MODE_TOOLS`
- Accepts `cart_context` in request body, injects into prompt
- Parses tool call response and returns `{ cart_actions, content, needs_clarification, clarification_options }`

### Step 2: `classify-intent` — New subtypes
- Added `cart_batch_add`, `cart_replace`, `cart_cheapest` to subtype enum
- Updated system prompt with examples for new subtypes

### Step 3: `useAgentMessages.ts` — Ambiguity routing + action executor
- New subtypes (`cart_batch_add`, `cart_replace`, `cart_cheapest`) always route to `callCartManipulationAgent`
- Existing subtypes (`cart_add`, `cart_add_by_name`, `cart_remove`, `quantity_update`) route to agent when entities can't be resolved
- `executeCartActions(actions)` loops through returned actions and calls existing handlers
- `callCartManipulationAgent` sends cart + recommended products context, processes response
- Clarification options rendered as quick replies when `needs_clarification` is true
