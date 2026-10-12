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
    readMore: "더 읽기",
    readingTime: "{{minutes}}분 읽기",
    contents: "Contents",
    author: "Author",
    published: "Published",
    updated: "Updated",
    topics: "Topics",
    reading: "Reading",
    minutes: "{{minutes}}분",
    reuse: "Reuse",
    reuseText:
      "글과 그림은 CC BY 4.0으로 공개합니다. 출처를 밝히면 자유롭게 다시 쓸 수 있습니다.",
    citation: "Citation",
    previousPost: "이전 글",
    nextPost: "다음 글",
    morePosts: "다른 글",
  },
  pagination: {
    prev: "이전",
    next: "다음",
  },
  home: {
    recentPosts: "최근 글",
    allPosts: "모든 글 보기",
    dateAndReading: "Date · Reading",
  },
  footer: {
    license: "CC BY 4.0",
  },
  pages: {
    tagTitle: "Tag",
    tagsTitle: "Tags",
    postCount: "{{count}}편",
    postsTitle: "모든 글",
    archivesTitle: "Archives",
    searchTitle: "Search",
  },
  a11y: {
    skipToContent: "본문으로 건너뛰기",
    openMenu: "메뉴 열기",
    closeMenu: "메뉴 닫기",
    toggleTheme: "테마 바꾸기",
    goToPreviousPage: "이전 페이지로",
    goToNextPage: "다음 페이지로",
  },
  notFound: {
    title: "404 Not Found",
    message: "페이지를 찾을 수 없습니다.",
    goHome: "처음으로",
  },
} satisfies UIStrings;
