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
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: "شماره موبایل و کد الزامی است" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find valid OTP
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
      return new Response(
        JSON.stringify({ error: "کد تأیید نامعتبر یا منقضی شده" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as used
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otpRecord.id);

    // Check if user exists by phone in profiles
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, phone, full_name")
      .eq("phone", phone)
      .maybeSingle();

    let isNewUser = false;
    let userId: string;
    let session: any = null;

    if (existingProfile) {
      // Existing user - sign in
      userId = existingProfile.id;
      
      // Generate a magic link / sign in via admin
      // We use signInWithPassword with a dummy password approach won't work.
      // Instead, use admin.generateLink for magiclink, then exchange.
      // Simplest: use admin.updateUser to set a temp password, then signIn.
      // Better approach: use admin API to create a session directly.
      
      // Get user email (we use phone as email placeholder)
      const fakeEmail = `${phone}@flowcart.local`;
      
      // Set a deterministic password based on the verified OTP
      const tempPassword = `otp_${otpRecord.id}_${code}`;
      
      // Update the user's password
      const { error: updateError } = await supabase.auth.admin.updateUser(userId, {
        password: tempPassword,
      });
      
      if (updateError) {
        console.error("Update user error:", updateError);
        return new Response(
          JSON.stringify({ error: "خطا در ورود" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Sign in with the temp password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: tempPassword,
      });
      
      if (signInError) {
        console.error("Sign in error:", signInError);
        return new Response(
          JSON.stringify({ error: "خطا در ورود" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      session = signInData.session;
    } else {
      // New user - create account
      isNewUser = true;
      const fakeEmail = `${phone}@flowcart.local`;
      const tempPassword = `otp_${otpRecord.id}_${code}`;
      
      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email: fakeEmail,
        password: tempPassword,
        email_confirm: true, // Auto-confirm since we verified via OTP
        user_metadata: { phone },
      });

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        return new Response(
          JSON.stringify({ error: "خطا در ایجاد حساب" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = signUpData.user.id;

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        phone,
      });

      if (profileError) {
        console.error("Profile create error:", profileError);
      }

      // Sign in to get session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: tempPassword,
      });

      if (signInError) {
        console.error("New user sign in error:", signInError);
        return new Response(
          JSON.stringify({ error: "خطا در ورود" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      session = signInData.session;
    }

    return new Response(
      JSON.stringify({
        success: true,
        isNewUser,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          token_type: session.token_type,
        },
        profile: existingProfile || { id: userId!, phone, full_name: null },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-otp error:", err);
    return new Response(
      JSON.stringify({ error: "خطای سرور" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
