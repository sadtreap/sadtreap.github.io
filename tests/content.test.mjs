import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./helpers/load-module.mjs";

const NOW = Date.parse("2026-01-01T00:00:00Z");
const MARGIN = 15 * 60 * 1000;
const options = {
  mocks: {
    "@/config": `export default ${JSON.stringify({
      site: { lang: "ko-KR", timezone: "Asia/Seoul" },
      posts: { scheduledPostMargin: MARGIN },
    })};`,
  },
};

function post(id, data = {}) {
  return {
    id,
    body: "",
    data: {
      pubDatetime: new Date("2025-01-01T00:00:00Z"),
      tags: [],
      ...data,
    },
  };
}

test("production visibility respects drafts and the scheduling margin", async t => {
  t.mock.method(Date, "now", () => NOW);
  const { postFilter } = await loadModule("src/utils/postFilter.ts", options);

  assert.equal(postFilter(post("published")), true);
  assert.equal(postFilter(post("draft", { draft: true })), false);
  assert.equal(
    postFilter(
      post("within-margin", { pubDatetime: new Date(NOW + MARGIN - 1) })
    ),
    true
  );
  assert.equal(
    postFilter(post("at-margin", { pubDatetime: new Date(NOW + MARGIN) })),
    false
  );
  assert.equal(
    postFilter(post("future", { pubDatetime: new Date(NOW + MARGIN + 1) })),
    false
  );
});

test("development shows scheduled posts while still hiding drafts", async () => {
  const { postFilter } = await loadModule("src/utils/postFilter.ts", {
    ...options,
    dev: true,
  });
  const pubDatetime = new Date("9999-01-01T00:00:00Z");
  assert.equal(postFilter(post("future", { pubDatetime })), true);
  assert.equal(postFilter(post("draft", { pubDatetime, draft: true })), false);
});

test("post sorting preserves millisecond precision and does not mutate input", async t => {
  t.mock.method(Date, "now", () => NOW);
  const { getSortedPosts } = await loadModule(
    "src/utils/getSortedPosts.ts",
    options
  );
  const posts = [
    post("earlier", { pubDatetime: new Date("2025-06-01T00:00:00.100Z") }),
    post("updated", { modDatetime: new Date("2025-07-01T00:00:00Z") }),
    post("later", {
      pubDatetime: new Date("2025-06-01T00:00:00.900Z"),
      modDatetime: null,
    }),
    post("draft", { draft: true }),
    post("future", { pubDatetime: new Date("2027-01-01T00:00:00Z") }),
  ];
  const originalOrder = [...posts];

  assert.deepEqual(
    getSortedPosts(posts).map(({ id }) => id),
    ["updated", "later", "earlier"]
  );
  assert.deepEqual(posts, originalOrder);
});

test("tag groups keep one entry per post and preserve the first visible label", async t => {
  t.mock.method(Date, "now", () => NOW);
  const { getPostsByTag, getUniqueTags } = await loadModule(
    "src/utils/getUniqueTags.ts",
    options
  );
  const first = post("first", {
    tags: ["Hello World", "hello world", "zebra"],
  });
  const second = post("second", { tags: ["hello world", "alpha"] });
  const posts = [
    post("draft", { draft: true, tags: ["HELLO WORLD", "draft-only"] }),
    first,
    second,
    post("future", {
      pubDatetime: new Date("2027-01-01T00:00:00Z"),
      tags: ["future-only"],
    }),
  ];

  assert.deepEqual(getUniqueTags(posts), [
    { tag: "alpha", tagName: "alpha" },
    { tag: "hello-world", tagName: "Hello World" },
    { tag: "zebra", tagName: "zebra" },
  ]);
  const groups = getPostsByTag(posts);
  assert.deepEqual(groups[1].posts, [first, second]);
  assert.deepEqual(
    groups.map(group => group.posts.length),
    [1, 2, 1]
  );
  assert.deepEqual(getPostsByTag([]), []);
});

test("year/month formatting uses explicit order and the requested timezone", async () => {
  const { formatYearMonth, formatMonth } = await loadModule(
    "src/utils/postMeta.ts",
    options
  );
  const boundary = new Date("2025-12-31T15:30:00Z");

  assert.equal(formatYearMonth(boundary), "2026.01");
  assert.equal(formatYearMonth(boundary, "UTC"), "2025.12");
  assert.equal(formatMonth(boundary), "2026년 1월");
  assert.equal(formatMonth(boundary, "UTC"), "2025년 12월");
});

test("date formatters are reused for each format and timezone", async t => {
  const { formatDate, formatWeekday } = await loadModule(
    "src/utils/postMeta.ts",
    {
      mocks: {
        "@/config":
          'export default { site: { lang: "en-US", timezone: "UTC" } };',
      },
    }
  );
  const DateTimeFormat = Intl.DateTimeFormat;
  const formatter = t.mock.method(Intl, "DateTimeFormat", function (...args) {
    return new DateTimeFormat(...args);
  });
  const date = new Date("2026-01-01T00:00:00Z");

  assert.equal(formatDate(date), "January 1, 2026");
  assert.equal(formatDate(date, "UTC"), "January 1, 2026");
  assert.equal(formatter.mock.callCount(), 1);
  assert.equal(formatDate(date, "America/Los_Angeles"), "December 31, 2025");
  assert.equal(formatWeekday(date), "Thursday");
  assert.equal(formatWeekday(date), "Thursday");
  assert.equal(formatter.mock.callCount(), 3);
});
