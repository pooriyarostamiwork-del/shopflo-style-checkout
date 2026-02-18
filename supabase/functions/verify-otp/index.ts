import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Use the service role client for admin actions
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// JWT secret for generating Supabase-compatible tokens
const JWT_SECRET = Deno.env.get("SUPABASE_JWT_SECRET")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return new Response(JSON.stringify({ error: "شماره موبایل و کد الزامی است" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1️⃣ Verify OTP
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

    if (otpError || !otpRecord) {
      return new Response(JSON.stringify({ error: "کد تأیید نامعتبر یا منقضی شده" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark OTP as used
    await supabase.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);

    // 2️⃣ Get or create user
    let { data: profile } = await supabase
      .from("profiles")
      .select("id, phone, full_name")
      .eq("phone", phone)
      .maybeSingle();

    let userId: string;

    if (!profile) {
      // Create Supabase Auth user via admin API
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        phone,
        phone_confirm: true,
        user_metadata: { phone },
      });

      if (createUserError) {
        console.error("Error creating user:", createUserError);
        return new Response(JSON.stringify({ error: "خطا در ایجاد حساب" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;

      // Create profile row
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        phone,
      });
      if (profileError) console.error("Profile insert error:", profileError);

      profile = { id: userId, phone, full_name: null };
    } else {
      userId = profile.id;
    }

    // 3️⃣ Generate Supabase JWT
    const payload = {
      sub: userId,
      role: "authenticated",
      aud: "authenticated",
      exp: getNumericDate(60 * 60), // 1 hour expiry
    };

    const access_token = await create({ alg: "HS256", typ: "JWT" }, payload, JWT_SECRET);

    return new Response(
      JSON.stringify({
        success: true,
        isNewUser: !profile,
        session: {
          access_token,
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: null, // optional: implement refresh separately
        },
        profile,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("verify-otp error:", err);
    return new Response(JSON.stringify({ error: "خطای سرور" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
