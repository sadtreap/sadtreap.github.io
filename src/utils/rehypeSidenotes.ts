import {
  classNames,
  isElement,
  nodeText,
  type RehypeNode,
} from "./rehypeUtils";

/**
 * Copies each GFM footnote next to its reference as a margin note.
 * The original footnote list stays accessible and unchanged. Block content
 * stays in that list, since it cannot be placed inside an inline note.
 */
const isFootnotes = (node: RehypeNode) =>
  isElement(node, "section") && node.properties?.dataFootnotes !== undefined;

const isSidenote = (node: RehypeNode) =>
  isElement(node, "span") && classNames(node).includes("sidenote");

function walk(node: RehypeNode, visit: (node: RehypeNode) => void | false) {
  if (visit(node) === false) return;
  node.children?.forEach(child => walk(child, visit));
}

const isBlank = (node: RehypeNode) =>
  node.type === "text" && !String(node.value ?? "").trim();

function inlineContent(item: RehypeNode): RehypeNode[] | null {
  const children = item.children ?? [];
  if (children.some(child => !isElement(child, "p") && !isBlank(child))) {
    return null;
  }
  return children
    .flatMap(child =>
      isElement(child, "p") ? (child.children ?? []) : [child]
    )
    .filter(
      child =>
        !(
          isElement(child, "a") &&
          child.properties?.dataFootnoteBackref !== undefined
        )
    );
}

function copyContent(content: RehypeNode[]): RehypeNode[] {
  const copy = structuredClone(content);
  for (const child of copy) {
    walk(child, node => {
      if (!node.properties) return;
      // Fragment links must keep targeting the original, accessible footnotes.
      delete node.properties.id;
      if (
        (isElement(node, "a") && node.properties.href !== undefined) ||
        node.properties.tabIndex !== undefined
      ) {
        node.properties.tabIndex = -1;
      }
    });
  }
  return copy;
}

function insertSidenotes(parent: RehypeNode, notes: Map<string, RehypeNode[]>) {
  if (isFootnotes(parent) || isSidenote(parent)) return;
  const children = parent.children;
  if (!children) return;
  let withNotes: RehypeNode[] | undefined;

  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    withNotes?.push(child);
    insertSidenotes(child, notes);
    if (!isElement(child, "sup")) continue;

    const ref = child.children?.find(
      node =>
        isElement(node, "a") && node.properties?.dataFootnoteRef !== undefined
    );
    const href = ref?.properties?.href;
    if (!ref || typeof href !== "string" || !href.startsWith("#")) continue;
    const content = notes.get(href.slice(1));
    if (!content || (children[index + 1] && isSidenote(children[index + 1]))) {
      continue;
    }

    withNotes ??= children.slice(0, index + 1);
    withNotes.push({
      type: "element",
      tagName: "span",
      properties: { className: ["sidenote"], ariaHidden: "true" },
      children: [
        {
          type: "element",
          tagName: "span",
          properties: { className: ["sidenote-number"] },
          children: [{ type: "text", value: nodeText(ref) }],
        },
        ...copyContent(content),
      ],
    });
  }
  // Only traverse original nodes; copied footnotes may contain more references.
  if (withNotes) parent.children = withNotes;
}

export function rehypeSidenotes() {
  return (tree: RehypeNode) => {
    const notes = new Map<string, RehypeNode[]>();
    walk(tree, node => {
      if (!isFootnotes(node)) return;
      walk(node, item => {
        if (!isElement(item, "li") || typeof item.properties?.id !== "string") {
          return;
        }
        const content = inlineContent(item);
        if (content) notes.set(item.properties.id, content);
      });
      return false;
    });
    if (notes.size > 0) insertSidenotes(tree, notes);
  };
}
