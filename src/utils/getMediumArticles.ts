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

function extractCleanSnippet(html: string): string {
  if (!html) return "";

  // 1. Remove figures, captions, images, scripts, styles, and code blocks
  let clean = html
    .replace(/<figure[\s\S]*?<\/figure>/gi, " ")
    .replace(/<figcaption[\s\S]*?<\/figcaption>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<pre[\s\S]*?<\/pre>/gi, " ")
    .replace(/<code[\s\S]*?<\/code>/gi, " ")
    .replace(/<img[^>]*>/gi, " ");

  // 2. Decode HTML entities
  clean = clean
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&hellip;/gi, "...")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  // 3. Extract the first meaningful paragraph (skipping section headings like <h3>Overview</h3>)
  const paragraphs = clean.match(/<p[\s\S]*?>([\s\S]*?)<\/p>/gi);
  if (paragraphs && paragraphs.length > 0) {
    for (const p of paragraphs) {
      const pText = p
        .replace(/<[^>]*>?/gm, "")
        .replace(/\s+/g, " ")
        .trim();
      if (pText.length > 20) {
        return pText.length > 220 ? pText.slice(0, 220) + "..." : pText;
      }
    }
  }

  // 4. Fallback: replace block tags with space, strip all tags
  clean = clean
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, " ")
    .replace(/<(br|hr)\s*\/?>/gi, " ")
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  // Strip leading standalone section headers if any remain
  clean = clean.replace(/^(overview|introduction|summary)\s*[:-]?\s*/i, "");

  return clean.length > 220 ? clean.slice(0, 220) + "..." : clean;
}

export async function getMediumArticles(): Promise<MediumArticle[]> {
  try {
    const res = await fetch("https://blog.becloud.sh/feed", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BeCloudSh/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    });

    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(`Blog RSS returned HTTP ${res.status}: ${res.statusText}`);
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

      const snippet = extractCleanSnippet(rawContent);

      const categories = (item.categories as string[]) || [];

      const rawLink = item.link || "https://blog.becloud.sh";
      const normalizedLink = rawLink.replace(
        /^https?:\/\/(www\.)?(medium\.com\/@becloudsh|becloudsh\.medium\.com)/,
        "https://blog.becloud.sh"
      );

      return {
        title: item.title || "Untitled",
        link: normalizedLink,
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
    console.warn("Failed to fetch or parse Blog RSS feed:", error);
    return [];
  }
}
