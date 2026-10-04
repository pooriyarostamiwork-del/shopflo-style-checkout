// Returns a Telegram bot conversation (history + cart) for the PetAbad Mini App.
// Access is by the unguessable per-chat session token only.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { token } = await req.json().catch(() => ({}));
    if (typeof token !== "string" || !UUID.test(token)) return json({ error: "invalid token" }, 400);
    const { data: chat } = await db.from("telegram_chats").select("session_token,history,cart,first_name").eq("session_token", token).maybeSingle();
    if (!chat) return json({ error: "not found" }, 404);
    const cart: any[] = chat.cart || [];
    const ids = cart.map((i) => i.id);
    const { data: products } = ids.length ? await db.from("pet_products").select("*").in("id", ids) : { data: [] };
    const messages = (chat.history || []).map((m: any) => ({
      role: m.role,
      content: String(m.content || "").replace(/\n?\[محصولات نمایش داده شده:[\s\S]*\]$/, ""),
    }));
    return json({
      session_id: chat.session_token,
      first_name: chat.first_name,
      messages,
      cart: cart.map((i) => ({ qty: i.qty, product: (products || []).find((p: any) => p.id === i.id) || null })).filter((i) => i.product),
    });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
