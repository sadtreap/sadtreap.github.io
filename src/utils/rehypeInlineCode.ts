/**
 * Marks short inline code without spaces (flags, identifiers like `-O2`) as a
 * token that moves to the next line whole instead of splitting. Character
 * count can't promise it fits, so the CSS still wraps it inside its own box
 * when it is wider than the column. Longer code wraps like normal text.
 */
type Node = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
  value?: string;
};

const MAX_UNBROKEN = 30;

const text = (node: Node): string =>
  node.value ?? node.children?.map(text).join("") ?? "";

function mark(node: Node) {
  for (const child of node.children ?? []) {
    if (child.type !== "element") continue;
    if (child.tagName === "pre") continue;
    if (child.tagName === "code") {
      const value = text(child);
      if (!/\s/.test(value) && value.length <= MAX_UNBROKEN) {
        const classes = (child.properties?.className as string[]) ?? [];
        child.properties = {
          ...child.properties,
          className: [...classes, "token"],
        };
      }
      continue;
    }
    mark(child);
  }
}

export function rehypeInlineCode() {
  return mark;
}
