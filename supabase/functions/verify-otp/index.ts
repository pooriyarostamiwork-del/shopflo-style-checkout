import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

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

    // 1) Verify OTP from database
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

    // 2) Mark OTP as used
    const { error: markUsedError } = await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otpRecord.id);

    if (markUsedError) {
      console.error("OTP mark used error:", markUsedError);
      return json({ error: "Server error" }, 500);
    }

    // 3) Find or create Supabase auth user
    // Use a deterministic email based on phone number as the auth identifier
    const deterministicEmail = `${phone.replace(/[^0-9]/g, "")}@phone.flowcart.app`;
    let authUserId: string;
    let isNewUser = false;

    // Try to create the user first
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: deterministicEmail,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { phone },
    });

    if (createError) {
      if (createError.status === 422 || createError.message?.includes("already been registered") || createError.message?.includes("email_exists")) {
        // User already exists — find them by email
        console.log("User exists, looking up by email:", deterministicEmail);
        const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
          perPage: 1000,
          page: 1,
        });

        if (listError || !listData) {
          console.error("listUsers error:", listError);
          return json({ error: "Server error finding user" }, 500);
        }

        const existingUser = listData.users.find(
          (u) => u.email === deterministicEmail
        );

        if (!existingUser) {
          console.error("Could not find user with email:", deterministicEmail);
          return json({ error: "Server error: user not found" }, 500);
        }

        authUserId = existingUser.id;
      } else {
        console.error("createUser error:", createError);
        return json({ error: "Failed to create user account" }, 500);
      }
    } else {
      authUserId = createData.user.id;
      isNewUser = true;
      console.log("New user created:", authUserId);
    }

    // 4) Generate a real session using generateLink (magiclink gives real tokens)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: deterministicEmail,
    });

    if (linkError || !linkData) {
      console.error("generateLink error:", linkError);
      return json({ error: "Failed to generate session" }, 500);
    }

    // Extract hashed_token and exchange it for a real session
    const hashedToken = linkData.properties?.hashed_token;
    if (!hashedToken) {
      console.error("No hashed_token in generateLink response:", JSON.stringify(linkData));
      return json({ error: "Failed to generate session link" }, 500);
    }

    // Exchange the hashed token for a real session by POSTing to the verify endpoint
    // (equivalent to "clicking the magic link" server-side)
    const verifyResp = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": Deno.env.get("SUPABASE_ANON_KEY")!,
        },
        body: JSON.stringify({ token_hash: hashedToken, type: "magiclink" }),
      }
    );

    const sessionData = await verifyResp.json();

    if (!verifyResp.ok || !sessionData.access_token) {
      console.error("Token exchange failed:", JSON.stringify(sessionData));
      return json({ error: "Failed to create session" }, 500);
    }

    const access_token = sessionData.access_token;
    const refresh_token = sessionData.refresh_token;

    // 5) Upsert profile with the real auth UUID
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: authUserId, phone }, { onConflict: "id" });

    if (profileError) {
      console.error("Profile upsert error:", profileError);
      // Non-fatal: continue, user is still authenticated
    }

    // 6) Fetch the profile to return
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, phone, full_name")
      .eq("id", authUserId)
      .maybeSingle();

    const needsName = !profile?.full_name || profile.full_name.trim() === '';

    console.log("verify-otp success for user:", authUserId, "isNewUser:", isNewUser, "needsName:", needsName);

    return json({
      success: true,
      isNewUser: isNewUser || needsName,
      needsName,
      session: {
        access_token,
        refresh_token,
        token_type: "bearer",
        expires_in: 3600,
      },
      profile,
    });
  } catch (err) {
    console.error("verify-otp unexpected error:", err);
    return json({ error: "Server error" }, 500);
  }
});
