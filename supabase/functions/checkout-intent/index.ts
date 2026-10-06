// Typed decision for a free-text reply while a checkout step is open (Jev, System One).
// Replaces fixed word lists: «حله بفرست»، «ردیفه بریم»، «با درگاه بزن» are judged in context.
// Never invents a decision: on any failure or low confidence it answers "unsure" and the
// caller falls back to the normal agent path.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const Body = z.object({
  step: z.enum(["cart-confirmation", "address-confirmation", "payment-selection"]),
  message: z.string().min(1).max(500),
  payments: z.array(z.object({ id: z.string().max(40), label: z.string().max(80) })).max(10).optional(),
  cart: z.array(z.string().max(160)).max(30).optional(),
});

const MIN_CONFIDENCE = 0.6;
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function questionFor(step: string, payments: { id: string; label: string }[]) {
  const other = "Anything else: a question, a product request, changing/removing items, hesitation, or a reply that does not clearly approve moving on.";
  if (step === "cart-confirmation") {
    return {
      type: "choice",
      instructions: "The shopper was shown their cart summary and asked to approve it before choosing address and shipping. In `message` (casual Persian), do they approve the cart and want to proceed to the next checkout step?",
      criteria: {
        confirm: { includes: "Any approval or go-ahead in any wording, slang or typo (e.g. اوکیه، حله، ردیفه بریم، همینو بفرست، بریم سراغ تسویه، آره).", excludes: "Approval combined with a change request to the cart." },
        other,
      },
    };
  }
  if (step === "address-confirmation") {
    return {
      type: "choice",
      instructions: "The shopper sees their selected delivery address and shipping method and is asked to confirm and continue to payment. In `message` (casual Persian), do they simply approve continuing with the current selection?",
      criteria: {
        confirm: { includes: "A plain go-ahead in any wording (e.g. اوکی، همین خوبه، بریم پرداخت).", excludes: "Naming a different address, a new address, or a different shipping method." },
        other,
      },
    };
  }
  const criteria: Record<string, unknown> = {};
  for (const p of payments) criteria[`pay:${p.id}`] = `The shopper chooses to pay with «${p.label}».`;
  criteria.other = "No single payment method is clearly chosen (a question about methods, hesitation, or anything else).";
  return {
    type: "choice",
    instructions: "The shopper is at the payment step. Which payment method does `message` (casual Persian) clearly choose, if any? A question like «با درگاه می‌زنی؟» that asks to use a method counts as choosing it.",
    criteria,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const { step, message, payments = [], cart = [] } = parsed.data;
  if (step === "payment-selection" && !payments.length) return json({ decision: "unsure" });

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return json({ decision: "unsure", error: "not_configured" });

  const started = Date.now();
  const res = await fetch("https://ai.gateway.lovable.dev/v1/systemone", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "typesafe/jev-latest",
      state: { checkout_step: step, cart_items: cart, message },
      questions: { intent: questionFor(step, payments) },
    }),
  }).catch((e) => { console.error("jev fetch failed", e); return null; });

  if (!res) return json({ decision: "unsure" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("jev status", res.status, text.slice(0, 300));
    // Status is preserved for the log; the shopper path always falls back to the agent.
    return json({ decision: "unsure", status: res.status });
  }
  const data = await res.json().catch(() => null);
  const ans = data?.answers?.intent;
  const choice = typeof ans?.choice === "string" ? ans.choice : null;
  const confidence = typeof ans?.confidence === "number" ? ans.confidence : 0;
  const prob = choice && typeof ans?.probabilities?.[choice] === "number" ? ans.probabilities[choice] : 0;
  const decision = choice && choice !== "other" && confidence >= MIN_CONFIDENCE ? choice : "unsure";
  console.log("checkout-intent", JSON.stringify({ step, message, choice, prob, confidence, decision, ms: Date.now() - started }));
  return json({ decision, choice, confidence, probability: prob });
});
