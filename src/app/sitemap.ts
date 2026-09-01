import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://camperroster.com";
  const now = new Date();

  const routes = [
    "",
    "/pricing",
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

  return routes.map((r, i) => ({
    url: `${baseUrl}${r}`,
    lastModified: now,
    changeFrequency: r === "" || r === "/register" ? "daily" : "weekly",
    priority: r === "" ? 1.0 : r.startsWith("/c/") || r.includes("alternative") ? 0.9 : 0.8
  }));
}
