/** Wraps every table in a div that scrolls sideways on narrow screens. */
type Node = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
};

function wrapTables(node: Node) {
  node.children = node.children?.map(child => {
    if (child.type === "element" && child.tagName === "table") {
      return {
        type: "element",
        tagName: "div",
        properties: { className: ["table-scroll"] },
        children: [child],
      };
    }
    wrapTables(child);
    return child;
  });
}

export function rehypeTableScroll() {
  return wrapTables;
}
