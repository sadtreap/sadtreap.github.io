import type { UIStrings } from "../types";

export default {
  nav: {
    posts: "Posts",
    tags: "Tags",
    projects: "Projects",
    about: "About",
    archives: "Archives",
    search: "Search",
  },
  post: {
    readMore: "Read more",
    readingTime: "{{minutes}} min read",
    contents: "Contents",
    author: "Author",
    published: "Published",
    updated: "Updated",
    topics: "Topics",
    reading: "Reading",
    minutes: "{{minutes}} min",
    reuse: "Reuse",
    reuseText: "Text and figures are licensed under CC BY 4.0.",
    citation: "Citation",
    previousPost: "Previous",
    nextPost: "Next",
    morePosts: "More posts",
  },
  pagination: {
    prev: "Prev",
    next: "Next",
  },
  home: {
    recentPosts: "Recent posts",
    allPosts: "All posts",
    dateAndReading: "Date · Reading",
  },
  footer: {
    license: "CC BY 4.0",
  },
  pages: {
    tagTitle: "Tag",
    tagsTitle: "Tags",
    postCount: "{{count}} posts",
    postsTitle: "Posts",
    archivesTitle: "Archives",
    searchTitle: "Search",
  },
  a11y: {
    skipToContent: "Skip to content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    toggleTheme: "Toggle theme",
    goToPreviousPage: "Go to previous page",
    goToNextPage: "Go to next page",
  },
  notFound: {
    title: "404 Not Found",
    message: "Page not found.",
    goHome: "Go back home",
  },
} satisfies UIStrings;
