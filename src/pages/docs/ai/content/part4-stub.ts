import type { Part } from "./types";

export const part4Stub: Part = {
  id: "part-4",
  number: "IV",
  title: "Workflow Deep-Dives",
  intro:
    "End-to-end walkthroughs of the four core agentic workflows — Discovery, Database Search, Cart Manipulation, and Checkout — plus a line-by-line dissection of the hybrid_product_search SQL function.",
  sections: [
    // ─────────────────────────────────────────────────────────────
    {
      id: "p4-discovery",
      title: "Workflow A — Product Discovery",
      status: "live",
      blocks: [
        {
          kind: "prose",
          html: `<p>Discovery is the path a brand-new query takes from raw Persian text to a rendered carousel of product cards. It exercises every layer of the stack: classifier, agent, edge embeddings, hybrid SQL, and client renderer.</p>`,
        },
        {
          kind: "mermaid",
          caption: "Discovery sequence — text in, product cards out.",
          code: `sequenceDiagram
  participant U as User
  participant C as Client (useAgentMessages)
  participant CI as classify-intent
  participant A as gpt-commerce-agent
  participant GE as generate-embeddings
  participant DB as Postgres (hybrid_product_search)
  participant LA as Lovable AI (Gemini 3 Flash)

  U->>C: "هدفون بی‌سیم زیر ۳ میلیون"
  C->>CI: POST { message, history[-3], context }
  CI->>LA: tool_call: classify_intent
  LA-->>CI: { intent_type:"discovery", subtype:"product_search", conf:0.92 }
  CI-->>C: routed_mode = "discovery"
  C->>A: SSE POST { mode:"discovery", message, history }
  A->>LA: chat.completions stream + tools=[search_products]
  LA-->>A: tool_call search_products({ query_text:"هدفون بی‌سیم", price_max:3000000 })
  A->>GE: embed(query_text)
  GE-->>A: vector(384)
  A->>DB: rpc hybrid_product_search(...)
  DB-->>A: top 20 rows (final_score desc)
  A->>LA: tool_response (top 12 trimmed)
  LA-->>A: streamed prose + "SELECTED_IDS:[...]"
  A-->>C: SSE chunks (delta tokens)
  C->>U: prose streams + product cards render`,
        },
        {
          kind: "heading",
          level: 3,
          id: "p4-discovery-phases",
          text: "Phase-by-phase",
        },
        {
          kind: "table",
          head: ["#", "Owner", "Action", "Cost / Latency"],
          rows: [
            ["1", "Client", "<code>useAgentMessages.send()</code> appends user message, opens SSE.", "~0ms"],
            ["2", "<code>classify-intent</code>", "Forced tool-call on Gemini 2.5 Flash Lite.", "~300ms · ~$0.00002"],
            ["3", "Router", "Confidence ≥ 0.5 → mode <code>discovery</code>.", "0ms"],
            ["4", "<code>gpt-commerce-agent</code>", "Opens stream to Gemini 3 Flash with <code>search_products</code> tool exposed.", "~120ms TTFB"],
            ["5", "Model", "Emits <code>tool_call</code> with extracted query, filters, semantic_tags.", "~400ms"],
            ["6", "Agent", "Parallel: (a) call <code>generate-embeddings</code> for query_text, (b) build SQL params.", "~200ms"],
            ["7", "Postgres", "<code>hybrid_product_search</code> RPC: FTS + trigram + pgvector + filter boost.", "30–80ms"],
            ["8", "Agent", "Trims to top 12, posts as <code>tool</code> message back to model.", "0ms"],
            ["9", "Model", "Streams Persian prose + trailing <code>SELECTED_IDS:[…]</code> sentinel.", "1–2s"],
            ["10", "Client", "Parses sentinel, hydrates products from snapshot, renders <code>ChatProductCard</code> grid.", "<16ms"],
          ],
        },
        {
          kind: "heading",
          level: 3,
          id: "p4-discovery-tool",
          text: "search_products tool schema",
        },
        {
          kind: "code",
          lang: "json",
          title: "Tool exposed to Gemini 3 Flash",
          code: `{
  "name": "search_products",
  "description": "Semantic + lexical product search across the catalog.",
  "parameters": {
    "type": "object",
    "required": ["query_text"],
    "properties": {
      "query_text":     { "type": "string", "description": "2-3 keyword Persian query (NOT a sentence)" },
      "subcategory":    { "type": "string", "enum": ["هدفون، هدست و هندزفری","لپ تاپ", "..."] },
      "price_min":      { "type": "integer", "description": "Tomans. ONLY if user gave an exact number." },
      "price_max":      { "type": "integer" },
      "min_rating":     { "type": "number", "minimum": 0, "maximum": 5 },
      "brand":          { "type": "string" },
      "semantic_tags":  { "type": "array", "items": { "type": "string" },
                          "description": "Implicit needs: hard_to_lose, child_safe, sport_use, sweat_resistant, ..." }
    }
  }
}`,
        },
        {
          kind: "callout",
          tone: "warning",
          title: "Price guessing is forbidden",
          html: `<p>The system prompt explicitly instructs the model: <em>"never guess price_min or price_max — only set them if the user said an exact number."</em> Without this, Gemini cheerfully invents <code>price_max=2000000</code> for vague phrases like "ارزون" and silently filters out 90% of the catalog.</p>`,
        },
        {
          kind: "heading",
          level: 3,
          id: "p4-discovery-selection",
          text: "The SELECTED_IDS sentinel",
        },
        {
          kind: "prose",
          html: `<p>The model returns up to 20 rows but the UI shows exactly 6. We don't trust ranking alone — we let the model curate based on prose context. The sentinel pattern:</p>`,
        },
        {
          kind: "code",
          lang: "ts",
          title: "Client-side parser",
          code: `const RX = /SELECTED_IDS:\\s*(\\[[^\\]]*\\])/;
const match = streamedText.match(RX);
const selectedIds: string[] = match ? JSON.parse(match[1]) : [];
const visibleProducts = selectedIds
  .map((id) => productsSnapshotById.get(id))
  .filter(Boolean)
  .slice(0, 6);
// Strip the sentinel from the user-visible bubble
const cleanProse = streamedText.replace(RX, "").trim();`,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────
    {
      id: "p4-db",
      title: "Workflow B — Database Search (hybrid_product_search)",
      status: "live",
      blocks: [
        {
          kind: "prose",
          html: `<p>The single most important SQL function in the system. It blends four signals — full-text rank, trigram similarity (name & tags), vector cosine, and structured filter boost — into one weighted score, then filters and sorts. Below is the function with every clause annotated.</p>`,
        },
        {
          kind: "heading",
          level: 3,
          id: "p4-db-signature",
          text: "Signature & inputs",
        },
        {
          kind: "code",
          lang: "sql",
          title: "Function signature",
          code: `hybrid_product_search(
  p_query        text,                  -- raw Persian query, NOT pre-normalized
  p_embedding    vector  DEFAULT NULL,  -- 384-dim, gte-small. NULL → text-only mode
  p_subcategory  text    DEFAULT NULL,  -- exact match (e.g. "لپ تاپ")
  p_max_price    numeric DEFAULT NULL,  -- tomans, inclusive
  p_min_price    numeric DEFAULT NULL,
  p_min_rating   numeric DEFAULT NULL,  -- 0..5
  p_brand        text    DEFAULT NULL,  -- ILIKE %brand%
  p_in_stock     boolean DEFAULT true   -- pass NULL to disable the filter
) RETURNS TABLE(... 21 columns ..., final_score double precision)`,
        },
        {
          kind: "heading",
          level: 3,
          id: "p4-db-walkthrough",
          text: "Line-by-line walkthrough",
        },
        {
          kind: "code",
          lang: "sql",
          title: "Scoring expression — annotated",
          code: `(
  -- ── 1. Full-text rank ─────────────────────────────────────────
  -- Uses the precomputed tsvector column "search_vector" populated
  -- by the products_search_vector_update() trigger. Persian text
  -- is normalized first (ي→ی, ك→ک, ZWJ→space, kashida stripped).
  -- websearch_to_tsquery handles operators like quoted phrases.
  COALESCE(ts_rank(
    p.search_vector,
    websearch_to_tsquery('simple', normalize_persian(p_query))
  ), 0) * (CASE WHEN p_embedding IS NOT NULL THEN 0.30 ELSE 0.35 END)
  +
  -- ── 2. Trigram similarity on name ─────────────────────────────
  -- pg_trgm catches typos and partial matches the FTS misses
  -- ("ایفون" vs "آیفون", "لنوو" vs "لنووو").
  COALESCE(similarity(p.name, normalize_persian(p_query)), 0) * 0.20
  +
  -- ── 3. Trigram similarity on tags ─────────────────────────────
  -- Tags like {"gaming","mechanical","RGB"} matched against query.
  -- array_to_string flattens for similarity().
  COALESCE(similarity(
    array_to_string(COALESCE(p.tags, '{}'), ' '),
    normalize_persian(p_query)
  ), 0) * 0.10
  +
  -- ── 4. Vector cosine (only when embedding provided) ───────────
  -- p.embedding <=> p_embedding returns cosine DISTANCE (0..2).
  -- We invert via 1 - distance and clamp at 0 with GREATEST.
  -- Weight 0.30 makes vector the heaviest single signal when on.
  (CASE
    WHEN p_embedding IS NOT NULL AND p.embedding IS NOT NULL
    THEN GREATEST(1.0 - (p.embedding <=> p_embedding), 0) * 0.30
    ELSE 0.0
  END)
  +
  -- ── 5. Structured boost ───────────────────────────────────────
  -- A perfect subcategory match adds a flat bonus, ensuring that
  -- when the classifier extracts a subcategory the matching rows
  -- bubble above lexically-similar but off-category items.
  (CASE
    WHEN p_subcategory IS NOT NULL AND p.subcategory = p_subcategory
    THEN 1.0 ELSE 0.0
  END) * (CASE WHEN p_embedding IS NOT NULL THEN 0.10 ELSE 0.15 END)
) AS final_score`,
        },
        {
          kind: "heading",
          level: 3,
          id: "p4-db-weights",
          text: "Weight matrix",
        },
        {
          kind: "table",
          head: ["Signal", "With embedding", "Text-only fallback", "Why"],
          rows: [
            ["FTS rank", "0.30", "0.35", "Strong lexical anchor; takes the slack when no vector."],
            ["Trigram (name)", "0.20", "0.20", "Typo tolerance, brand variants."],
            ["Trigram (tags)", "0.10", "0.10", "Catches descriptive words tagged at ingestion."],
            ["Vector cosine", "0.30", "—", "Semantic / synonyms. Disabled in fallback to keep math sane."],
            ["Subcategory boost", "0.10", "0.15", "Hard structural prior, larger when no semantics available."],
          ],
        },
        {
          kind: "callout",
          tone: "info",
          title: "Why text-only fallback exists",
          html: `<p><code>generate-embeddings</code> can fail (Lovable AI rate limit, transient network). Rather than 500 the whole search, the agent passes <code>p_embedding=NULL</code> and the function silently re-weights. Result quality drops ~15% but the user gets cards.</p>`,
        },
        {
          kind: "heading",
          level: 3,
          id: "p4-db-filters",
          text: "WHERE clauses",
        },
        {
          kind: "code",
          lang: "sql",
          code: `WHERE
  (p_in_stock    IS NULL OR p.in_stock = p_in_stock)
  AND (p_subcategory IS NULL OR p.subcategory = p_subcategory)
  AND (p_max_price   IS NULL OR p.price <= p_max_price)
  AND (p_min_price   IS NULL OR p.price >= p_min_price)
  AND (p_min_rating  IS NULL OR p.rating >= p_min_rating)
  AND (p_brand       IS NULL OR p.brand ILIKE '%' || p_brand || '%')
ORDER BY final_score DESC
LIMIT 20;`,
        },
        {
          kind: "prose",
          html: `<p>Every filter is <strong>nullable-friendly</strong>: the pattern <code>p_x IS NULL OR ...</code> means an unspecified parameter disables the filter entirely. This is what lets the agent send only the fields the user actually mentioned without building dynamic SQL.</p>`,
        },
        {
          kind: "heading",
          level: 3,
          id: "p4-db-indexes",
          text: "Required indexes",
        },
        {
          kind: "table",
          head: ["Index", "Type", "Powers"],
          rows: [
            ["<code>products_search_vector_idx</code>", "GIN on tsvector", "<code>ts_rank</code> + <code>@@</code>"],
            ["<code>products_name_trgm_idx</code>", "GIN with gin_trgm_ops", "<code>similarity(name, …)</code>"],
            ["<code>products_tags_trgm_idx</code>", "GIN on array_to_string(tags)", "<code>similarity(tags, …)</code>"],
            ["<code>products_embedding_idx</code>", "HNSW (vector_cosine_ops)", "<code>&lt;=&gt;</code> ANN search"],
            ["<code>products_subcategory_idx</code>", "btree", "filter + boost branch"],
            ["<code>products_price_idx</code>", "btree", "<code>price</code> range filter"],
          ],
        },
        {
          kind: "heading",
          level: 3,
          id: "p4-db-example",
          text: "Worked example",
        },
        {
          kind: "code",
          lang: "sql",
          title: "Query: 'هدفون بی‌سیم زیر ۳ میلیون' with embedding",
          code: `SELECT id, name, price, ROUND(final_score::numeric, 4) AS score
FROM hybrid_product_search(
  p_query       => 'هدفون بی سیم',
  p_embedding   => '[0.013, -0.041, ...]'::vector(384),
  p_subcategory => 'هدفون، هدست و هندزفری',
  p_max_price   => 3000000,
  p_in_stock    => true
);

-- typical output
--           name              | price   | score
-- ───────────────────────────-+─────────+────────
--  هدفون بی‌سیم Sony WH-CH520 | 2890000 | 0.7841
--  هدفون بلوتوثی Anker Q20    | 1990000 | 0.7102
--  هندزفری بی‌سیم JBL Tune    | 2450000 | 0.6873
--  ...`,
        },
        {
          kind: "callout",
          tone: "idea",
          title: "Why LIMIT 20, not 6",
          html: `<p>The function returns 20 rows so the model has slack to <strong>curate</strong>. The model picks the best 6 via <code>SELECTED_IDS</code> based on prose-level reasoning the SQL can't express ("the user said it's a gift, so prioritize ones with nicer packaging").</p>`,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────
    {
      id: "p4-cart",
      title: "Workflow C — Cart Manipulation",
      status: "live",
      blocks: [
        {
          kind: "prose",
          html: `<p>Cart actions are the most latency-sensitive workflow because the user expects an instant visual update. The architecture uses an <strong>optimistic local mutation + classifier short-circuit</strong> to skip the second LLM call entirely when entities are unambiguous.</p>`,
        },
        {
          kind: "mermaid",
          caption: "Cart add — local-first short-circuit path.",
          code: `sequenceDiagram
  participant U as User
  participant C as Client
  participant CI as classify-intent
  participant BS as useBasketState
  participant DB as baskets table

  U->>C: "محصول شماره ۲ رو اضافه کن"
  C->>CI: classify
  CI-->>C: { subtype:"cart_add", product_ref:2, quantity:1, conf:0.94 }
  alt confidence ≥ 0.8 AND product_ref resolvable
    C->>BS: addToCart(shownProducts[1], qty=1)
    BS->>BS: optimistic state update (instant render)
    BS-->>U: agent bubble: "محصول X به سبد اضافه شد ✓"
    BS-)DB: debounced(1s) UPSERT cart_items
  else low confidence OR ambiguous brand
    C->>A: route to cart_manipulation agent
    A-->>C: prose + quick-reply chips
  end`,
        },
        {
          kind: "heading",
          level: 3,
          id: "p4-cart-subtypes",
          text: "Intent subtype handling",
        },
        {
          kind: "table",
          head: ["intent_subtype", "Resolution strategy", "LLM hops"],
          rows: [
            ["<code>cart_add</code>", "<code>shownProducts[product_ref - 1]</code>, optimistic add.", "1 (classifier)"],
            ["<code>cart_add_by_name</code>", "Fuzzy match against shown names; if multi-match → quick-reply chips.", "1"],
            ["<code>cart_remove</code>", "Resolve via product_ref or product_name in cart.", "1"],
            ["<code>quantity_update</code>", "Apply <code>delta</code> or absolute <code>quantity</code> to last-added or referenced item.", "1"],
            ["<code>cart_batch_add</code>", "Iterate refs, single optimistic batch.", "1"],
            ["<code>cart_replace</code>", "Clear active basket, then batch add.", "1"],
            ["<code>cart_cheapest</code>", "Sort shown by price ASC, add [0]; agent confirms.", "2 (needs prose)"],
          ],
        },
        {
          kind: "heading",
          level: 3,
          id: "p4-cart-persistence",
          text: "Persistence & sync",
        },
        {
          kind: "code",
          lang: "ts",
          title: "useCartPersistence — debounced UPSERT",
          code: `useEffect(() => {
  if (!user) return;
  const t = setTimeout(() => {
    supabase.from("baskets").upsert({
      id: activeBasketId,
      user_id: user.id,
      cart_items: stripUIArtifacts(cartItems),
      messages: filterPersistableMessages(messages),
      shipping_selections: shippingByMerchant,
      selected_address_id: selectedAddressId,
      agentic_state: agenticState,
      last_activity: new Date().toISOString(),
    });
  }, 1000); // debounce window
  return () => clearTimeout(t);
}, [cartItems, messages, shippingByMerchant, selectedAddressId, agenticState]);`,
        },
        {
          kind: "callout",
          tone: "warning",
          title: "Persistence filtering is mandatory",
          html: `<p>UI-only message kinds (<code>address-selector</code>, <code>payment-selector</code>, transient quick-reply chips) are <strong>stripped</strong> before sync. Persisting them causes state corruption on restore — e.g. a stale address selector blocks new turns. See <code>filterPersistableMessages()</code>.</p>`,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────
    {
      id: "p4-checkout",
      title: "Workflow D — Agentic Checkout",
      status: "live",
      blocks: [
        {
          kind: "prose",
          html: `<p>Checkout is a <strong>linear, agent-orchestrated state machine</strong> rendered inline in chat. There is no checkout page — the chat IS the checkout. Each step inserts an interactive UI message kind that the user resolves in-place.</p>`,
        },
        {
          kind: "mermaid",
          caption: "Checkout state machine — five sequential steps.",
          code: `stateDiagram-v2
  [*] --> idle
  idle --> address: checkout_initiate
  address --> shipping: address_confirmed
  shipping --> payment: shipping_selected (per-merchant)
  payment --> review: payment_selected
  review --> finalized: finalize_purchase
  finalized --> [*]: order persisted, basket auto-archived

  address --> address: add_new_address (inline form)`,
        },
        {
          kind: "heading",
          level: 3,
          id: "p4-checkout-steps",
          text: "Step inventory",
        },
        {
          kind: "table",
          head: ["Step", "agentic_state", "UI kind injected", "Data source"],
          rows: [
            ["1. Address", "<code>step:'address'</code>", "<code>address-selector</code>", "<code>user_addresses</code> (re-fetched at step entry — no cache)"],
            ["2. Shipping", "<code>step:'shipping'</code>", "<code>shipping-selector</code> per merchant", "Per-merchant <code>MerchantShipping[]</code> from cart grouping"],
            ["3. Payment", "<code>step:'payment'</code>", "<code>payment-selector</code>", "Static methods (Flowpoints, Direct Debit, Card-to-Card)"],
            ["4. Review", "<code>step:'review'</code>", "<code>order-summary</code> + single CTA <em>«نهایی کردن خرید»</em>", "Composed from cart + selections"],
            ["5. Finalize", "<code>step:'finalized'</code>", "Success bubble, basket → <code>status:'finalized'</code>", "<code>orders</code> INSERT"],
          ],
        },
        {
          kind: "heading",
          level: 3,
          id: "p4-checkout-cta",
          text: "Single-CTA enforcement",
        },
        {
          kind: "prose",
          html: `<p>Only the most recent <code>order-summary</code> message renders an active <strong>«نهایی کردن خرید»</strong> button. When the cart mutates (add/remove/qty change), all prior CTAs are flagged <code>stale:true</code> and rendered as a disabled grey label "این خلاصه قدیمی است". The new summary inherits the active CTA. This prevents double-charging and confusion across edits.</p>`,
        },
        {
          kind: "code",
          lang: "ts",
          title: "Stale-CTA marker",
          code: `// useCheckoutFlow.ts
function invalidatePriorSummaries(messages: ChatMessage[]) {
  return messages.map((m) =>
    m.kind === "order-summary" && !m.payload.finalized
      ? { ...m, payload: { ...m.payload, stale: true } }
      : m,
  );
}

// Triggered on every cart mutation
useEffect(() => {
  setMessages((ms) => invalidatePriorSummaries(ms));
}, [cartHash]);`,
        },
        {
          kind: "heading",
          level: 3,
          id: "p4-checkout-finalize",
          text: "Finalize — order persistence",
        },
        {
          kind: "code",
          lang: "ts",
          title: "Order INSERT (atomic snapshot)",
          code: `const { data: order } = await supabase.from("orders").insert({
  user_id: user.id,
  order_number: generateOrderNumber(), // English digits, e.g. FC-2026-04821
  status: "processing",
  items: cartItems,                    // full snapshot, decoupled from products table
  merchant_groups: groupByMerchant(cartItems),
  delivery_address: await refetchAddress(selectedAddressId), // re-fetch, never trust cache
  payment_method: selectedPaymentId,
  subtotal,
  total_shipping,
  total_discount,
  total: subtotal + total_shipping - total_discount,
}).select().single();

// archive basket
await supabase.from("baskets")
  .update({ status: "finalized" })
  .eq("id", activeBasketId);`,
        },
        {
          kind: "callout",
          tone: "danger",
          title: "Address re-fetch is non-negotiable",
          html: `<p>The address shown in the review step is a snapshot in <code>agentic_state</code> from when the user selected it — possibly minutes ago. At finalize time we <strong>re-query</strong> <code>user_addresses</code> by id. If the user edited it in another tab, the order captures the latest version. See the <em>Order Data Integrity</em> rule.</p>`,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────
    {
      id: "p4-lifecycle",
      title: "Full Message Lifecycle (cross-cutting)",
      blocks: [
        {
          kind: "prose",
          html: `<p>Every user message — regardless of workflow — passes through the same eight-station pipeline. This is the canonical reference for debugging "why did my message do X instead of Y".</p>`,
        },
        {
          kind: "table",
          head: ["#", "Station", "Code anchor", "Failure mode"],
          rows: [
            ["1", "Capture & echo", "<code>useAgentMessages.send()</code>", "Empty input → no-op."],
            ["2", "Classify intent", "<code>supabase.functions.invoke('classify-intent')</code>", "Timeout → default to <code>discovery/product_search</code>."],
            ["3", "Mode routing", "<code>routeMode(intent)</code>", "Unknown subtype → <code>discovery</code>."],
            ["4", "SSE open", "<code>fetch(/functions/v1/gpt-commerce-agent, stream:true)</code>", "401 → re-auth prompt."],
            ["5", "Tool dispatch", "Agent edge function", "Tool call malformed → second pass without tools."],
            ["6", "Persistence", "<code>useCartPersistence</code> 1s debounce", "Network drop → retry on next mutation."],
            ["7", "Failure handling", "<code>try/catch</code> around stream reader", "Show inline retry chip; preserve user message."],
            ["8", "Logout purge", "<code>AuthContext.signOut()</code>", "Clears <code>localStorage</code> baskets to prevent leak."],
          ],
        },
      ],
    },
  ],
};
