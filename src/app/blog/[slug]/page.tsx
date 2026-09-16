import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Clock } from "lucide-react";
import { articles, getArticle } from "@/content/articles";
import ArticleBody from "@/components/ArticleBody";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.metaTitle,
    description: article.description,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.metaTitle,
      description: article.description,
      url: `/blog/${article.slug}`,
      type: "article",
      publishedTime: article.published,
      modifiedTime: article.updated ?? article.published
    }
  };
}

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const faqBlock = article.body.find((b) => b.type === "faq");
  const schema: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      datePublished: article.published,
      dateModified: article.updated ?? article.published,
      mainEntityOfPage: `https://camperroster.com/blog/${article.slug}`,
      author: { "@type": "Organization", name: "CamperRoster" },
      publisher: {
        "@type": "Organization",
        name: "CamperRoster",
        url: "https://camperroster.com"
      }
    }
  ];
  if (faqBlock && faqBlock.type === "faq") {
    schema.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqBlock.items.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a }
      }))
    });
  }

  return (
    <main className="pb-24 pt-6 sm:pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-forest-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All articles
        </Link>

        <header className="mt-6 mb-10 space-y-5">
          <span className="eyebrow-pill bg-forest-100 text-forest-950 border border-forest-100">
            <span>{article.category.toUpperCase()}</span>
          </span>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-stone-900 tracking-tight leading-[1.1]">
            {article.title}
          </h1>
          <p className="text-lg text-stone-600 leading-relaxed">{article.description}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-500 pt-1">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {formatDate(article.updated ?? article.published)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {article.readMinutes} min read
            </span>
          </div>
        </header>

        <ArticleBody body={article.body} />

        {article.related.length > 0 && (
          <section className="mt-14 pt-8 border-t border-stone-200">
            <h2 className="font-display font-bold text-lg text-stone-900 mb-4">Keep reading</h2>
            <ul className="space-y-2.5">
              {article.related.map((r) => (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    className="group inline-flex items-center gap-2 font-semibold text-forest-800 hover:text-forest-950 transition-colors"
                  >
                    {r.label}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
