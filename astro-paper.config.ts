import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://sadtreap.github.io/",
    title: "sadtreap's blog",
    description: "Personal research and practical experiences.",
    author: "JooYeong Kim",
    profile: "https://github.com/sadtreap",
    focus: "C++, 어셈블리, 알고리즘, 벤치마크",
    ogImage: "default-og.png",
    lang: "ko",
    timezone: "Asia/Seoul",
    dir: "ltr",
  },
  posts: {
    perPage: 10,
    perIndex: 8,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    showArchives: true,
    search: "pagefind",
  },
  socials: [{ name: "GitHub", url: "https://github.com/sadtreap" }],
});
