import type { Block, Part, Section } from "../content/types";
import { CodeBlock } from "./CodeBlock";
import { MermaidDiagram } from "./MermaidDiagram";
import { Callout } from "./Callout";
import { StatusBadge } from "./StatusBadge";

function renderBlock(b: Block, i: number) {
  switch (b.kind) {
    case "prose":
      return (
        <div
          key={i}
          className="prose prose-invert max-w-none text-slate-300 text-[15px] leading-7 [&_a]:text-indigo-300 [&_a:hover]:text-indigo-200 [&_strong]:text-slate-100 [&_code]:bg-slate-800/70 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:text-indigo-200 [&_p]:my-3"
          dangerouslySetInnerHTML={{ __html: b.html }}
        />
      );
    case "heading": {
      const Tag = `h${b.level}` as any;
      const sizes = { 2: "text-2xl mt-10 mb-4", 3: "text-xl mt-8 mb-3", 4: "text-lg mt-6 mb-2" } as const;
      return (
        <Tag key={i} id={b.id} className={`font-semibold text-slate-100 scroll-mt-24 ${sizes[b.level]}`}>
          {b.text}
        </Tag>
      );
    }
    case "code":
      return <CodeBlock key={i} lang={b.lang} code={b.code} title={b.title} />;
    case "mermaid":
      return <MermaidDiagram key={i} code={b.code} caption={b.caption} />;
    case "callout":
      return <Callout key={i} tone={b.tone} title={b.title} html={b.html} />;
    case "status":
      return (
        <div key={i} className="my-5 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h4 className="font-semibold text-slate-100">{b.title}</h4>
            <StatusBadge status={b.status} />
          </div>
          <div
            className="text-sm text-slate-300 leading-relaxed [&_code]:bg-slate-800/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs"
            dangerouslySetInnerHTML={{ __html: b.html }}
          />
        </div>
      );
    case "table":
      return (
        <div key={i} className="my-5 overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 text-slate-200">
              <tr>
                {b.head.map((h, j) => (
                  <th key={j} className="text-left px-3 py-2 font-semibold border-b border-slate-800">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {b.rows.map((r, j) => (
                <tr key={j} className="border-b border-slate-800/60 last:border-0">
                  {r.map((c, k) => (
                    <td key={k} className="px-3 py-2 align-top" dangerouslySetInnerHTML={{ __html: c }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "list": {
      const Tag = b.ordered ? "ol" : "ul";
      return (
        <Tag key={i} className={`my-4 pl-5 text-slate-300 text-[15px] leading-7 ${b.ordered ? "list-decimal" : "list-disc"}`}>
          {b.items.map((it, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: it }} />
          ))}
        </Tag>
      );
    }
  }
}

function SectionView({ section }: { section: Section }) {
  return (
    <section id={section.id} className="scroll-mt-24 mb-12">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-5">
        <h2 className="text-2xl font-bold text-slate-100">{section.title}</h2>
        {section.status && <StatusBadge status={section.status} size="md" />}
      </div>
      {section.blocks.map((b, i) => renderBlock(b, i))}
    </section>
  );
}

export function DocsContent({ parts }: { parts: Part[] }) {
  return (
    <div>
      {parts.map((part) => (
        <article key={part.id} id={part.id} className="scroll-mt-24 mb-16">
          <header className="mb-8 border-b-2 border-indigo-500/30 pb-4">
            <div className="text-xs font-mono uppercase tracking-widest text-indigo-400 mb-1">
              Part {part.number}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-50">{part.title}</h1>
            {part.intro && (
              <p className="mt-3 text-slate-400 text-base leading-7">{part.intro}</p>
            )}
          </header>
          {part.sections.map((s) => (
            <SectionView key={s.id} section={s} />
          ))}
        </article>
      ))}
    </div>
  );
}
