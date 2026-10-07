// Speech-to-text through Lovable AI Gateway. Shared by the app (`transcribe`)
// and the Telegram bot so both channels turn voice into the same text input.
const GATEWAY = "https://ai.gateway.lovable.dev/v1/audio/transcriptions";
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

export class TranscribeError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function transcribeAudio(file: Blob, filename: string, signal?: AbortSignal): Promise<string> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new TranscribeError(500, "LOVABLE_API_KEY is not configured");
  if (!file.size || file.size > MAX_AUDIO_BYTES) throw new TranscribeError(400, "Invalid audio size");

  const form = new FormData();
  form.append("model", "openai/gpt-transcribe");
  form.append("file", file, filename);
  form.append("response_format", "json");
  form.append("stream", "true");
  form.append("language", "fa");
  form.append("prompt", "گفت‌وگوی خرید فارسی در یک فروشگاه آنلاین (غذای حیوانات، لوازم، سبد خرید).");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
    body: form,
    signal,
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    console.error(`transcribe failed [${res.status}]: ${body}`);
    throw new TranscribeError(res.status, body || "Transcription failed");
  }

  // SSE: append deltas, prefer the final `done` text.
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", acc = "", final: string | null = null;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const ev = JSON.parse(data);
        if (ev.type === "transcript.text.delta" && ev.delta) acc += ev.delta;
        else if (ev.type === "transcript.text.done") final = ev.text ?? acc;
        else if (ev.type === "error" || ev.error) throw new TranscribeError(502, ev.error?.message || "Transcription error");
      } catch (e) {
        if (e instanceof TranscribeError) throw e;
      }
    }
  }
  return (final ?? acc).trim();
}
