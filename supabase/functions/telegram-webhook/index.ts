// Telegram bot (@Flowcartbot) webhook: routes chat messages to the
// gpt-commerce-agent and replies with Persian text, photo product cards,
// inline add-to-cart buttons and reply-keyboard quick replies.
import { createClient } from "npm:@supabase/supabase-js@2";

const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://flowcart.space";
const API = `https://api.telegram.org/bot${TOKEN}`;
const db = createClient(SUPABASE_URL, SERVICE_KEY);

const fa = (n: number | string) => String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
const price = (n: number) => `${fa(Math.round(n).toLocaleString("en-US"))} تومان`;
const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stripMd = (s: string) => String(s ?? "").replace(/\*\*|__|#+\s?|`/g, "");

async function tg(method: string, body: unknown) {
  const r = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) console.error(`telegram ${method} failed`, JSON.stringify(j));
  return j;
}

async function deriveSecret() {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`telegram-webhook:${TOKEN}`));
  return btoa(String.fromCharCode(...new Uint8Array(d))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const MAIN_KB = {
  keyboard: [
    [{ text: "🛒 سبد خرید من" }, { text: "✨ چی پیشنهاد می‌دی؟" }],
    [{ text: "📱 ارسال شماره تماس", request_contact: true }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

async function loadChat(chatId: number, from: any) {
  const { data } = await db.from("telegram_chats").select("*").eq("chat_id", chatId).maybeSingle();
  if (data) return data;
  const row = { chat_id: chatId, username: from?.username ?? null, first_name: from?.first_name ?? null, history: [], cart: [] };
  await db.from("telegram_chats").insert(row);
  return row;
}
const saveChat = (chatId: number, patch: Record<string, unknown>) =>
  db.from("telegram_chats").update({ ...patch, updated_at: new Date().toISOString() }).eq("chat_id", chatId);

async function sendCart(chatId: number, cart: any[]) {
  if (!cart.length) return tg("sendMessage", { chat_id: chatId, text: "سبد خریدت فعلاً خالیه. بگو دنبال چی هستی تا پیدا کنم 🙂", reply_markup: MAIN_KB });
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const lines = cart.map((i, k) => `${fa(k + 1)}. ${esc(i.name)} × ${fa(i.qty)} — ${price(i.price * i.qty)}`);
  return tg("sendMessage", {
    chat_id: chatId,
    parse_mode: "HTML",
    text: `<b>سبد خرید تو</b>\n\n${lines.join("\n")}\n\n<b>جمع کل:</b> ${price(total)}`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ نهایی کردن خرید", url: `${SITE}/gptcommerce` }],
        [{ text: "🗑 خالی کردن سبد", callback_data: "clear" }],
      ],
    },
  });
}

async function handleText(chatId: number, from: any, text: string) {
  const chat = await loadChat(chatId, from);

  if (text.startsWith("/start")) {
    const payload = text.split(" ")[1];
    await tg("sendMessage", {
      chat_id: chatId,
      text: `سلام ${from?.first_name ?? ""}! 👋 من دستیار خرید فلوکارت هستم.\n\nبگو دنبال چی می‌گردی (مثلاً «یه هدفون بی‌سیم خوب زیر ۵ میلیون») تا بهترین گزینه‌ها رو برات پیدا کنم.`,
      reply_markup: MAIN_KB,
    });
    if (payload?.startsWith("p_")) text = `درباره محصول ${payload.slice(2)} توضیح بده`;
    else return;
  }
  if (text === "/cart" || text === "🛒 سبد خرید من") return sendCart(chatId, chat.cart || []);

  await tg("sendChatAction", { chat_id: chatId, action: "typing" });
  const history = [...(chat.history || []), { role: "user", content: text }].slice(-12);

  const res = await fetch(`${SUPABASE_URL}/functions/v1/gpt-commerce-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({
      messages: history,
      is_first_message: history.length <= 1,
      cart_context: (chat.cart || []).map((i: any) => ({ id: i.id, name: i.name, quantity: i.qty })),
    }),
  });
  if (!res.ok) {
    console.error("agent failed", res.status, await res.text());
    return tg("sendMessage", { chat_id: chatId, text: "یه لحظه مشکلی پیش اومد، دوباره امتحان کن 🙏" });
  }
  const ans = await res.json();
  const content = stripMd(ans.content || "");
  const products: any[] = (ans.products || []).slice(0, 4);

  await tg("sendMessage", { chat_id: chatId, text: content || "…", reply_markup: MAIN_KB });

  for (const [i, p] of products.entries()) {
    const caption = `<b>${fa(i + 1)}. ${esc(p.name)}</b>\n${p.brand ? esc(p.brand) + "\n" : ""}💰 ${price(p.price)}${p.rating ? `  ⭐ ${fa(p.rating)}` : ""}`;
    const kb = {
      inline_keyboard: [[
        { text: "➕ افزودن به سبد", callback_data: `add:${p.id}`.slice(0, 64) },
        { text: "🔍 مشخصات کامل", url: `${SITE}/gptcommerce?p=${encodeURIComponent(p.id)}` },
      ]],
    };
    const photo = p.image_url || p.image_urls?.[0];
    const r = photo
      ? await tg("sendPhoto", { chat_id: chatId, photo, caption, parse_mode: "HTML", reply_markup: kb })
      : null;
    if (!r?.ok) await tg("sendMessage", { chat_id: chatId, text: caption, parse_mode: "HTML", reply_markup: kb });
  }

  const summary = products.length ? `${content}\n[محصولات نمایش داده شده: ${products.map((p, i) => `#${i + 1} ${p.name} (id:${p.id})`).join("، ")}]` : content;
  await saveChat(chatId, { history: [...history, { role: "assistant", content: summary }].slice(-12) });
}

async function handleCallback(cb: any) {
  const chatId = cb.message?.chat?.id;
  const data: string = cb.data || "";
  const chat = await loadChat(chatId, cb.from);
  let cart: any[] = chat.cart || [];

  if (data === "clear") {
    await saveChat(chatId, { cart: [] });
    await tg("answerCallbackQuery", { callback_query_id: cb.id, text: "سبد خالی شد" });
    return;
  }
  if (data.startsWith("add:")) {
    const id = data.slice(4);
    const { data: p } = await db.from("products").select("id,name,price").eq("id", id).maybeSingle();
    if (!p) return tg("answerCallbackQuery", { callback_query_id: cb.id, text: "این محصول پیدا نشد" });
    const ex = cart.find((i) => i.id === p.id);
    cart = ex ? cart.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i)) : [...cart, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    await saveChat(chatId, { cart });
    await tg("answerCallbackQuery", { callback_query_id: cb.id, text: "✅ به سبدت اضافه شد" });
    const count = cart.reduce((s, i) => s + i.qty, 0);
    await tg("sendMessage", {
      chat_id: chatId,
      text: `«${p.name}» به سبدت اضافه شد. الان ${fa(count)} کالا توی سبدته.`,
      reply_markup: { inline_keyboard: [[{ text: "🛒 مشاهده سبد", callback_data: "cart" }]] },
    });
    return;
  }
  if (data === "cart") {
    await tg("answerCallbackQuery", { callback_query_id: cb.id });
    return sendCart(chatId, cart);
  }
  await tg("answerCallbackQuery", { callback_query_id: cb.id });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const secret = await deriveSecret();
  if (req.headers.get("X-Telegram-Bot-Api-Secret-Token") !== secret) return new Response("Unauthorized", { status: 401 });

  try {
    const update = await req.json();
    if (update.callback_query) await handleCallback(update.callback_query);
    else if (update.message?.contact) {
      await loadChat(update.message.chat.id, update.message.from);
      await saveChat(update.message.chat.id, { phone: update.message.contact.phone_number });
      await tg("sendMessage", { chat_id: update.message.chat.id, text: "شماره‌ات ثبت شد، ممنون 🙏", reply_markup: MAIN_KB });
    } else if (update.message?.text) {
      await handleText(update.message.chat.id, update.message.from, update.message.text.trim());
    }
  } catch (e) {
    console.error("webhook error", e);
  }
  return new Response(JSON.stringify({ ok: true }));
});
