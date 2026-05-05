import type { Part } from "./types";

export const part3Stub: Part = {
  id: "part-3",
  number: "III",
  title: "Intent Classification Engine",
  intro:
    "The cheap, deterministic gate that decides which agent mode runs. Built on Gemini 2.5 Flash Lite with a forced tool-call schema.",
  sections: [
    {
      id: "p3-why",
      title: "Why a separate classifier",
      blocks: [
        {
          kind: "prose",
          html: `<p>A single big-model call can both classify and respond, but it's slow, expensive, and brittle. Splitting classification out gives us:</p>
          <ul>
            <li><strong>Latency floor</strong> — Flash Lite returns in ~250–400ms, so we know which agent mode to enter before we pay for a streaming call.</li>
            <li><strong>Determinism</strong> — Tool-calling forces the schema; we never parse free-text intents.</li>
            <li><strong>Cost shape</strong> — Most messages are cheap; only true generative turns hit Gemini 3 Flash.</li>
            <li><strong>Local short-circuits</strong> — When the entities are unambiguous (<code>cart_add</code> with a <code>product_ref</code>), we skip the second LLM call entirely.</li>
          </ul>`,
        },
      ],
    },
    {
      id: "p3-taxonomy",
      title: "Taxonomy",
      blocks: [
        {
          kind: "table",
          head: ["intent_type", "intent_subtypes"],
          rows: [
            ["transactional", "cart_add, cart_add_by_name, cart_remove, quantity_update, checkout_initiate, checkout_direct, coupon_apply, save_for_later, cart_batch_add, cart_replace, cart_cheapest"],
            ["discovery", "product_search, product_filter, product_alternatives, product_availability"],
            ["comparison", "compare_products, compare_with_external"],
            ["info_retrieval", "product_details, order_status, return_policy, shipping_info"],
            ["conversational", "greeting, clarification, correction, thanks, help"],
          ],
        },
      ],
    },
    {
      id: "p3-schema",
      title: "Tool-call schema",
      blocks: [
        {
          kind: "code",
          lang: "json",
          title: "classify_intent function parameters",
          code: `{
  "intent_type": "transactional | discovery | comparison | info_retrieval | conversational",
  "intent_subtype": "cart_add | product_search | compare_products | ...",
  "entities": {
    "product_ref":  "1-based index into shown products (e.g. 'محصول ۲' → 2)",
    "product_name": "name/brand for fuzzy match (e.g. 'لنوو')",
    "product_refs": "[1, 3] for compare",
    "quantity":     "absolute count ('دو تا' → 2)",
    "delta":        "relative change ('یکی اضافه کن' → +1)",
    "coupon_code":  "string, if mentioned"
  },
  "confidence": "0..1"
}`,
        },
      ],
    },
    {
      id: "p3-quantity",
      title: "Quantity extraction rules",
      blocks: [
        {
          kind: "prose",
          html: `<p>Quantity is the most error-prone field because Persian mixes the number, the classifier, and the product reference into one phrase. The system prompt enumerates exact patterns:</p>`,
        },
        {
          kind: "table",
          head: ["Persian phrase", "intent_subtype", "entities"],
          rows: [
            ["دو تا از محصول شماره ۴", "cart_add", "product_ref=4, quantity=2"],
            ["سه تا از شماره ۲ بخر", "cart_add", "product_ref=2, quantity=3"],
            ["یه دونه از اولی", "cart_add", "product_ref=1, quantity=1"],
            ["محصول شماره ۴ رو اضافه کن", "cart_add", "product_ref=4, quantity=1"],
            ["دو تا از لپ تاپ لنوو بخر", "cart_add_by_name", "product_name='لنوو', quantity=2"],
            ["یکی دیگه اضافه کن", "quantity_update", "delta=+1"],
            ["یکی کم کن", "quantity_update", "delta=-1"],
            ["تعدادش رو ۳ کن", "quantity_update", "quantity=3"],
            ["بهترینشو خودت انتخاب کن و بخر", "cart_cheapest", "(model picks)"],
          ],
        },
      ],
    },
    {
      id: "p3-context",
      title: "Context injected per call",
      blocks: [
        {
          kind: "code",
          lang: "ts",
          title: "Shopping context appended to system prompt",
          code: `Shopping context:
- Cart has items: yes | no
- Products currently shown to user: <N>
- Shown product names: #1 <name>, #2 <name>, ...
- Current checkout step: idle | address | payment | review`,
        },
        {
          kind: "callout",
          tone: "info",
          title: "Why only the last 3 turns",
          html: `<p>We send <code>conversation_history.slice(-3)</code> to the classifier. More history adds tokens without measurably improving classification on Persian shopping intents.</p>`,
        },
      ],
    },
    {
      id: "p3-disambig",
      title: "Disambiguation",
      blocks: [
        {
          kind: "prose",
          html: `<p>When two products of the same brand are on screen and the user says "ایسوس رو اضافه کن", the classifier returns <code>cart_add_by_name</code> with <code>product_name="ایسوس"</code> and a low-ish confidence. The router escalates to the <code>cart_manipulation</code> agent, which renders <strong>client-side quick-reply chips</strong> ("ایسوس ROG / ایسوس Vivobook?") instead of guessing.</p>`,
        },
        {
          kind: "callout",
          tone: "idea",
          title: "Brand disambiguation is client-side",
          html: `<p>The chips are produced by matching <code>product_name</code> against the names of currently-shown products and grouping by brand prefix. No extra LLM call.</p>`,
        },
      ],
    },
    {
      id: "p3-confidence",
      title: "Confidence handling",
      blocks: [
        {
          kind: "table",
          head: ["Confidence", "Behavior"],
          rows: [
            ["≥ 0.8", "Route silently."],
            ["0.5 – 0.8", "Route, but the agent prompt is asked to confirm in prose."],
            ["< 0.5", "Treat as discovery/product_search by default; user phrasing is too ambiguous to commit."],
          ],
        },
      ],
    },
  ],
};
