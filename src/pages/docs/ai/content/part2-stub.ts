import type { Part } from "./types";

export const part2Stub: Part = {
  id: "part-2",
  number: "II",
  title: "Lifecycle of a Message",
  intro:
    "What happens between the user pressing Enter and the assistant message appearing — every hop, every payload, every fallback.",
  sections: [
    {
      id: "p2-overview",
      title: "The eight phases",
      blocks: [
        {
          kind: "mermaid",
          caption: "Sequence of one shopping turn (discovery path).",
          code: `sequenceDiagram
  participant U as User
  participant H as useAgentMessages
  participant CI as classify-intent
  participant R as Mode Router
  participant AG as gpt-commerce-agent
  participant EM as generate-embeddings
  participant DB as Postgres
  participant GW as AI Gateway
  participant BSK as baskets table

  U->>H: Send message
  H->>H: Append user msg, set isStreaming
  H->>CI: invoke({message, history, context})
  CI->>GW: gemini-2.5-flash-lite + classify_intent tool
  GW-->>CI: tool_call args
  CI-->>H: {intent_type, intent_subtype, entities, confidence}
  H->>R: route(intent)
  R->>AG: stream({mode, message, history, cart, recommended})
  AG->>EM: embed(query_text)
  EM-->>AG: vector(384)
  AG->>DB: rpc hybrid_product_search(...)
  DB-->>AG: top 20 products
  AG->>GW: gemini-3-flash-preview (stream=true)
  GW-->>AG: SSE deltas
  AG-->>H: SSE deltas
  H->>H: upsertAssistant(chunk)
  H->>BSK: debounced upsert(messages, cart)`,
        },
      ],
    },
    {
      id: "p2-phase1",
      title: "Phase 1 — Capture and pre-flight",
      blocks: [
        {
          kind: "prose",
          html: `<p>The chat input is a controlled component inside <code>ChatInput.tsx</code>. On submit, <code>useAgentMessages.send(text)</code> is called. It performs three synchronous side-effects before any network I/O:</p>
          <ol>
            <li>Append the user message to the local <code>messages</code> array (so the UI updates immediately).</li>
            <li>Set <code>isStreaming = true</code> to disable the input and show a typing indicator.</li>
            <li>Compute a fresh <code>context</code> snapshot: <code>has_cart_items</code>, <code>last_recommended_count</code>, <code>last_recommended_names[]</code>, <code>checkout_step</code>.</li>
          </ol>`,
        },
        {
          kind: "code",
          lang: "ts",
          title: "useAgentMessages.send (shape)",
          code: `async function send(text: string) {
  const userMsg = { role: "user", content: text };
  setMessages((m) => [...m, userMsg]);
  setIsStreaming(true);

  const context = {
    has_cart_items: cart.items.length > 0,
    last_recommended_count: lastRecommended.length,
    last_recommended_names: lastRecommended.map((p) => p.name),
    checkout_step: agenticState.step,
  };

  const intent = await classifyIntent(text, last3(messages), context);
  await routeByIntent(intent, text);
}`,
        },
      ],
    },
    {
      id: "p2-phase2",
      title: "Phase 2 — Intent classification",
      blocks: [
        {
          kind: "prose",
          html: `<p>The client invokes <code>classify-intent</code> via <code>supabase.functions.invoke</code>. The function is non-streaming and uses <strong>tool calling</strong> to force a structured JSON response — no string parsing.</p>`,
        },
        {
          kind: "code",
          lang: "ts",
          title: "Forced tool-call (excerpt of classify-intent)",
          code: `body: JSON.stringify({
  model: "google/gemini-2.5-flash-lite",
  messages,
  tools: [CLASSIFY_TOOL],
  tool_choice: { type: "function", function: { name: "classify_intent" } },
}),`,
        },
        {
          kind: "callout",
          tone: "warning",
          title: "Fallback policy",
          html: `<p>If the classifier 4xx/5xx, returns no tool call, or yields invalid JSON, the function returns <code>{ intent_type: "discovery", intent_subtype: "product_search", entities: {}, confidence: 0.3 }</code>. The router treats <code>confidence &lt; 0.5</code> as a soft signal but still routes — never blocks the user.</p>`,
        },
      ],
    },
    {
      id: "p2-phase3",
      title: "Phase 3 — Mode routing",
      blocks: [
        {
          kind: "prose",
          html: `<p>The router is a pure function on <code>intent_type</code> and <code>intent_subtype</code>. Cart subtypes (<code>cart_add</code>, <code>cart_remove</code>, <code>quantity_update</code>, <code>cart_batch_add</code>, <code>cart_cheapest</code>, <code>cart_replace</code>) are handled either by a <strong>local reducer</strong> (when entities are unambiguous) or by a <strong>cart_manipulation</strong> agent call (when the model needs to disambiguate or batch).</p>`,
        },
        {
          kind: "table",
          head: ["intent_type", "Path", "Notes"],
          rows: [
            ["transactional + product_ref present", "Local reducer", "Zero-latency add/remove. No LLM."],
            ["transactional + ambiguous", "agent (cart_manipulation)", "Model resolves with execute_cart_operations tool."],
            ["discovery", "agent (discovery)", "search_products tool → DB → curated prose."],
            ["comparison", "agent (comparison)", "get_product_details on multiple IDs."],
            ["info_retrieval", "agent (info_retrieval)", "Pure prose, no tools."],
            ["conversational", "agent (conversational)", "Short prose."],
          ],
        },
      ],
    },
    {
      id: "p2-phase4",
      title: "Phase 4 — Streaming the response",
      blocks: [
        {
          kind: "prose",
          html: `<p>The agent edge function proxies the SSE stream from the gateway directly to the client. The client parses SSE line-by-line — never <code>split("\\n\\n")</code> — and re-buffers any partial JSON across chunks.</p>`,
        },
        {
          kind: "code",
          lang: "ts",
          title: "SSE parsing loop (client)",
          code: `while (!streamDone) {
  const { done, value } = await reader.read();
  if (done) break;
  textBuffer += decoder.decode(value, { stream: true });

  let nl;
  while ((nl = textBuffer.indexOf("\\n")) !== -1) {
    let line = textBuffer.slice(0, nl);
    textBuffer = textBuffer.slice(nl + 1);
    if (line.endsWith("\\r")) line = line.slice(0, -1);
    if (line.startsWith(":") || !line.startsWith("data: ")) continue;

    const json = line.slice(6).trim();
    if (json === "[DONE]") { streamDone = true; break; }
    try {
      const parsed = JSON.parse(json);
      const content = parsed.choices?.[0]?.delta?.content;
      if (content) onDelta(content);
    } catch {
      textBuffer = line + "\\n" + textBuffer; // re-buffer partial
      break;
    }
  }
}`,
        },
      ],
    },
    {
      id: "p2-phase5",
      title: "Phase 5 — Tool calls inside the stream",
      blocks: [
        {
          kind: "prose",
          html: `<p>For discovery, the first model pass emits a <code>search_products</code> tool call. The agent function:</p>
          <ol>
            <li>Calls <code>generate-embeddings</code> to embed <code>query_text</code> (gte-small, 384-d).</li>
            <li>Runs <code>supabase.rpc("hybrid_product_search", {...})</code> with the embedding plus structured filters.</li>
            <li>Sends the tool result back into the gateway as a follow-up message and re-streams the model's curated prose.</li>
          </ol>
          <p>The model finishes its prose with <code>SELECTED_IDS:["uuid", ...]</code> on a new line. The client parses that tail to render product cards in the same order they appear in the text.</p>`,
        },
      ],
    },
    {
      id: "p2-phase6",
      title: "Phase 6 — Persistence",
      blocks: [
        {
          kind: "prose",
          html: `<p>After every successful turn (or every 1s while streaming, debounced), the basket context upserts the entire basket row: <code>messages</code>, <code>cart_items</code>, <code>agentic_state</code>, <code>shipping_selections</code>, <code>selected_address_id</code>. UI-only message components are filtered out before serialization to keep the row small and avoid leaking React refs.</p>`,
        },
      ],
    },
    {
      id: "p2-phase7",
      title: "Phase 7 — Failure modes",
      blocks: [
        {
          kind: "table",
          head: ["Failure", "User-visible behavior", "Recovery"],
          rows: [
            ["Gateway 429 (rate)", "Toast: 'لطفاً کمی صبر کنید'", "Auto-retry once after 2s"],
            ["Gateway 402 (credit)", "Toast: 'اعتبار سرویس تمام شده'", "Surface to admin; no retry"],
            ["Edge fn 5xx", "Generic Persian error toast", "Message stays in input for re-send"],
            ["DB rpc error", "Empty product list + apology prose", "Logged server-side"],
            ["SSE mid-stream drop", "Partial assistant message preserved", "User can ask 'ادامه بده'"],
          ],
        },
      ],
    },
    {
      id: "p2-phase8",
      title: "Phase 8 — Logout / session purge",
      blocks: [
        {
          kind: "prose",
          html: `<p>On logout the client calls <code>purgeBasketState()</code> which clears <code>localStorage</code> keys, resets every React context to its initial value, and unsubscribes from realtime channels. This prevents cross-user leakage when the same browser logs in as a different account.</p>`,
        },
      ],
    },
  ],
};
