import type { CollectionEntry } from "astro:content";
import config from "@/config";

/**
 * Determines whether a post is eligible to be listed/rendered.
 *
 * - Excludes drafts always
 * - In production, excludes scheduled posts until `pubDatetime` minus the configured margin
 * - In dev, always shows non-draft posts to make authoring easier
 */
export function postFilter({ data }: CollectionEntry<"posts">) {
  if (data.draft) return false;
  if (import.meta.env.DEV) return true;

  return (
    Date.now() > data.pubDatetime.getTime() - config.posts.scheduledPostMargin
  );
}
