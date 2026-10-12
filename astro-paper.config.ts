import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://sadtreap.github.io/",
    title: "sadtreap's blog",
    description: "tomorrow is another day",
    author: "JooYeong Kim",
    profile: "https://github.com/sadtreap",
    ogImage: "default-og.png",
    lang: "ko",
    timezone: "Asia/Seoul",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: false,
    showArchives: true,
    showBackButton: true,
    editPost: { enabled: false },
    search: "pagefind",
  },
  socials: [{ name: "github", url: "https://github.com/sadtreap" }],
  shareLinks: [],
});
