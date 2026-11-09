import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Inspect deployable artifacts, so broken links or missing metadata fail CI.
const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const read = path => readFile(resolve(dist, path), "utf8");
const decode = text =>
  text.replace(
    /&(amp|quot|apos|lt|gt|#39);/g,
    (_, name) =>
      ({ amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", "#39": "'" })[name]
  );
const tags = (html, tag) =>
  [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "g"))].map(([source]) =>
    Object.fromEntries(
      [...source.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [
        key,
        decode(value),
      ])
    )
  );
const locations = xml =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => decode(url));

async function exists(url) {
  const path = decodeURIComponent(new URL(url).pathname).replace(/^\//, "");
  const filename = path.endsWith("/") || !path ? `${path}index.html` : path;
  assert.ok(
    (await stat(resolve(dist, filename))).isFile(),
    `Missing output: ${url}`
  );
}

const files = (await readdir(dist, { recursive: true })).filter(file =>
  file.endsWith(".html")
);
assert.ok(files.length > 0, "Build the site before running check:seo");
const llms = await read("llms.txt");
const sitemapIndex = await read("sitemap-index.xml");
const sitemapURLs = (
  await Promise.all(
    locations(sitemapIndex).map(async url => {
      await exists(url);
      return locations(await read(new URL(url).pathname.slice(1)));
    })
  )
).flat();
const sitemap = new Set(sitemapURLs);
assert.equal(sitemap.size, sitemapURLs.length, "Duplicate sitemap entries");
assert.ok(sitemap.size > 0, "Empty sitemap");
for (const url of sitemap) {
  assert.doesNotMatch(new URL(url).pathname, /^\/(search|404)(\/|\.html)?$/);
  await exists(url);
}

let articleCount = 0;
for (const file of files) {
  const html = await read(file);
  const links = tags(html, "link");
  const metas = tags(html, "meta");
  const meta = key =>
    metas.find(item => item.name === key || item.property === key)?.content;
  const canonicalLinks = links.filter(item => item.rel === "canonical");
  assert.equal(canonicalLinks.length, 1, `${file}: expected one canonical`);
  const canonical = canonicalLinks[0].href;
  assert.ok(
    canonical?.startsWith("https://"),
    `${file}: absolute HTTPS canonical required`
  );
  assert.equal(
    new URL(canonical).search,
    "",
    `${file}: canonical contains query`
  );
  assert.equal(
    new URL(canonical).hash,
    "",
    `${file}: canonical contains fragment`
  );
  assert.equal(meta("og:url"), canonical, `${file}: OG and canonical disagree`);
  assert.ok(meta("description")?.trim(), `${file}: missing description`);
  assert.ok(meta("author")?.trim(), `${file}: missing author`);

  const rss = links.find(item => item.type === "application/rss+xml");
  assert.ok(
    rss?.href.endsWith("/rss.xml"),
    `${file}: invalid RSS discovery link`
  );
  await exists(rss.href);
  for (const link of tags(html, "a").filter(item =>
    item.href?.includes("rss.xml")
  )) {
    assert.ok(
      link.href.endsWith("/rss.xml"),
      `${file}: invalid visible RSS link`
    );
  }
  const image = new URL(meta("og:image"));
  if (image.origin === new URL(canonical).origin) await exists(image.href);

  const noindex = meta("robots")?.includes("noindex");
  if (/^(search[\\/]index\.html|404\.html)$/.test(file)) {
    assert.ok(noindex, `${file}: utility page should not be indexed`);
  }
  if (noindex) {
    assert.ok(
      !sitemap.has(canonical),
      `${file}: noindex page included in sitemap`
    );
    continue;
  }
  const schemas = [
    ...html.matchAll(
      /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
    ),
  ].flatMap(([, json]) => {
    const schema = JSON.parse(json);
    return schema["@graph"] ?? [schema];
  });
  assert.ok(
    schemas.some(item => item["@type"] === "WebSite"),
    `${file}: missing WebSite schema`
  );
  assert.ok(
    schemas.some(item => item["@type"] === "WebPage" && item.url === canonical),
    `${file}: missing canonical WebPage schema`
  );
  const article = schemas.find(item => item["@type"] === "BlogPosting");
  if (meta("og:type") === "article") {
    assert.ok(article, `${file}: missing BlogPosting schema`);
  }
  if (!article) continue;
  articleCount++;
  const headline = decode(
    html
      .match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]
      .replace(/<[^>]+>/g, "")
      .trim() ?? ""
  );
  assert.equal(
    article.headline,
    headline,
    `${file}: schema headline differs from the visible title`
  );
  assert.equal(
    article.description,
    meta("description"),
    `${file}: schema description mismatch`
  );
  assert.equal(
    article.author[0].name,
    meta("author"),
    `${file}: author mismatch`
  );
  assert.equal(article.url, canonical, `${file}: article URL mismatch`);
  assert.equal(article.mainEntityOfPage["@id"], `${canonical}#webpage`);
  assert.equal(article.image[0], image.href, `${file}: schema image mismatch`);
  assert.equal(article.datePublished, meta("article:published_time"));
  assert.ok(
    Number.isFinite(Date.parse(article.datePublished)),
    `${file}: invalid publication date`
  );
  assert.ok(
    Date.parse(article.dateModified) >= Date.parse(article.datePublished),
    `${file}: invalid modification date`
  );
  assert.ok(sitemap.has(canonical), `${file}: article missing from sitemap`);
  assert.ok(
    llms.includes(`(${canonical})`),
    `${file}: article missing from llms.txt`
  );
  assert.ok(
    html.includes("data-pagefind-body"),
    `${file}: missing static article`
  );
}

const robots = await read("robots.txt");
assert.match(robots, /User-agent: \*\s+Allow: \//);
assert.match(robots, /Sitemap: https:\/\/[^\s]+\/sitemap-index\.xml/);
assert.match(await read("rss.xml"), /<language>ko<\/language>/);
process.stdout.write(
  `SEO checks passed: ${files.length} HTML pages, ${articleCount} articles, ${sitemap.size} sitemap URLs.\n`
);
