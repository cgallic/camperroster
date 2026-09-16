export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; title: string; text: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "faq"; items: { q: string; a: string }[] }
  | { type: "cta"; title: string; text: string; href: string; label: string };

export interface Article {
  slug: string;
  title: string;
  /** Used for <title>. Keep under ~55 chars; the root layout appends "| CamperRoster". */
  metaTitle: string;
  description: string;
  /** ISO date, e.g. "2026-09-16" */
  published: string;
  updated?: string;
  category: "Staffing" | "Health Lodge" | "Compliance" | "Operations" | "Buying Guide";
  readMinutes: number;
  /** Internal links surfaced at the foot of the article. */
  related: { href: string; label: string }[];
  body: Block[];
}
