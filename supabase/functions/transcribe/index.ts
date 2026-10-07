import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { MAX_AUDIO_BYTES, TranscribeError, transcribeAudio } from "../_shared/transcribe.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "file is required" }, 400);
    if (!file.type.startsWith("audio/")) return json({ error: "audio file required" }, 400);
    if (!file.size || file.size > MAX_AUDIO_BYTES) return json({ error: "invalid audio size" }, 400);
    const text = await transcribeAudio(file, file.name || "recording.wav", req.signal);
    return json({ text });
  } catch (e) {
    if (req.signal.aborted) return json({ error: "aborted" }, 499);
    const status = e instanceof TranscribeError ? e.status : 500;
    return json({ error: e instanceof Error ? e.message : "error" }, status);
  }
});
