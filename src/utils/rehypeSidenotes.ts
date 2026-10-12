/**
 * Copies each GFM footnote next to its reference as a margin note.
 *
 * The footnote list at the end of the post stays as it is; the copy is
 * hidden from assistive tech and shown in the side column on wide screens.
 */
type Node = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
  value?: string;
};

const isElement = (node: Node, tagName?: string) =>
  node.type === "element" && (!tagName || node.tagName === tagName);

function walk(node: Node, visit: (node: Node) => void) {
  visit(node);
  node.children?.forEach(child => walk(child, visit));
}

function inlineContent(item: Node): Node[] {
  return (item.children ?? [])
    .flatMap(child =>
      isElement(child, "p") ? (child.children ?? []) : [child]
    )
    .filter(
      child =>
        !(
          isElement(child, "a") &&
          child.properties?.dataFootnoteBackref !== undefined
        )
    )
    .map(child => structuredClone(child));
}

export function rehypeSidenotes() {
  return (tree: Node) => {
    const notes = new Map<string, Node[]>();
    walk(tree, node => {
      if (
        isElement(node, "li") &&
        String(node.properties?.id ?? "").includes("fn-")
      ) {
        notes.set(String(node.properties?.id), inlineContent(node));
      }
    });
    if (notes.size === 0) return;

    walk(tree, parent => {
      const children = parent.children;
      if (!children) return;
      for (let i = children.length - 1; i >= 0; i--) {
        const sup = children[i];
        if (!isElement(sup, "sup")) continue;
        const ref = sup.children?.find(
          child =>
            isElement(child, "a") &&
            child.properties?.dataFootnoteRef !== undefined
        );
        const id = String(ref?.properties?.href ?? "").replace(/^#/, "");
        const content = notes.get(id);
        if (!ref || !content) continue;

        const label =
          ref.children?.map(child => child.value ?? "").join("") ?? "";
        children.splice(i + 1, 0, {
          type: "element",
          tagName: "span",
          properties: { className: ["sidenote"], ariaHidden: "true" },
          children: [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["sidenote-number"] },
              children: [{ type: "text", value: label }],
            },
            ...content,
          ],
        });
      }
    });
  };
}
