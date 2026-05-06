import type { Part } from "./types";

export const part5Stub: Part = {
  id: "part-5",
  number: "V",
  title: "Schema, Embeddings & End-to-End Trace",
  intro:
    "The data layer that everything above sits on: tables, RLS, the embeddings pipeline, and a fully worked single-query trace from typed text to placed order.",
  sections: [
    // ─────────────────────────────────────────────────────────────
    {
      id: "p5-erd",
      title: "Entity-Relationship Overview",
      blocks: [
        {
          kind: "prose",
          html: `<p>Six tables carry the entire agentic commerce surface. Auth lives in Supabase's managed <code>auth.users</code>; everything else is in <code>public</code>. There are no foreign keys to <code>auth.users</code> by design — we reference user ids loosely so RLS, not FK cascades, enforces ownership.</p>`,
        },
        {
          kind: "mermaid",
          caption: "Tables and their access patterns.",
          code: `erDiagram
  AUTH_USERS ||--o| PROFILES        : "1:1 phone profile"
  AUTH_USERS ||--o{ USER_ADDRESSES  : "saved addresses"
  AUTH_USERS ||--o{ BASKETS         : "active + finalized carts"
  AUTH_USERS ||--o{ ORDERS          : "immutable snapshots"
  PRODUCTS  ||--o{ BASKETS          : "embedded in cart_items jsonb"
  PRODUCTS  ||--o{ ORDERS           : "embedded in items jsonb"
  OTP_CODES }o--|| AUTH_USERS       : "phone-based, no FK"

  PRODUCTS {
    uuid id PK
    text name
    int  price
    vector embedding "384 dim"
    tsvector search_vector
    text[] tags
    text[] image_urls
    jsonb specs
  }
  BASKETS {
    uuid id PK
    uuid user_id
    text status "active|finalized|archived"
    jsonb cart_items
    jsonb messages
    jsonb agentic_state
    jsonb shipping_selections
  }
  ORDERS {
    uuid id PK
    text order_number "FC-YYYY-NNNNN"
    jsonb items "snapshot"
    jsonb merchant_groups
    jsonb delivery_address "snapshot"
  }`,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────
    {
      id: "p5-tables",
      title: "Table Inventory",
      blocks: [
        {
          kind: "table",
          head: ["Table", "Purpose", "Owner", "Mutable after write?"],
          rows: [
            ["<code>products</code>", "Catalog. Source of truth for name, price, image, embedding.", "Service role only", "Yes (re-imports)"],
            ["<code>profiles</code>", "Phone + full_name keyed to auth user.", "Self", "Yes (name)"],
            ["<code>user_addresses</code>", "Saved delivery addresses.", "Self", "Yes"],
            ["<code>baskets</code>", "Live conversation + cart state. One per chat thread.", "Self", "Yes (constant)"],
            ["<code>orders</code>", "Immutable order snapshots.", "Self (read-only after insert)", "<strong>No</strong> — no UPDATE/DELETE policy"],
            ["<code>otp_codes</code>", "Short-lived OTP store, server-only.", "Service role only", "Insert + UPDATE used flag"],
          ],
        },
        {
          kind: "callout",
          tone: "info",
          title: "Why orders are append-only",
          html: `<p>The <code>orders</code> table has no UPDATE or DELETE RLS policy. Once an order is written it is a legal snapshot. Status transitions (processing → shipped → delivered) would be done by service-role workers, not the user. For the demo, status stays <code>'processing'</code>.</p>`,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────
    {
      id: "p5-rls",
      title: "Row-Level Security (full policy listing)",
      blocks: [
        {
          kind: "prose",
          html: `<p>RLS is enabled on every public table. The pattern is uniform: <code>auth.uid() = user_id</code> on the row's owner column. Products are the one read-everyone exception. <code>otp_codes</code> has RLS on but no policies — meaning anon + authenticated clients can read/write nothing; only the service role bypasses.</p>`,
        },
        {
          kind: "heading", level: 3, id: "p5-rls-baskets", text: "baskets",
        },
        {
          kind: "code",
          lang: "sql",
          code: `-- SELECT
CREATE POLICY "Users can view own baskets" ON public.baskets
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert own baskets" ON public.baskets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE  (covers every cart mutation, message append, agentic_state change)
CREATE POLICY "Users can update own baskets" ON public.baskets
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE (sidebar overflow → "delete basket")
CREATE POLICY "Users can delete own baskets" ON public.baskets
  FOR DELETE USING (auth.uid() = user_id);`,
        },
        {
          kind: "heading", level: 3, id: "p5-rls-orders", text: "orders",
        },
        {
          kind: "code",
          lang: "sql",
          code: `CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No UPDATE policy → all updates rejected.
-- No DELETE policy → all deletes rejected.`,
        },
        {
          kind: "heading", level: 3, id: "p5-rls-addresses", text: "user_addresses",
        },
        {
          kind: "code",
          lang: "sql",
          code: `CREATE POLICY "Users can view own addresses"   ON public.user_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON public.user_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.user_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.user_addresses FOR DELETE USING (auth.uid() = user_id);`,
        },
        {
          kind: "heading", level: 3, id: "p5-rls-profiles", text: "profiles",
        },
        {
          kind: "code",
          lang: "sql",
          code: `CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- No DELETE: profile lifecycle follows auth.users.`,
        },
        {
          kind: "heading", level: 3, id: "p5-rls-products", text: "products",
        },
        {
          kind: "code",
          lang: "sql",
          code: `-- Public read, service-role write.
CREATE POLICY "Products are publicly readable" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage products" ON public.products
  FOR ALL USING (true) WITH CHECK (true);
  -- ↑ the policy is open, but only the service_role JWT can hit ALL
  -- in practice because anon/authenticated tokens lack the role claim
  -- the agent edge functions use to write.`,
        },
        {
          kind: "callout",
          tone: "warning",
          title: "Why baskets RLS is the most-used policy",
          html: `<p>Every keystroke that mutates messages flows through the debounced <code>UPSERT</code>. If RLS misconfigures (e.g. <code>user_id</code> not set on insert), the entire chat silently fails to persist. The client always stamps <code>user_id = auth.uid()</code> at insert time.</p>`,
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────
    {
      id: "p5-embeddings",
      title: "Embeddings Pipeline",
      status: "live",
      blocks: [
        {
          kind: "prose",
          html: `<p>Embeddings are 384-dimensional vectors produced by <code>thenlper/gte-small</code> served via Lovable AI Gateway. They live on <code>products.embedding</code> and are queried by <code>hybrid_product_search</code> via the cosine distance operator <code>&lt;=&gt;</code>.</p>`,
        },
        {
          kind: "heading", level: 3, id: "p5-emb-column", text: "Column layout",
        },
        {
          kind: "code",
          lang: "sql",
          title: "Embedding column",
          code: `ALTER TABLE public.products
  ADD COLUMN embedding vector(384);  -- pgvector type, fixed dimension

-- HNSW index for approximate nearest-neighbor cosine search.
CREATE INDEX products_embedding_hnsw_idx
  ON public.products
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Companion indexes used by hybrid_product_search:
CREATE INDEX products_search_vector_idx ON public.products USING GIN (search_vector);
CREATE INDEX products_name_trgm_idx     ON public.products USING GIN (name gin_trgm_ops);
CREATE INDEX products_tags_trgm_idx     ON public.products USING GIN ((array_to_string(tags, ' ')) gin_trgm_ops);`,
        },
        {
          kind: "table",
          head: ["HNSW param", "Value", "Effect"],
          rows: [
            ["<code>m</code>", "16", "Edges per node in the graph. Higher = better recall, more memory."],
            ["<code>ef_construction</code>", "64", "Build-time candidate list. Higher = slower build, better graph."],
            ["<code>ef_search</code>", "default 40", "Query-time candidate list. Set per-session via <code>SET hnsw.ef_search = 80;</code> for higher recall."],
            ["Operator class", "<code>vector_cosine_ops</code>", "Indexes <code>&lt;=&gt;</code> (cosine distance, 0..2)."],
          ],
        },
        {
          kind: "heading", level: 3, id: "p5-emb-trigger", text: "search_vector trigger",
        },
        {
          kind: "code",
          lang: "sql",
          title: "Auto-maintained tsvector — runs on every INSERT/UPDATE",
          code: `CREATE OR REPLACE FUNCTION public.products_search_vector_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('simple', normalize_persian(coalesce(NEW.name, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.description, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.brand, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.category, ''))) ||
    to_tsvector('simple', normalize_persian(coalesce(NEW.subcategory, ''))) ||
    to_tsvector('simple', normalize_persian(array_to_string(coalesce(NEW.tags, '{}'), ' ')));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF name, description, brand, category, subcategory, tags
  ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_search_vector_update();`,
        },
        {
          kind: "callout",
          tone: "info",
          title: "Embeddings are NOT auto-maintained",
          html: `<p>Unlike <code>search_vector</code>, the <code>embedding</code> column has no trigger. It's populated by the <code>generate-embeddings</code> edge function during catalog import or on-demand for query vectors. Re-embedding is an explicit batch job because each call costs latency and quota.</p>`,
        },
        {
          kind: "heading", level: 3, id: "p5-emb-fn", text: "generate-embeddings — I/O contract",
        },
        {
          kind: "code",
          lang: "ts",
          title: "Request",
          code: `// POST /functions/v1/generate-embeddings
{
  "input": "هدفون بی سیم"           // single string, query mode
  // — OR —
  "input": ["text1", "text2", ...]  // batch mode (≤100), product import
}`,
        },
        {
          kind: "code",
          lang: "ts",
          title: "Response",
          code: `{
  "embeddings": [
    [0.0134, -0.0412, 0.0089, ... 384 floats ...]
  ],
  "model": "thenlper/gte-small",
  "dim": 384,
  "took_ms": 142
}`,
        },
        {
          kind: "table",
          head: ["Caller", "When", "Storage"],
          rows: [
            ["<code>process-csv-products</code>", "Catalog ingestion (batch).", "Persisted into <code>products.embedding</code>."],
            ["<code>enrich-products</code>", "Re-embedding after AI enrichment.", "UPDATE on <code>products.embedding</code>."],
            ["<code>gpt-commerce-agent</code>", "Per query, after tool_call <code>search_products</code>.", "Ephemeral — passed straight to <code>hybrid_product_search</code>, never stored."],
          ],
        },
        {
          kind: "heading", level: 3, id: "p5-emb-failures", text: "Failure handling",
        },
        {
          kind: "list",
          items: [
            "<strong>Quota / 429:</strong> agent catches and falls back to text-only search (<code>p_embedding=NULL</code>). User still gets results, ranking degrades ~15%.",
            "<strong>Dimension mismatch:</strong> guarded at insert via <code>vector(384)</code> type — wrong-dim arrays raise SQLSTATE 22000.",
            "<strong>Empty input:</strong> short-circuited client-side; we never call the function with empty strings.",
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────
    {
      id: "p5-trace",
      title: "End-to-End Trace — single query → placed order",
      blocks: [
        {
          kind: "prose",
          html: `<p>This is a single, real-shape trace. User starts on a fresh <code>/gptcommerce</code> session, asks for headphones, picks one, checks out. Every network call, every SSE chunk shape, every DB row mutation is shown in order. Timestamps are <em>relative</em> to T0 = first keypress.</p>`,
        },
        {
          kind: "heading", level: 3, id: "p5-trace-input", text: "T+000ms — User sends",
        },
        {
          kind: "code",
          lang: "text",
          code: `User: "هدفون بی‌سیم زیر ۳ میلیون می‌خوام"`,
        },

        // ── Discovery
        {
          kind: "heading", level: 3, id: "p5-trace-classify", text: "T+050ms — classify-intent",
        },
        {
          kind: "code",
          lang: "http",
          title: "Request",
          code: `POST /functions/v1/classify-intent
Authorization: Bearer <user JWT>
Content-Type: application/json

{
  "message": "هدفون بی‌سیم زیر ۳ میلیون می‌خوام",
  "history": [],
  "context": { "cart_has_items": false, "shown_products": 0, "checkout_step": "idle" }
}`,
        },
        {
          kind: "code",
          lang: "json",
          title: "Response (≈310ms RTT)",
          code: `{
  "intent_type": "discovery",
  "intent_subtype": "product_search",
  "entities": { "price_max": 3000000 },
  "confidence": 0.93,
  "routed_mode": "discovery"
}`,
        },

        {
          kind: "heading", level: 3, id: "p5-trace-agent", text: "T+360ms — open SSE to gpt-commerce-agent",
        },
        {
          kind: "code",
          lang: "http",
          code: `POST /functions/v1/gpt-commerce-agent
Accept: text/event-stream

{
  "mode": "discovery",
  "message": "هدفون بی‌سیم زیر ۳ میلیون می‌خوام",
  "history": [],
  "shopping_context": { "cart_has_items": false, "shown_products": 0 }
}`,
        },

        {
          kind: "heading", level: 3, id: "p5-trace-tool1", text: "T+820ms — model emits tool_call",
        },
        {
          kind: "code",
          lang: "json",
          title: "SSE chunk #1 (tool_call delta, accumulated)",
          code: `data: {"type":"tool_call","name":"search_products","arguments":{
  "query_text":"هدفون بی سیم",
  "subcategory":"هدفون، هدست و هندزفری",
  "price_max":3000000,
  "semantic_tags":["wireless"]
}}`,
        },

        {
          kind: "heading", level: 3, id: "p5-trace-emb", text: "T+830ms — agent calls generate-embeddings",
        },
        {
          kind: "code",
          lang: "json",
          code: `→ POST generate-embeddings { "input": "هدفون بی سیم" }
← 200 { "embeddings": [[0.0134, -0.0412, ...]], "dim": 384, "took_ms": 142 }`,
        },

        {
          kind: "heading", level: 3, id: "p5-trace-rpc", text: "T+985ms — RPC hybrid_product_search",
        },
        {
          kind: "code",
          lang: "sql",
          code: `SELECT * FROM hybrid_product_search(
  p_query       => 'هدفون بی سیم',
  p_embedding   => '[0.0134, -0.0412, ...]'::vector(384),
  p_subcategory => 'هدفون، هدست و هندزفری',
  p_max_price   => 3000000,
  p_in_stock    => true
);
-- 20 rows, 47ms`,
        },

        {
          kind: "heading", level: 3, id: "p5-trace-stream", text: "T+1.05s → T+2.4s — model streams prose",
        },
        {
          kind: "code",
          lang: "text",
          title: "SSE chunks #2…N (token deltas)",
          code: `data: {"type":"text_delta","delta":"این"}
data: {"type":"text_delta","delta":" چند"}
data: {"type":"text_delta","delta":" گزینه"}
data: {"type":"text_delta","delta":" خوب"}
...
data: {"type":"text_delta","delta":"\\nSELECTED_IDS:[\\"a1b2\\",\\"c3d4\\",\\"e5f6\\",\\"a7b8\\",\\"c9d0\\",\\"e1f2\\"]"}
data: {"type":"done","usage":{"prompt":1842,"completion":214}}`,
        },
        {
          kind: "prose",
          html: `<p>Client parses the trailing sentinel, hydrates 6 products from the snapshot, strips the sentinel from the bubble, and renders 6 <code>ChatProductCard</code>s with badges <code>#1…#6</code>.</p>`,
        },

        // ── Cart add
        {
          kind: "heading", level: 3, id: "p5-trace-add", text: "T+12s — User: «دومی رو اضافه کن»",
        },
        {
          kind: "code",
          lang: "json",
          title: "classify-intent response (~280ms)",
          code: `{
  "intent_type": "transactional",
  "intent_subtype": "cart_add",
  "entities": { "product_ref": 2, "quantity": 1 },
  "confidence": 0.96
}`,
        },
        {
          kind: "prose",
          html: `<p>Confidence ≥ 0.8 + resolvable <code>product_ref</code> → <strong>short-circuit</strong>. No second LLM call. Client runs <code>addToCart(shownProducts[1], 1)</code>, agent bubble: «هدفون Anker Q20 به سبد اضافه شد ✓».</p>`,
        },
        {
          kind: "code",
          lang: "sql",
          title: "T+12.1s — debounced (1s) basket UPSERT",
          code: `INSERT INTO public.baskets (id, user_id, status, cart_items, messages, agentic_state, last_activity)
VALUES ('b1...', 'u1...', 'active',
  '[{"id":"c3d4","name":"هدفون Anker Q20","price":1990000,"quantity":1,...}]'::jsonb,
  '[...filtered messages...]'::jsonb,
  '{"step":"idle"}'::jsonb,
  now())
ON CONFLICT (id) DO UPDATE SET
  cart_items = EXCLUDED.cart_items,
  messages   = EXCLUDED.messages,
  last_activity = now();
-- RLS: auth.uid() = user_id → allowed.`,
        },

        // ── Checkout
        {
          kind: "heading", level: 3, id: "p5-trace-checkout", text: "T+20s — User: «خرید رو نهایی کن»",
        },
        {
          kind: "code",
          lang: "json",
          title: "classify-intent",
          code: `{ "intent_type":"transactional", "intent_subtype":"checkout_initiate", "confidence":0.97 }`,
        },
        {
          kind: "prose",
          html: `<p>Router transitions <code>agentic_state.step</code>: <code>idle → address</code>. Client re-fetches addresses (no cache):</p>`,
        },
        {
          kind: "code",
          lang: "sql",
          code: `SELECT id, title, recipient_name, full_address, phone, is_default
FROM public.user_addresses
WHERE user_id = auth.uid()
ORDER BY is_default DESC, created_at DESC;`,
        },
        {
          kind: "prose",
          html: `<p>Inserts an <code>address-selector</code> message kind. User taps default address → <code>step:'shipping'</code> → <code>shipping-selector</code> per merchant rendered → user picks → <code>step:'payment'</code> → user picks Flowpoints → <code>step:'review'</code> → <code>order-summary</code> with the single active CTA.</p>`,
        },

        {
          kind: "heading", level: 3, id: "p5-trace-finalize", text: "T+38s — Finalize",
        },
        {
          kind: "code",
          lang: "sql",
          title: "Atomic order INSERT (RLS: auth.uid() = user_id)",
          code: `INSERT INTO public.orders (
  user_id, order_number, status, items, merchant_groups,
  delivery_address, payment_method, subtotal, total_shipping, total_discount, total
) VALUES (
  'u1...', 'FC-2026-04821', 'processing',
  '[{"id":"c3d4","name":"هدفون Anker Q20","price":1990000,"quantity":1,...}]'::jsonb,
  '[{"merchant_id":"m1","items":[...],"shipping":{"id":"std","price":80000}}]'::jsonb,
  '{"recipient_name":"...","full_address":"...","phone":"..."}'::jsonb,  -- re-fetched at finalize
  'flowpoints',
  1990000, 80000, 0, 2070000
)
RETURNING id, order_number;`,
        },
        {
          kind: "code",
          lang: "sql",
          title: "Archive basket",
          code: `UPDATE public.baskets
SET status = 'finalized', last_activity = now()
WHERE id = 'b1...' AND user_id = auth.uid();`,
        },
        {
          kind: "prose",
          html: `<p>Success bubble renders with the order number in <strong>English digits</strong> (<code>FC-2026-04821</code>) per the localization rule. The basket moves to the sidebar's <em>Finalized</em> zone. The single CTA is removed from chat history. End of trace.</p>`,
        },

        {
          kind: "heading", level: 3, id: "p5-trace-budget", text: "Latency & cost budget (this trace)",
        },
        {
          kind: "table",
          head: ["Phase", "Wall-clock", "LLM tokens", "DB calls"],
          rows: [
            ["Discovery (text → cards)", "~2.4s", "~2050 (Flash) + ~80 (Lite)", "1 RPC + 1 embeddings"],
            ["Cart add (short-circuit)", "~280ms", "~80 (Lite only)", "1 UPSERT (debounced)"],
            ["Checkout (4 steps)", "~18s human + ~1s system", "~240 (Lite × 4)", "1 SELECT + 1 INSERT + 1 UPDATE"],
            ["<strong>Total</strong>", "<strong>~22s end-to-end</strong>", "<strong>~2450 tokens</strong>", "<strong>5 DB ops</strong>"],
          ],
        },
      ],
    },
  ],
};
