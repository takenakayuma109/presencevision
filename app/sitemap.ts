import type { MetadataRoute } from "next";

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL ?? "http://localhost:4000";
const SITE_URL = "https://presencevision.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/companies`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Fetch all articles from engine
  try {
    const res = await fetch(`${ENGINE_URL}/articles?limit=500`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      for (const article of data.articles ?? []) {
        entries.push({
          url: `${SITE_URL}/blog/${article.slug}`,
          lastModified: new Date(article.published_at),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  } catch {
    // Engine unavailable, return static entries only
  }

  // Fetch project IDs for /companies/[id] pages
  try {
    const res = await fetch(`${ENGINE_URL}/engine/status`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const projects = data.projects ?? data.channels ?? [];
      for (const project of projects) {
        const id = project.id ?? project.project_id;
        if (id) {
          entries.push({
            url: `${SITE_URL}/companies/${id}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    }
  } catch {
    // Engine unavailable, skip company pages
  }

  return entries;
}
