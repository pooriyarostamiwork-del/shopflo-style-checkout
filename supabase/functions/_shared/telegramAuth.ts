// Shared helpers: verify Telegram Mini App initData and mint a phone-based login session.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
async function hmac(key: ArrayBuffer | Uint8Array, data: string) {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, enc.encode(data));
}

/** Returns the Telegram user id when initData is genuinely signed by our bot and fresh (24h). */
export async function verifyInitData(initData: unknown, botToken: string): Promise<number | null> {
  if (typeof initData !== "string" || !initData || initData.length > 4096) return null;
  const p = new URLSearchParams(initData);
  const hash = p.get("hash");
  if (!hash) return null;
  p.delete("hash");
  const check = [...p.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secret = await hmac(enc.encode("WebAppData"), botToken);
  if (hex(await hmac(secret, check)) !== hash) return null;
  const authDate = Number(p.get("auth_date") || 0);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return null;
  try { return Number(JSON.parse(p.get("user") || "{}").id) || null; } catch { return null; }
}

export function localPhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  return d.startsWith("98") ? "0" + d.slice(2) : d.startsWith("0") ? d : "0" + d;
}

/** Same identity scheme as verify-otp: deterministic email per phone, real session via magic link. */
export async function mintPhoneSession(db: SupabaseClient, rawPhone: string) {
  const phone = localPhone(rawPhone);
  const email = `${phone.replace(/[^0-9]/g, "")}@phone.flowcart.app`;
  let userId: string | null = null;
  const { data: created, error } = await db.auth.admin.createUser({ email, email_confirm: true, phone_confirm: true, user_metadata: { phone } });
  if (created?.user) userId = created.user.id;
  else if (error) {
    const { data: list } = await db.auth.admin.listUsers({ perPage: 1000, page: 1 });
    userId = list?.users.find((u) => u.email === email)?.id ?? null;
  }
  if (!userId) return null;
  const { data: link } = await db.auth.admin.generateLink({ type: "magiclink", email });
  const hashed = link?.properties?.hashed_token;
  if (!hashed) return null;
  const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
    body: JSON.stringify({ token_hash: hashed, type: "magiclink" }),
  });
  const s = await r.json();
  if (!r.ok || !s.access_token) return null;
  await db.from("profiles").upsert({ id: userId, phone }, { onConflict: "id", ignoreDuplicates: true });
  return { user_id: userId, access_token: s.access_token as string, refresh_token: s.refresh_token as string };
}
