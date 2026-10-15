/**
 * Marks short inline code without spaces (flags, identifiers like `-O2`) as a
 * token that moves to the next line whole instead of splitting. Character
 * count can't promise it fits, so the CSS still wraps it inside its own box
 * when it is wider than the column. Longer code wraps like normal text.
 */
import {
  classNames,
  isElement,
  nodeText,
  type RehypeNode,
} from "./rehypeUtils";

const MAX_UNBROKEN = 30;

function mark(node: RehypeNode) {
  for (const child of node.children ?? []) {
    if (isElement(child, "pre")) continue;
    if (isElement(child, "code")) {
      const value = nodeText(child);
      if (!/\s/.test(value) && value.length <= MAX_UNBROKEN) {
        const classes = classNames(child);
        if (!classes.includes("token")) {
          child.properties = {
            ...child.properties,
            className: [...classes, "token"],
          };
        }
      }
      continue;
    }
    mark(child);
  }
}

export function rehypeInlineCode() {
  return mark;
}
