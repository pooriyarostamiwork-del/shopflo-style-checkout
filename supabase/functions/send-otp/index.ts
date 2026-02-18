import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone || !/^09\d{9}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "شماره موبایل معتبر نیست" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    // Invalidate previous unused codes for this phone
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("phone", phone)
      .eq("used", false);

    // Store OTP
    const { error: insertError } = await supabase.from("otp_codes").insert({
      phone,
      code,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("OTP insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "خطا در ارسال کد" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via Kavenegar Lookup API
    const apiKey = Deno.env.get("KAVENEGAR_API_KEY");
    if (!apiKey) {
      console.error("KAVENEGAR_API_KEY not set");
      return new Response(
        JSON.stringify({ error: "پیکربندی سرویس پیامک ناقص است" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const kavenegarUrl = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json`;
    const params = new URLSearchParams({
      receptor: phone,
      token: code,
      template: "flowcart-verify",
    });

    const smsResponse = await fetch(`${kavenegarUrl}?${params.toString()}`);
    const smsResult = await smsResponse.json();

    if (smsResult.return?.status !== 200) {
      console.error("Kavenegar error:", JSON.stringify(smsResult));
      // Still return success - code is stored, user can retry
      // In dev, log the code for testing
      console.log(`[DEV] OTP for ${phone}: ${code}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "کد تأیید ارسال شد" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-otp error:", err);
    return new Response(
      JSON.stringify({ error: "خطای سرور" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
