import type { CollectionEntry } from "astro:content";
import config from "@/config";

type Post = CollectionEntry<"posts">;

const CHARS_PER_MINUTE = 500;

/** Reading time in minutes, estimated from the raw Markdown length. */
export function getReadingMinutes(post: Post): number {
  const chars = (post.body ?? "").replace(/\s+/g, "").length;
  return Math.max(1, Math.round(chars / CHARS_PER_MINUTE));
}

function format(
  date: Date,
  timezone: string | undefined,
  options: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat(config.site.lang, {
    timeZone: timezone ?? config.site.timezone,
    ...options,
  }).format(date);
}

/** e.g. "2026년 10월 10일" */
export const formatDate = (date: Date, timezone?: string) =>
  format(date, timezone, { year: "numeric", month: "long", day: "numeric" });

/** e.g. "토요일" */
export const formatWeekday = (date: Date, timezone?: string) =>
  format(date, timezone, { weekday: "long" });

/** e.g. "2026.08" */
export const formatYearMonth = (date: Date, timezone?: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone ?? config.site.timezone,
    year: "numeric",
    month: "2-digit",
  })
    .format(date)
    .replace("-", ".");

/** e.g. "2026년 10월" */
export const formatMonth = (date: Date, timezone?: string) =>
  format(date, timezone, { year: "numeric", month: "long" });
