

# Fix Plan: Latency, Cart Manipulation, Disambiguation, Repeated Greetings

## 4 Problems Identified

### Problem 1: 50-60s Response Times
**Root causes from code analysis:**
- Every message makes TWO sequential LLM calls: `classify-intent` (flash-lite) THEN `gpt-commerce-agent` (gemini-3-flash-preview)
- Discovery mode in `gpt-commerce-agent` makes THREE LLM calls total: Step 1 intent extraction → Step 2 hybrid search → Step 3 re-ranker response generation (lines 362-557)
- So a discovery query = 1 classifier + 3 agent = **4 serial LLM calls**
- Embedding generation via `Supabase.ai.Session("gte-small")` adds latency (line 250)
- Conversation history includes ALL messages including ones with products (line 366-368 in useAgentMessages), bloating tokens

**Fixes:**
1. **Merge classifier into agent for discovery intents**: For non-transactional intents, skip the classify-intent call entirely when the message is clearly a search query (no product refs, no cart keywords). Add a fast client-side pre-filter regex that catches obvious discovery queries and routes directly to the agent — saving one LLM round-trip.
2. **Eliminate Step 3 re-ranker call**: The re-ranker is a full second LLM call just to filter/reorder 10→6 products. Instead, do this filtering in Step 1's response: modify the Step 1 prompt to output both the search parameters AND a selection instruction, then apply it post-search in code. This cuts the agent from 3 LLM calls to 1.
3. **Parallelize embedding + LLM**: Currently `generateQueryEmbedding` runs INSIDE `executeSearch` which runs AFTER the LLM Step 1. Instead, start embedding generation as soon as we have the user query (parallel with Step 1 LLM), then use the pre-computed embedding in the search.
4. **Trim conversation history**: In `callAgent` (line 657), the full conversation history is sent. Limit to last 4 turns and strip product data from assistant messages.
5. **Switch agent model from `gemini-3-flash-preview` to `gemini-2.5-flash`**: The preview model may be slower; 2.5-flash is the proven fast option.

**Expected improvement**: 4 LLM calls → 1-2 calls. Target: sub-15s.

### Problem 2: Cart Manipulation Says "Done" But Doesn't Execute
**Root cause from code (lines 386-490 in useAgentMessages):**
- When `cart_add` with `product_ref=4` is classified, `handleTransactionalCartAdd(4)` is called (line 395)
- This resolves `lastRecommendedProducts[3]` — BUT `lastRecommendedProducts` is a stale closure value from when the hook was last rendered
- The message "دو تا از محصول شماره 4 به سبد اضافه کن" gets classified as `cart_add` with `product_ref=4`, but the `quantity` entity may not be extracted (the classifier may miss "دو تا"), so it defaults to adding 1 item
- Even worse: the intent routes to `callCartManipulationAgent` which calls `gpt-commerce-agent` in `cart_manipulation` mode — but the agent responds with a discovery-like response (new product search) instead of structured cart actions, because the conversation history sent includes the full previous discovery conversation and the agent loses context

**Fixes:**
1. **Fix quantity extraction in classifier**: Update `classify-intent` system prompt with explicit examples: "دو تا از محصول شماره ۴" → `cart_add, product_ref: 4, quantity: 2`
2. **Fix `handleTransactionalCartAdd` to respect quantity**: Currently ignores `quantity` entity. Change line 244-246 to pass quantity from classification result.
3. **Fix `callCartManipulationAgent` conversation history**: Currently sends full conversation history (line 594) which confuses the cart agent. Send ONLY the current user message + cart/product context, no conversation history.
4. **Ensure `executeCartActions` triggers proper state update**: The current `executeCartActions` (lines 532-585) calls `updateCurrentBasket` inside a loop — each call creates a new state update. Batch all actions into a single `updateCurrentBasket` call.

### Problem 3: Same-Brand Ambiguity (e.g., 2 Lenovo laptops)
**Root cause:**
- `cart_add_by_name` with `product_name: "لنوو"` hits `fuzzyMatchProduct` (line 114-126) which returns the FIRST match only
- When multiple products match, the code at lines 405-413 does check `matches.length === 1` and routes to `callCartManipulationAgent` for disambiguation — BUT the cart manipulation agent returns a discovery response instead of clarification options because its prompt doesn't explicitly handle this case well

**Fixes:**
1. **Improve disambiguation in `useAgentMessages`**: When `matches.length > 1`, don't route to the full cart_manipulation agent (slow). Instead, generate quick-reply chips directly on the client:
   ```
   const quickReplies = matches.map((p, i) => ({
     id: `disambig-${i}`, label: p.name.slice(0,40), 
     type: 'custom', action: `add_product_${p.id}`
   }));
   ```
   Show a message: "چند محصول لنوو پیدا کردم. کدومشو می‌خوای؟" + quick replies. No LLM call needed.
2. **Handle quick-reply click for disambiguation**: In `handleQuickReplyWrapped`, intercept `action.startsWith('add_product_')` and extract product ID to add directly.

### Problem 4: Agent Says "سلام" in Every Response
**Root cause:**
- The `gpt-commerce-agent` discovery prompt (line 22-56) contains: "اگه کاربر سوال عمومی پرسید (مثل سلام)، جواب بده و بگو چطور می‌تونی کمکش کنی"
- But more critically, the prompt says nothing about NOT greeting in follow-up messages
- The conversational mode prompt (line 85-93) also says "اگه سلام کرد، خوش‌آمد بگو"
- Since the agent has no session awareness, it greets on every call

**Fixes:**
1. **Add explicit no-greeting instruction to all agent prompts**: Add to discovery/comparison/info_retrieval/cart_manipulation prompts: "این یک مکالمه ادامه‌دار است. هرگز سلام یا خوش‌آمدگویی نکن مگر اینکه این اولین پیام مکالمه باشد."
2. **Pass `is_first_message` flag**: In `callAgent` (line 657), add `is_first_message: messages.length === 0` to the request body. In the agent, prepend "این اولین پیام کاربر نیست. بدون سلام و خوش‌آمدگویی جواب بده." when false.
3. **Client-side welcome message**: The welcome/greeting is already handled client-side via `WELCOME_MESSAGE` in `ChatInterface.tsx` (line 6-11). The agent should NEVER generate greetings.

## Implementation Steps

### Step 1: Fix repeated greetings in agent prompts
- **File**: `supabase/functions/gpt-commerce-agent/index.ts`
- Add `is_first_message` from request body
- Prepend no-greeting instruction to all prompts when `is_first_message === false`
- Add to all PROMPTS: "هرگز با سلام شروع نکن مگر اینکه is_first_message فلگ true باشد"

### Step 2: Fix cart manipulation execution
- **File**: `supabase/functions/classify-intent/index.ts` — Add quantity extraction examples to prompt
- **File**: `src/features/gpt-commerce/hooks/useAgentMessages.ts`:
  - `handleTransactionalCartAdd`: Accept and use `quantity` parameter
  - `callCartManipulationAgent`: Send minimal history (just user message)
  - `executeCartActions`: Batch into single `updateCurrentBasket` call

### Step 3: Add client-side brand disambiguation
- **File**: `src/features/gpt-commerce/hooks/useAgentMessages.ts`
  - When `matches.length > 1` in `cart_add_by_name`, generate quick-reply chips directly instead of calling agent
- **File**: `src/features/gpt-commerce/GPTCommerceShell.tsx`
  - Handle `add_product_*` quick-reply actions in `handleQuickReplyWrapped`

### Step 4: Reduce latency — eliminate re-ranker LLM call
- **File**: `supabase/functions/gpt-commerce-agent/index.ts`
  - Merge Step 1 + Step 3 into a single LLM call: the initial call should both extract search params AND generate the final response after receiving search results (using tool results in a single conversation turn, no second LLM call)
  - Switch model from `gemini-3-flash-preview` to `gemini-2.5-flash`
  - Parallelize embedding generation with LLM call

### Step 5: Trim conversation context sent to agent
- **File**: `src/features/gpt-commerce/hooks/useAgentMessages.ts`
  - In `callAgent`: limit history to 4 turns, strip product arrays from assistant messages
  - In `classifyIntent`: already limited to 6 turns (line 366-368), keep as-is

## Files Changed

| File | Changes |
|---|---|
| `supabase/functions/gpt-commerce-agent/index.ts` | No-greeting logic, eliminate re-ranker step, switch to gemini-2.5-flash, accept is_first_message, parallelize embedding |
| `supabase/functions/classify-intent/index.ts` | Better quantity extraction examples in prompt |
| `src/features/gpt-commerce/hooks/useAgentMessages.ts` | Fix cart add with quantity, client-side disambiguation, trim history, batch executeCartActions, send is_first_message |
| `src/features/gpt-commerce/GPTCommerceShell.tsx` | Handle disambiguation quick-reply actions |

