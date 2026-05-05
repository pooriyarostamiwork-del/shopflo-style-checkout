import type { Part } from "./types";

export const part1Overview: Part = {
  id: "part-1",
  number: "I",
  title: "Overview & System Architecture",
  intro:
    "How the GPTCommerce AI stack is composed, and how a single Persian message travels from the chat input box to the database and back to a fully rendered agentic response.",
  sections: [
    {
      id: "p1-tldr",
      title: "TL;DR",
      blocks: [
        {
          kind: "prose",
          html: `<p>GPTCommerce is an <strong>agentic conversational commerce</strong> platform. The chat thread <em>is</em> the checkout — there is no traditional cart page, no product list page, and no checkout funnel. Every action a shopper takes (discover, compare, add, remove, address, pay) is mediated by an LLM that talks to the same Postgres database the rest of the app uses.</p>
          <p>The stack is intentionally thin: <strong>React</strong> on the client, <strong>Supabase Edge Functions</strong> (Deno) for every model call, <strong>Postgres + pgvector</strong> for the catalog, and the <strong>Lovable AI Gateway</strong> as the single egress to Google Gemini and OpenAI GPT-5 family models.</p>`,
        },
        {
          kind: "callout",
          tone: "info",
          title: "Reading map",
          html: `<p>Part I gives you the system view. Part II walks the lifecycle of one message. Part III is the intent engine. Parts IV–VII are workflow deep-dives. Part VIII is schema, security and state. Part IX is the roadmap.</p>`,
        },
      ],
    },
    {
      id: "p1-stack",
      title: "Stack at a glance",
      blocks: [
        {
          kind: "table",
          head: ["Layer", "Tech", "Where it lives"],
          rows: [
            ["Client", "React 18, Vite, Tailwind, shadcn/ui", "src/components/gpt-commerce, src/features/gpt-commerce"],
            ["Agent runtime", "Supabase Edge Functions (Deno)", "supabase/functions/gpt-commerce-agent"],
            ["Intent classifier", "Edge Function + Gemini 2.5 Flash Lite", "supabase/functions/classify-intent"],
            ["LLM gateway", "Lovable AI Gateway", "https://ai.gateway.lovable.dev/v1/chat/completions"],
            ["Catalog search", "Postgres FTS + pg_trgm + pgvector", "public.hybrid_product_search()"],
            ["Embeddings", "Supabase.ai gte-small (384-dim)", "supabase/functions/generate-embeddings"],
            ["State", "React Context + baskets table (jsonb)", "BasketContext, public.baskets"],
            ["Auth", "Kavenegar OTP → Supabase session", "supabase/functions/send-otp, verify-otp"],
          ],
        },
      ],
    },
    {
      id: "p1-architecture",
      title: "High-level architecture",
      blocks: [
        {
          kind: "mermaid",
          caption: "End-to-end request flow for a single user message.",
          code: `flowchart LR
  U[User<br/>Persian chat input] --> UI[React Chat UI<br/>useAgentMessages]
  UI -->|invoke| CI[classify-intent<br/>Edge Function]
  CI -->|tool-call JSON| GW1[Lovable AI Gateway<br/>gemini-2.5-flash-lite]
  GW1 --> CI
  CI -->|intent + entities| UI
  UI -->|route by intent| MM{Mode router}
  MM -->|discovery / comparison<br/>/ info / chat| AG[gpt-commerce-agent<br/>Edge Function]
  MM -->|cart_* intents| LOCAL[Local cart reducer<br/>BasketContext]
  AG -->|search_products tool| EMB[generate-embeddings<br/>gte-small 384-d]
  AG -->|RPC| DB[(Postgres<br/>hybrid_product_search)]
  DB --> AG
  AG -->|stream SSE| GW2[Lovable AI Gateway<br/>gemini-3-flash-preview]
  GW2 --> AG
  AG -->|tokens| UI
  UI -->|debounced 1s| BSK[(baskets table)]`,
        },
        {
          kind: "prose",
          html: `<p>Three rules govern every box on this diagram:</p>
          <ol>
            <li><strong>The client never talks to a model directly.</strong> All LLM calls go through an Edge Function so <code>LOVABLE_API_KEY</code> stays server-side and prompts can be evolved without a client deploy.</li>
            <li><strong>Search lives in Postgres, not in the LLM.</strong> The model emits a structured tool call; the database does the ranking via <code>hybrid_product_search</code>. The model only re-ranks/curates the top 20 it gets back.</li>
            <li><strong>State of record is the <code>baskets</code> row.</strong> The React context is a fast local mirror; a debounced sync writes the full conversation + cart back as a single jsonb document.</li>
          </ol>`,
        },
      ],
    },
    {
      id: "p1-edge-fns",
      title: "Edge function inventory",
      blocks: [
        {
          kind: "table",
          head: ["Function", "Role", "Model", "Streaming"],
          rows: [
            ["gpt-commerce-agent", "Main agent: discovery, comparison, info, cart_manipulation", "google/gemini-3-flash-preview", "Yes (SSE)"],
            ["classify-intent", "Routes message → intent + entities (tool-call)", "google/gemini-2.5-flash-lite", "No"],
            ["generate-embeddings", "Embeds query text for vector search", "Supabase.ai gte-small", "No"],
            ["enrich-products", "Offline catalog enrichment (specs, summaries)", "google/gemini-2.5-flash", "No"],
            ["process-csv-products / import-csv-from-storage", "Catalog ingestion pipeline", "—", "No"],
            ["scrape-digikala", "Source-of-truth scraping for catalog seeds", "—", "No"],
            ["send-otp / verify-otp", "Auth via Kavenegar Lookup + Supabase session token exchange", "—", "No"],
          ],
        },
        {
          kind: "callout",
          tone: "idea",
          title: "Two-call agent loop",
          html: `<p>Every shopping turn is at most two LLM calls: <strong>(1) classify-intent</strong> (cheap, non-streaming, tool-call) and <strong>(2) gpt-commerce-agent</strong> (streaming, may include a tool-call → DB → second LLM pass to summarize results). Cart-only intents short-circuit the second call entirely and run on the client.</p>`,
        },
      ],
    },
    {
      id: "p1-modes",
      title: "Agent modes",
      blocks: [
        {
          kind: "prose",
          html: `<p>The agent is a single edge function with <strong>five mode-specific system prompts</strong> selected by the intent type. This avoids one giant prompt that does everything badly.</p>`,
        },
        {
          kind: "table",
          head: ["Mode", "Triggered by intent_type", "Tools available", "Output shape"],
          rows: [
            ["discovery", "discovery / product_search", "search_products", "Prose + SELECTED_IDS:[…] tail"],
            ["comparison", "comparison", "get_product_details", "Prose comparison + recommendation"],
            ["info_retrieval", "info_retrieval", "(none)", "Prose answer"],
            ["conversational", "conversational (greeting, thanks, help)", "(none)", "Short prose"],
            ["cart_manipulation", "transactional (cart_*)", "execute_cart_operations", "Tool-call + Persian confirmation"],
          ],
        },
      ],
    },
    {
      id: "p1-design-rules",
      title: "Non-negotiable product rules",
      blocks: [
        {
          kind: "list",
          items: [
            "Persian-first. All UI numbers/prices use Persian digits with BiDi isolation. Order IDs/tracking stay in English.",
            "No markdown in agent output (no **bold**, no #headings). The renderer strips it defensively anyway.",
            "Suppress greetings after the first turn — every prompt carries the NO_GREETING preamble.",
            "Chat IS checkout. The cart sidebar is informational only — never has a primary CTA.",
            "Maximum one active 'Finalize Purchase' CTA at a time; older ones deactivate when the cart updates.",
            "No mock fallbacks. Empty addresses/orders render empty states, never seeded data.",
          ],
        },
      ],
    },
  ],
};
