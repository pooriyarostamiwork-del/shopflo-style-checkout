import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let initialized = false;
function ensureInit() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    themeVariables: {
      darkMode: true,
      background: "#0b1120",
      primaryColor: "#1e293b",
      primaryTextColor: "#e2e8f0",
      primaryBorderColor: "#6366f1",
      lineColor: "#64748b",
      secondaryColor: "#334155",
      tertiaryColor: "#1e293b",
      fontSize: "14px",
    },
    securityLevel: "loose",
  });
  initialized = true;
}

let counter = 0;

export function MermaidDiagram({ code, caption }: { code: string; caption?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`mmd-${++counter}-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    ensureInit();
    let cancelled = false;
    (async () => {
      try {
        const { svg } = await mermaid.render(idRef.current, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Diagram render error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <figure className="my-6 rounded-lg border border-slate-800 bg-slate-950/60 p-4 overflow-x-auto">
      {error ? (
        <pre className="text-xs text-red-400 whitespace-pre-wrap">{error}</pre>
      ) : (
        <div ref={ref} className="flex justify-center [&_svg]:max-w-full [&_svg]:h-auto" />
      )}
      {caption && (
        <figcaption className="mt-3 text-center text-xs text-slate-400">{caption}</figcaption>
      )}
    </figure>
  );
}
