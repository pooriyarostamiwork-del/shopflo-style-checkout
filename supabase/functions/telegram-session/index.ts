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
    const { token, action, order_number } = await req.json().catch(() => ({}));
    if (typeof token !== "string" || !UUID.test(token)) return json({ error: "invalid token" }, 400);

    // Checkout finished in the Mini App: lock the bot conversation and send the receipt.
    if (action === "complete") {
      const num = typeof order_number === "string" ? order_number.slice(0, 40) : "";
      const { data: live } = await db.from("telegram_chats").select("chat_id,cart,locked").eq("session_token", token).maybeSingle();
      if (!live) return json({ ok: false });
      if (!live.locked) {
        await db.from("telegram_chats").update({ locked: true, updated_at: new Date().toISOString() }).eq("chat_id", live.chat_id);
        const BOT = Deno.env.get("TELEGRAM_BOT_TOKEN");
        if (BOT) {
          await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: live.chat_id,
              parse_mode: "HTML",
              text: `سفارشت با موفقیت ثبت شد 🎉${num ? `\nکد پیگیری: <code>${num.replace(/[<>&]/g, "")}</code>` : ""}\n\nاین گفتگو نهایی شد. برای سفارش یا سؤال جدید، یه گفتگوی تازه شروع کن.`,
              reply_markup: { inline_keyboard: [[{ text: "➕ شروع گفتگوی جدید", callback_data: "new" }], [{ text: "📜 سابقه گفتگوها", callback_data: "history" }]] },
            }),
          }).catch((e) => console.error("notify failed", e));
        }
      }
      return json({ ok: true });
    }

    let { data: chat } = await db.from("telegram_chats").select("session_token,history,cart,first_name").eq("session_token", token).maybeSingle();
    if (!chat) {
      // Archived conversation (expired, completed or switched away from).
      const { data: owner } = await db.from("telegram_chats").select("first_name,archived").contains("archived", [{ token }]).maybeSingle();
      const entry = (owner?.archived || []).find((a: any) => a.token === token);
      if (entry) chat = { session_token: token, history: entry.history || [], cart: entry.cart || [], first_name: owner!.first_name };
    }
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
