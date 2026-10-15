import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";
import { slugifyStr } from "./slugify";

type Tag = {
  tag: string;
  tagName: string;
};

type TagGroup = Tag & { posts: CollectionEntry<"posts">[] };

/** Group visible posts by tag slug, counting each post once per slug. */
export function getPostsByTag(posts: CollectionEntry<"posts">[]): TagGroup[] {
  const groups = new Map<string, TagGroup>();
  const slugs = new Map<string, string>();

  for (const post of posts) {
    if (!postFilter(post)) continue;
    const seen = new Set<string>();

    for (const tagName of post.data.tags) {
      let tag = slugs.get(tagName);
      if (tag === undefined) {
        tag = slugifyStr(tagName);
        slugs.set(tagName, tag);
      }
      if (seen.has(tag)) continue;
      seen.add(tag);

      const group = groups.get(tag);
      if (group) {
        group.posts.push(post);
      } else {
        groups.set(tag, { tag, tagName, posts: [post] });
      }
    }
  }

  return [...groups.values()].sort((a, b) => a.tag.localeCompare(b.tag));
}

/**
 * Builds a de-duplicated, sorted tag list from posts.
 *
 * - Drafts and scheduled posts are excluded via `postFilter()`
 * - `tag` is the slug used in URLs; `tagName` is the original label for display
 * - Uniqueness is based on the slug (so differently-cased labels collapse)
 */
export function getUniqueTags(posts: CollectionEntry<"posts">[]) {
  return getPostsByTag(posts).map(({ tag, tagName }) => ({ tag, tagName }));
}
