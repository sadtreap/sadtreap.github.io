/**
 * Marks short inline code without spaces (flags, identifiers like `-O2`) so
 * it stays on one line. Longer code is left to wrap so it can't widen the page.
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
          className: [...classes, "nowrap"],
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
