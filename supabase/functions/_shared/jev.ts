// Small typed judgments through Jev (System One). Never invents a decision:
// any failure returns null and the caller keeps its rule-based path.
export type JevAnswer = { choice?: string; noul?: number; score?: number; confidence?: number };

export async function askJev(state: unknown, questions: Record<string, unknown>): Promise<Record<string, JevAnswer> | null> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;
  const started = Date.now();
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/systemone", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({ model: "typesafe/jev-latest", state, questions }),
    });
    if (!res.ok) {
      console.error("jev status", res.status, (await res.text().catch(() => "")).slice(0, 200));
      return null;
    }
    const data = await res.json().catch(() => null);
    const answers = data?.answers && typeof data.answers === "object" ? data.answers : null;
    console.log("jev", JSON.stringify({ ms: Date.now() - started, answers }));
    return answers;
  } catch (e) {
    console.error("jev fetch failed", e);
    return null;
  }
}

/** Yes only when Jev is clearly sure; null when it could not judge. */
export const jevYes = (a: JevAnswer | undefined, threshold = 0.7): boolean | null =>
  typeof a?.noul === "number" ? a.noul >= threshold : null;
