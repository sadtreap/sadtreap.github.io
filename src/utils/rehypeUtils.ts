export type RehypeNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: RehypeNode[];
  value?: string;
};

export const isElement = (node: RehypeNode, tagName?: string) =>
  node.type === "element" && (!tagName || node.tagName === tagName);

export function classNames(node: RehypeNode): string[] {
  const value = node.properties?.className;
  if (Array.isArray(value)) {
    return value.filter((name): name is string => typeof name === "string");
  }
  return typeof value === "string" ? value.split(/\s+/).filter(Boolean) : [];
}

export const nodeText = (node: RehypeNode): string =>
  node.value ?? node.children?.map(nodeText).join("") ?? "";
