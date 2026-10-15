/** Wraps every table in a div that scrolls sideways on narrow screens. */
import { classNames, isElement, type RehypeNode } from "./rehypeUtils";

function wrapTables(node: RehypeNode) {
  const children = node.children;
  if (!children) return;

  const isWrapper =
    isElement(node, "div") && classNames(node).includes("table-scroll");
  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    wrapTables(child);
    if (isElement(child, "table") && !isWrapper) {
      children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["table-scroll"] },
        children: [child],
      };
    }
  }
}

export function rehypeTableScroll() {
  return wrapTables;
}
