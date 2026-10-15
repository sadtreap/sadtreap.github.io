import assert from "node:assert/strict";
import test from "node:test";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { loadModule } from "./helpers/load-module.mjs";

const [{ rehypeSidenotes }, { rehypeInlineCode }, { rehypeTableScroll }] =
  await Promise.all([
    loadModule("src/utils/rehypeSidenotes.ts"),
    loadModule("src/utils/rehypeInlineCode.ts"),
    loadModule("src/utils/rehypeTableScroll.ts"),
  ]);

const text = value => ({ type: "text", value });
const element = (tagName, children = [], properties = {}) => ({
  type: "element",
  tagName,
  properties,
  children,
});
const root = (...children) => ({ type: "root", children });
const reference = (id, label = "1") =>
  element("sup", [
    element("a", [text(label)], {
      href: `#${id}`,
      dataFootnoteRef: true,
      id: `ref-${id}-${label}`,
    }),
  ]);
const footnotes = (...notes) =>
  element("section", [element("ol", notes)], { dataFootnotes: true });
const note = (id, ...children) => element("li", children, { id });
const backlink = () =>
  element("a", [text("↩")], { dataFootnoteBackref: "", href: "#ref" });
const descendants = node => [
  node,
  ...(node.children ?? []).flatMap(descendants),
];
const sidenotes = tree =>
  descendants(tree).filter(node =>
    node.properties?.className?.includes("sidenote")
  );

test("repeated footnotes create independent copies without duplicate IDs", () => {
  const originalLink = element("a", [text("Source")], {
    href: "https://example.com",
    id: "source",
  });
  const originalCode = element("code", [text("--flag")]);
  const section = footnotes(
    note("fn-example", element("p", [originalLink, originalCode, backlink()]))
  );
  const sectionBefore = structuredClone(section);
  const tree = root(
    element("p", [reference("fn-example"), reference("fn-example", "2")]),
    section
  );

  rehypeSidenotes()(tree);
  const [first, second] = sidenotes(tree);
  assert.equal(sidenotes(tree).length, 2);
  assert.deepEqual(section, sectionBefore);
  assert.equal(first.children[1].properties.id, undefined);
  assert.equal(first.children[1].properties.tabIndex, -1);
  assert.equal(originalLink.properties.tabIndex, undefined);
  assert.equal(
    descendants(first).some(
      node => node.properties?.dataFootnoteBackref !== undefined
    ),
    false
  );
  first.children[2].properties.className = ["first-copy"];
  assert.equal(second.children[2].properties.className, undefined);
  assert.equal(originalCode.properties.className, undefined);

  const beforeSecondPass = structuredClone(tree);
  rehypeSidenotes()(tree);
  assert.deepEqual(tree, beforeSecondPass);
});

test("self-referencing footnotes terminate and leave the original list unchanged", () => {
  const section = footnotes(
    note(
      "fn-cycle",
      element("p", [text("See "), reference("fn-cycle", "2"), backlink()])
    )
  );
  const before = structuredClone(section);
  const tree = root(element("p", [reference("fn-cycle")]), section);

  rehypeSidenotes()(tree);

  assert.equal(sidenotes(tree).length, 1);
  assert.deepEqual(section, before);
  const ids = descendants(tree)
    .map(node => node.properties?.id)
    .filter(Boolean);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(
    descendants(sidenotes(tree)[0]).some(node => node.properties?.id),
    false
  );
});

test("block footnotes and unrelated list items stay out of the margin", () => {
  const tree = root(
    element("p", [reference("fn-block"), reference("fn-unrelated")]),
    element("ul", [
      note("fn-unrelated", element("p", [text("Ordinary list")])),
    ]),
    footnotes(
      note("fn-block", element("pre", [element("code", [text("code")])]))
    )
  );
  const before = structuredClone(tree);

  rehypeSidenotes()(tree);

  assert.deepEqual(tree, before);
});

test("short inline code keeps existing classes and is marked once inside MDX", () => {
  const code = element("code", [text("--flag")], {
    className: "custom highlighted",
  });
  const tree = root({
    type: "mdxJsxFlowElement",
    children: [element("p", [code])],
  });

  rehypeInlineCode()(tree);
  rehypeInlineCode()(tree);

  assert.deepEqual(code.properties.className, [
    "custom",
    "highlighted",
    "token",
  ]);
});

test("block, spaced, and long code retain their existing wrapping behavior", () => {
  const tree = root(
    element("pre", [element("code", [text("short")])]),
    element("p", [
      element("code", [text("two words")]),
      element("code", [text("x".repeat(31))]),
    ])
  );
  const before = structuredClone(tree);

  rehypeInlineCode()(tree);

  assert.deepEqual(tree, before);
});

test("table wrapping is repeatable and preserves leaf nodes", () => {
  const value = text("Cell");
  const table = element("table", [element("tr", [element("td", [value])])]);
  const tree = root(element("p", [text("Before")]), table);

  rehypeTableScroll()(tree);
  assert.equal(tree.children[1].tagName, "div");
  assert.equal(tree.children[1].children[0], table);
  assert.equal(Object.hasOwn(value, "children"), false);
  const before = structuredClone(tree);
  rehypeTableScroll()(tree);
  assert.deepEqual(tree, before);
});

test("existing table wrappers are recognized when className is a string", () => {
  const tree = root(
    element("div", [element("table")], { className: "wide table-scroll" })
  );
  const before = structuredClone(tree);

  rehypeTableScroll()(tree);

  assert.deepEqual(tree, before);
});

test("the Astro Markdown pipeline renders repeated footnotes and scrollable tables", async () => {
  const processor = await createMarkdownProcessor({
    syntaxHighlight: false,
    rehypePlugins: [rehypeSidenotes, rehypeTableScroll, rehypeInlineCode],
  });
  const { code } = await processor.render(
    [
      "First[^note] and again[^note].",
      "",
      "| Name |",
      "| --- |",
      "| Value |",
      "",
      "[^note]: `--flag` and [source](https://example.com).",
    ].join("\n")
  );

  assert.equal([...code.matchAll(/class="sidenote"/g)].length, 2);
  assert.equal(
    [...code.matchAll(/<code class="token">--flag<\/code>/g)].length,
    3
  );
  assert.match(code, /<div class="table-scroll">\s*<table>/);
  const ids = [...code.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const section = code.slice(code.indexOf("<section"));
  assert.doesNotMatch(section, /class="sidenote"/);
  assert.match(section, /data-footnote-backref/);
});
