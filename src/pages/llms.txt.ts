import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import { getSortedPosts } from "@/utils/getSortedPosts";
import { getPostUrl } from "@/utils/getPostPaths";
import { getAssetPath } from "@/utils/withBase";
import config from "@/config";

// A discovery aid using existing metadata, not an indexing or ranking signal.
const plainLine = (value: string) => value.replace(/\s+/g, " ").trim();
const label = (value: string) => plainLine(value).replace(/[\\[\]]/g, "\\$&");

export const GET: APIRoute = async () => {
  const { site } = config;
  const absolute = (path: string) => new URL(path, site.url).href;
  const posts = getSortedPosts(await getCollection("posts"));
  const pages = await getCollection("pages");
  const lines = [
    `# ${plainLine(site.title)}`,
    "",
    `> ${plainLine(site.description)}`,
    "",
    `Author: ${plainLine(site.author)}`,
    `Language: ${site.lang}`,
    "",
    "## Posts",
    "",
    ...posts.map(
      ({ id, filePath, data }) =>
        `- [${label(data.title)}](${absolute(data.canonicalURL ?? getPostUrl(id, filePath))}): ${plainLine(data.description)}`
    ),
    "",
    "## Pages",
    "",
    ...pages
      .filter(page => page.body?.trim())
      .map(
        ({ id, data }) =>
          `- [${label(data.title)}](${absolute(data.canonicalURL ?? getRelativeLocaleUrl(site.lang, id))})${data.description ? `: ${plainLine(data.description)}` : ""}`
      ),
    "",
    "## Feeds",
    "",
    `- [RSS](${absolute(getAssetPath("rss.xml"))})`,
    `- [Sitemap](${absolute(getAssetPath("sitemap-index.xml"))})`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
