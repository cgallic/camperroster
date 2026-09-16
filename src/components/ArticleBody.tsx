import Link from "next/link";
import type { Block } from "@/content/articles/types";

/**
 * Renders a very small inline syntax so article copy stays readable in source:
 *   [label](/internal-path)  -> Link
 *   **bold**                 -> <strong>
 * Anything else is emitted as plain text.
 */
function inline(text: string, keyPrefix: string) {
  const nodes: React.ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] && m[2]) {
      nodes.push(
        <Link
          key={`${keyPrefix}-l${i}`}
          href={m[2]}
          className="text-forest-800 underline underline-offset-4 decoration-forest-600/40 hover:decoration-forest-800 transition-colors font-semibold"
        >
          {m[1]}
        </Link>
      );
    } else if (m[3]) {
      nodes.push(
        <strong key={`${keyPrefix}-b${i}`} className="font-bold text-stone-900">
          {m[3]}
        </strong>
      );
    }
    last = m.index + m[0].length;
    i += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function ArticleBody({ body }: { body: Block[] }) {
  return (
    <div className="space-y-7">
      {body.map((block, idx) => {
        const key = `b${idx}`;
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={key}
                className="font-display font-extrabold text-2xl sm:text-3xl text-stone-900 tracking-tight pt-6 scroll-mt-24"
              >
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={key} className="font-display font-bold text-xl text-stone-900 tracking-tight pt-2">
                {block.text}
              </h3>
            );
          case "p":
            return (
              <p key={key} className="text-stone-700 text-[1.0625rem] leading-relaxed">
                {inline(block.text, key)}
              </p>
            );
          case "ul":
            return (
              <ul key={key} className="space-y-2.5 pl-5 list-disc marker:text-forest-600">
                {block.items.map((it, j) => (
                  <li key={`${key}-${j}`} className="text-stone-700 leading-relaxed pl-1">
                    {inline(it, `${key}-${j}`)}
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="space-y-2.5 pl-5 list-decimal marker:text-forest-700 marker:font-bold">
                {block.items.map((it, j) => (
                  <li key={`${key}-${j}`} className="text-stone-700 leading-relaxed pl-1">
                    {inline(it, `${key}-${j}`)}
                  </li>
                ))}
              </ol>
            );
          case "callout":
            return (
              <aside
                key={key}
                className="rounded-2xl border border-stone-200 bg-[var(--sand-bg)] px-5 py-5 sm:px-6"
              >
                <p className="font-display font-bold text-stone-900 mb-1.5">{block.title}</p>
                <p className="text-stone-700 leading-relaxed">{inline(block.text, key)}</p>
              </aside>
            );
          case "table":
            return (
              <div key={key} className="overflow-x-auto rounded-2xl border border-stone-200">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="bg-[var(--sand-bg)]">
                      {block.head.map((h, j) => (
                        <th
                          key={`${key}-h${j}`}
                          className="px-4 py-3 font-display font-bold text-stone-900 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr key={`${key}-r${j}`} className="border-t border-stone-200">
                        {row.map((cell, k) => (
                          <td key={`${key}-r${j}c${k}`} className="px-4 py-3 align-top text-stone-700">
                            {inline(cell, `${key}-r${j}c${k}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "faq":
            return (
              <div key={key} className="space-y-4 pt-2">
                {block.items.map((f, j) => (
                  <div
                    key={`${key}-${j}`}
                    className="rounded-2xl border border-stone-200 bg-white px-5 py-5 sm:px-6"
                  >
                    <p className="font-display font-bold text-stone-900 mb-1.5">{f.q}</p>
                    <p className="text-stone-700 leading-relaxed">{inline(f.a, `${key}-${j}`)}</p>
                  </div>
                ))}
              </div>
            );
          case "cta":
            return (
              <aside
                key={key}
                className="rounded-3xl bg-[var(--forest-deep)] px-6 py-7 sm:px-8 sm:py-8 text-white"
              >
                <p className="font-display font-extrabold text-xl sm:text-2xl tracking-tight mb-2">
                  {block.title}
                </p>
                <p className="text-white/75 leading-relaxed mb-5">{block.text}</p>
                <Link
                  href={block.href}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--sun-gold)] px-6 py-3 font-bold text-sm text-stone-900 hover:brightness-105 transition"
                >
                  {block.label}
                </Link>
              </aside>
            );
        }
      })}
    </div>
  );
}
