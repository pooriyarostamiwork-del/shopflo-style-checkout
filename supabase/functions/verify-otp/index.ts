import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const JWT_SECRET = Deno.env.get("SUPABASE_JWT_SECRET")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return json({ error: "Phone and code are required" }, 400);
    }

    // 1) Verify OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .eq("code", code)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error("OTP lookup error:", otpError);
      return json({ error: "Server error" }, 500);
    }

    if (!otpRecord) {
      return json({ error: "Invalid or expired code" }, 400);
    }

    // Mark OTP as used
    const { error: markUsedError } = await supabase.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);

    if (markUsedError) {
      console.error("OTP mark used error:", markUsedError);
      return json({ error: "Server error" }, 500);
    }

    // 2) Get or create profile
    let { data: profile, error: profileFetchError } = await supabase
      .from("profiles")
      .select("id, phone, full_name")
      .eq("phone", phone)
      .maybeSingle();

    if (profileFetchError) {
      console.error("Profile fetch error:", profileFetchError);
      return json({ error: "Server error" }, 500);
    }

    let isNewUser = false;

    if (!profile) {
      isNewUser = true;

      const { data: newProfile, error: profileCreateError } = await supabase
        .from("profiles")
        .insert({ phone })
        .select("id, phone, full_name")
        .maybeSingle();

      if (profileCreateError || !newProfile) {
        console.error("Profile create error:", profileCreateError);
        return json({ error: "Failed to create account" }, 500);
      }

      profile = newProfile;
    }

    const userId = profile.id;

    // 3) Generate JWT
    const payload = {
      sub: userId,
      role: "authenticated",
      aud: "authenticated",
      exp: getNumericDate(60 * 60), // 1 hour
    };

    const access_token = await create({ alg: "HS256", typ: "JWT" }, payload, JWT_SECRET);

    return json({
      success: true,
      isNewUser,
      session: {
        access_token,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: null,
      },
      profile,
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return json({ error: "Server error" }, 500);
  }
});
