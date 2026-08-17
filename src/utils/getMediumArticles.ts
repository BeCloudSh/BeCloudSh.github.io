import Parser from "rss-parser";

export interface MediumArticle {
  title: string;
  link: string;
  pubDate: string;
  isoDate?: string;
  categories: string[];
  snippet: string;
  guid?: string;
  isPersonal: boolean;
}

const PERSONAL_KEYWORDS = [
  "personal",
  "personal-notes",
  "notes",
  "travel",
  "travels",
  "traveling",
  "trip",
  "trips",
  "dining",
  "fine-dining",
  "food",
  "gastronomy",
  "culinary",
  "restaurant",
  "restaurants",
  "wine",
  "lifestyle",
  "life",
  "off-duty",
  "exploration",
  "places",
  "culture",
  "dispatches",
  "field-notes",
];

export function isPersonalArticle(categories: string[] = []): boolean {
  return categories.some(cat => {
    const normalized = cat.toLowerCase().replace(/[^a-z0-9]/g, "");
    return PERSONAL_KEYWORDS.some(kw => {
      const normKw = kw.toLowerCase().replace(/[^a-z0-9]/g, "");
      return normalized.includes(normKw) || normKw.includes(normalized);
    });
  });
}

const parser = new Parser({
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["dc:creator", "creator"],
    ],
  },
});

export async function getMediumArticles(): Promise<MediumArticle[]> {
  try {
    const res = await fetch("https://becloudsh.medium.com/feed", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BeCloudSh/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(`Medium RSS returned HTTP ${res.status}: ${res.statusText}`);
      return [];
    }

    const xml = await res.text();
    const feed = await parser.parseString(xml);

    return (feed.items || []).map(item => {
      const rawContent =
        (item.contentEncoded as string) ||
        (item.content as string) ||
        (item.contentSnippet as string) ||
        "";

      // Strip HTML tags and normalize whitespace for a clean text preview
      const textOnly = rawContent
        .replace(/<[^>]*>?/gm, "")
        .replace(/\s+/g, " ")
        .trim();

      const snippet =
        textOnly.length > 220 ? textOnly.slice(0, 220) + "..." : textOnly;

      const categories = (item.categories as string[]) || [];

      return {
        title: item.title || "Untitled",
        link: item.link || "https://becloudsh.medium.com",
        pubDate: item.pubDate || new Date().toISOString(),
        isoDate: item.isoDate,
        categories: categories,
        snippet: snippet,
        guid: item.guid,
        isPersonal: isPersonalArticle(categories),
      };
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Failed to fetch or parse Medium RSS feed:", error);
    return [];
  }
}
