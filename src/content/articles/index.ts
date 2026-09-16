import type { Article } from "./types";
import referenceChecks from "./camp-counselor-reference-check-questions";
import medicationRecord from "./camp-medication-administration-record";
import offSeasonFees from "./camp-software-off-season-fees";

export const articles: Article[] = [referenceChecks, medicationRecord, offSeasonFees];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export type { Article };
