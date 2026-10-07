// Records a complete mono WAV (decodable on every browser, incl. iOS Safari)
// and exposes a live level (0..1) for the voice orb.
function encodeWav(chunks: readonly Float32Array[], sampleRate: number): Blob {
  const length = chunks.reduce((s, c) => s + c.length, 0);
  const bytes = new ArrayBuffer(44 + length * 2);
  const v = new DataView(bytes);
  const tag = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  tag(0, "RIFF"); v.setUint32(4, 36 + length * 2, true); tag(8, "WAVE"); tag(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); tag(36, "data"); v.setUint32(40, length * 2, true);
  let o = 44;
  for (const c of chunks) for (const x of c) { const s = Math.max(-1, Math.min(1, x)); v.setInt16(o, s * (s < 0 ? 32768 : 32767), true); o += 2; }
  return new Blob([bytes], { type: "audio/wav" });
}

export type Recording = { stop: () => Promise<File>; cancel: () => void };

export async function recordWav(onLevel: (level: number) => void): Promise<Recording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  let ctx: AudioContext | undefined;
  try {
    ctx = new AudioContext();
    await ctx.resume();
    const audio = ctx;
    const source = audio.createMediaStreamSource(stream);
    const node = audio.createScriptProcessor(4096, 1, 1);
    const chunks: Float32Array[] = [];
    node.onaudioprocess = (e) => {
      const d = e.inputBuffer.getChannelData(0);
      chunks.push(new Float32Array(d));
      let sum = 0;
      for (let i = 0; i < d.length; i++) sum += d[i] * d[i];
      onLevel(Math.min(1, Math.sqrt(sum / d.length) * 6));
    };
    source.connect(node);
    node.connect(audio.destination);
    let stopped = false;
    const release = async () => {
      stopped = true;
      stream.getTracks().forEach((t) => t.stop());
      node.disconnect(); source.disconnect(); node.onaudioprocess = null;
      await audio.close().catch(() => {});
    };
    return {
      async stop() {
        if (stopped) throw new Error("stopped");
        const blob = encodeWav(chunks, audio.sampleRate);
        await release();
        if (blob.size < 8192) throw new Error("empty");
        return new File([blob], "recording.wav", { type: "audio/wav" });
      },
      cancel() { if (!stopped) void release(); },
    };
  } catch (e) {
    stream.getTracks().forEach((t) => t.stop());
    await ctx?.close();
    throw e;
  }
}

export async function transcribeFile(file: File, signal?: AbortSignal): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/transcribe`, {
    method: "POST",
    headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    body: form,
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `status ${res.status}`);
  return String(data.text || "").trim();
}
