import rss from "@astrojs/rss";
import { getMediumArticles } from "@/utils/getMediumArticles";
import { SITE } from "@/config";

export async function GET() {
  const articles = await getMediumArticles();

  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    items: articles.map(article => ({
      link: article.link,
      title: article.title,
      description: article.snippet,
      pubDate: new Date(article.pubDate),
    })),
  });
}
