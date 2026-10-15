import type { CollectionEntry } from "astro:content";
import config from "@/config";

type Post = CollectionEntry<"posts">;

const CHARS_PER_MINUTE = 500;

/** Reading time in minutes, estimated from the raw Markdown length. */
export function getReadingMinutes(post: Post): number {
  const chars = (post.body ?? "").replace(/\s+/g, "").length;
  return Math.max(1, Math.round(chars / CHARS_PER_MINUTE));
}

function createFormatter(
  options: Intl.DateTimeFormatOptions,
  locale = config.site.lang
) {
  const formatters = new Map<string, Intl.DateTimeFormat>();

  return (timezone = config.site.timezone) => {
    let formatter = formatters.get(timezone);
    if (!formatter) {
      formatter = new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        ...options,
      });
      formatters.set(timezone, formatter);
    }
    return formatter;
  };
}

const dateFormatter = createFormatter({
  year: "numeric",
  month: "long",
  day: "numeric",
});
const weekdayFormatter = createFormatter({ weekday: "long" });
const monthFormatter = createFormatter({ year: "numeric", month: "long" });
const yearMonthFormatter = createFormatter(
  { year: "numeric", month: "2-digit" },
  "en-CA"
);

/** e.g. "2026년 10월 10일" */
export const formatDate = (date: Date, timezone?: string) =>
  dateFormatter(timezone).format(date);

/** e.g. "토요일" */
export const formatWeekday = (date: Date, timezone?: string) =>
  weekdayFormatter(timezone).format(date);

/** e.g. "2026.08" */
export function formatYearMonth(date: Date, timezone?: string) {
  const parts = yearMonthFormatter(timezone).formatToParts(date);
  const year = parts.find(part => part.type === "year")!.value;
  const month = parts.find(part => part.type === "month")!.value;
  return `${year}.${month}`;
}

/** e.g. "2026년 10월" */
export const formatMonth = (date: Date, timezone?: string) =>
  monthFormatter(timezone).format(date);
