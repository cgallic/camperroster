import { MetadataRoute } from "next";
import { articles } from "@/content/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://camperroster.com";
  const now = new Date();

  const routes = [
    "",
    "/pricing",
    "/blog",
    "/ultracamp-alternative",
    "/campbrain-alternative",
    "/campdoc-alternative",
    "/christian-camp-software",
    "/church-camp-registration-software",
    "/summer-camp-management-software",
    "/camp-volunteer-reference-check-software",
    "/cashless-camp-canteen-pos",
    "/camp-registration-software-vs-google-forms",
    "/board-proposal",
    "/register",
    "/start",
    "/volunteer",
    "/c/camphope",
    "/c/pinetrail",
    "/c/evergreen",
    "/llms.txt"
  ];

  const staticEntries: MetadataRoute.Sitemap = routes.map((r) => ({
    url: `${baseUrl}${r}`,
    lastModified: now,
    changeFrequency: r === "" || r === "/register" ? "daily" : "weekly",
    priority: r === "" ? 1.0 : r.startsWith("/c/") || r.includes("alternative") ? 0.9 : 0.8
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${baseUrl}/blog/${a.slug}`,
    lastModified: new Date(`${a.updated ?? a.published}T12:00:00Z`),
    changeFrequency: "monthly",
    priority: 0.7
  }));

  return [...staticEntries, ...articleEntries];
}
