// Returns a Telegram bot conversation (history + cart) for the PetAbad Mini App.
// Access is by the unguessable per-chat session token only.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { mintPhoneSession, verifyInitData } from "../_shared/telegramAuth.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { token, action, order_number, init_data } = await req.json().catch(() => ({}));
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
    const tgUser = BOT_TOKEN ? await verifyInitData(init_data, BOT_TOKEN) : null;
    // SSO: only a verified Telegram user whose own chat carries a confirmed phone gets a login session.
    const authFor = async (c: { chat_id?: number; phone?: string | null } | null) => {
      if (!c?.phone || !tgUser || tgUser !== Number(c.chat_id)) return null;
      const s = await mintPhoneSession(db, c.phone);
      if (s) await db.from("telegram_chats").update({ user_id: s.user_id }).eq("chat_id", c.chat_id!);
      return s ? { access_token: s.access_token, refresh_token: s.refresh_token } : null;
    };

    // History sheet opened from the bot keyboard: identified by signed initData only.
    if (action === "history") {
      if (!tgUser) return json({ error: "unauthorized" }, 401);
      const { data: c } = await db.from("telegram_chats").select("chat_id,phone,session_token,history,cart,archived,updated_at").eq("chat_id", tgUser).maybeSingle();
      if (!c) return json({ items: [], auth: null });
      const live = (c.history || []).length || (c.cart || []).length ? [{
        token: c.session_token, title: String((c.history || []).find((m: any) => m.role === "user")?.content || "گفتگوی فعلی").slice(0, 40),
        reason: "live", ended_at: c.updated_at, count: (c.cart || []).reduce((s: number, i: any) => s + i.qty, 0),
      }] : [];
      const items = [...live, ...(c.archived || []).map((a: any) => ({ token: a.token, title: a.title, reason: a.reason, ended_at: a.ended_at, count: a.count || 0 }))];
      return json({ items, auth: await authFor(c) });
    }
    if (typeof token !== "string" || !UUID.test(token)) return json({ error: "invalid token" }, 400);

    // Checkout finished in the Mini App: archive this conversation, send the receipt and
    // automatically open (and pin) a fresh session for the next purchase.
    if (action === "complete") {
      const num = typeof order_number === "string" ? order_number.slice(0, 40).replace(/[<>&]/g, "") : "";
      const { data: live } = await db.from("telegram_chats").select("*").eq("session_token", token).maybeSingle();
      if (!live) return json({ ok: false });
      const hist: any[] = live.history || [];
      const first = hist.find((m) => m.role === "user")?.content || "گفتگوی تلگرام";
      const archived = [{
        token, title: String(first).slice(0, 40), reason: "completed", ended_at: new Date().toISOString(),
        count: (live.cart || []).reduce((s: number, i: any) => s + i.qty, 0),
        history: hist, cart: live.cart || [], last_products: live.last_products || [],
      }, ...(live.archived || [])].slice(0, 10);
      await db.from("telegram_chats").update({
        session_token: crypto.randomUUID(), history: [], cart: [], last_products: [], locked: false,
        pending_text: null, archived, updated_at: new Date().toISOString(),
      }).eq("chat_id", live.chat_id);
      const BOT = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (BOT) {
        const tg = (m: string, body: unknown) => fetch(`https://api.telegram.org/bot${BOT}/${m}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        }).then((r) => r.json()).catch((e) => { console.error(m, e); return {}; });
        const KB = { keyboard: [[{ text: "🛒 سبد خرید" }, { text: "📜 گفتگوها", web_app: { url: "https://flowcart.space/petabad?view=history" } }, { text: "✨ گفتگوی جدید" }]], resize_keyboard: true, is_persistent: true };
        await tg("sendMessage", { chat_id: live.chat_id, parse_mode: "HTML", text: `سفارشت با موفقیت ثبت شد 🎉${num ? `\nکد پیگیری: <code>${num}</code>` : ""}` });
        const date = new Date().toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" });
        const r: any = await tg("sendMessage", {
          chat_id: live.chat_id, parse_mode: "HTML", reply_markup: KB,
          text: `📌 <b>گفتگوی جدید شروع شد ✨</b>\n🕒 ${date}\nسفارش قبلی‌ات ثبت و توی «📜 گفتگوها» ذخیره شد؛ از این‌جا به بعد یه گفتگوی تازه‌ست. برای خرید بعدی فقط بنویس دنبال چی هستی.`,
        });
        if (r?.ok) {
          await tg("unpinAllChatMessages", { chat_id: live.chat_id });
          await tg("pinChatMessage", { chat_id: live.chat_id, message_id: r.result.message_id, disable_notification: true });
        }
      }
      return json({ ok: true });
    }

    let { data: chat } = await db.from("telegram_chats").select("session_token,history,cart,first_name,chat_id,phone").eq("session_token", token).maybeSingle();
    if (!chat) {
      // Archived conversation (expired, completed or switched away from).
      const { data: owner } = await db.from("telegram_chats").select("first_name,archived,chat_id,phone").contains("archived", [{ token }]).maybeSingle();
      const entry = (owner?.archived || []).find((a: any) => a.token === token);
      if (entry) chat = { session_token: token, history: entry.history || [], cart: entry.cart || [], first_name: owner!.first_name, chat_id: owner!.chat_id, phone: owner!.phone };
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
      auth: await authFor(chat),
      messages,
      cart: cart.map((i) => ({ qty: i.qty, product: (products || []).find((p: any) => p.id === i.id) || null })).filter((i) => i.product),
    });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
