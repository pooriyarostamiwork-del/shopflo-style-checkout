import { useMemo, useState } from "react";
import type { Part } from "../content/types";
import { Search } from "lucide-react";

export function DocsSidebar({ parts, onNavigate }: { parts: Part[]; onNavigate?: () => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return parts;
    const needle = q.toLowerCase();
    return parts
      .map((p) => ({
        ...p,
        sections: p.sections.filter(
          (s) => s.title.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle),
        ),
      }))
      .filter((p) => p.sections.length > 0 || p.title.toLowerCase().includes(needle));
  }, [parts, q]);

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    onNavigate?.();
  };

  return (
    <nav className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <a
          href="#top"
          onClick={(e) => onClick(e, "top")}
          className="block font-bold text-slate-50 text-sm tracking-tight"
        >
          GPTCommerce Docs
          <span className="block text-xs font-normal text-indigo-400 mt-0.5">AI & Agentic Architecture</span>
        </a>
      </div>
      <div className="p-3 border-b border-slate-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter sections..."
            className="w-full pl-8 pr-2 py-1.5 text-xs rounded-md bg-slate-900 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 text-sm">
        {filtered.map((p) => (
          <div key={p.id} className="mb-4">
            <a
              href={`#${p.id}`}
              onClick={(e) => onClick(e, p.id)}
              className="block text-slate-300 hover:text-indigo-300 font-semibold mb-1.5 text-xs uppercase tracking-wider"
            >
              {p.number}. {p.title}
            </a>
            <ul className="space-y-0.5 border-l border-slate-800 ml-1">
              {p.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => onClick(e, s.id)}
                    className="block pl-3 py-1 text-[13px] text-slate-400 hover:text-indigo-300 hover:border-indigo-500 border-l border-transparent -ml-px transition-colors"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-slate-500 text-center mt-8">No matches.</p>
        )}
      </div>
    </nav>
  );
}
