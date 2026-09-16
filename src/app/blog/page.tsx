import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { articles } from "@/content/articles";

export const metadata: Metadata = {
  title: "Camp Operations Guides",
  description:
    "Practical guides for running a camp: staff reference checks, health lodge medication records, background-check rules by state, and what camp software should cost off-season.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Camp Operations Guides",
    description:
      "Practical guides for running a camp: staff reference checks, health lodge medication records, background-check rules by state, and camp software costs.",
    url: "/blog",
    type: "website"
  }
};

export default function BlogIndex() {
  const sorted = [...articles].sort((a, b) =>
    (b.updated ?? b.published).localeCompare(a.updated ?? a.published)
  );

  return (
    <main className="pb-24 pt-6 sm:pt-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <header className="max-w-2xl space-y-5 mb-12">
        <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-100">
          <span>CAMP OPERATIONS</span>
        </span>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-stone-900 tracking-tight leading-[1.1]">
          Guides for the parts of camp nobody trains you for
        </h1>
        <p className="text-lg text-stone-600 leading-relaxed">
          Reference checks, medication records, background-check law, and what you should actually
          be paying for software in February. Written for directors and camp administrators, not for
          software buyers.
        </p>
      </header>

      <ul className="grid gap-5 sm:grid-cols-2">
        {sorted.map((a) => (
          <li key={a.slug}>
            <Link href={`/blog/${a.slug}`} className="group block h-full">
              <article className="h-full flex flex-col rounded-3xl border border-stone-200 bg-white p-6 sm:p-7 transition-all hover:border-forest-600/40 hover:shadow-[0_20px_40px_-20px_rgba(19,57,46,0.18)]">
                <p className="font-mono text-[0.6875rem] font-bold tracking-widest text-forest-700 uppercase mb-3">
                  {a.category}
                </p>
                <h2 className="font-display font-extrabold text-xl text-stone-900 tracking-tight leading-snug mb-2.5">
                  {a.title}
                </h2>
                <p className="text-stone-600 leading-relaxed text-[0.9375rem] flex-1">
                  {a.description}
                </p>
                <div className="flex items-center justify-between pt-5 mt-5 border-t border-stone-200">
                  <span className="inline-flex items-center gap-1.5 text-xs text-stone-500">
                    <Clock className="w-3.5 h-3.5" />
                    {a.readMinutes} min read
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-800">
                    Read
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </article>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
