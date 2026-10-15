import { build } from "./treap";

const COL = 40;
const ROW = 40;
const R = 14;
const TOP = R + 6;

/**
 * A small treap laid out by depth. The column is the key, the number in each
 * node is its priority. The canvas always has room for a chain, so trees drawn
 * side by side share one scale.
 */
export function renderPanel(title: string, pri: number[]) {
  const n = pri.length;
  const { parent, depth, height } = build(pri);
  const w = n * COL;
  const h = 2 * TOP + (n - 1) * ROW;
  const x = (k: number) => (k + 0.5) * COL;
  const y = (k: number) => TOP + depth[k] * ROW;
  const edges = parent
    .map((q, k) => (q < 0 ? "" : `M${x(k)} ${y(k)}L${x(q)} ${y(q)}`))
    .join("");

  return (
    `<p class="tp-head"><b>${title}</b><span>높이 ${height}</span></p>` +
    `<svg class="tp-svg" viewBox="0 0 ${w} ${h + 22}" role="img" ` +
    `aria-label="키 1부터 ${n}에 우선순위 ${pri.join(", ")}, 높이 ${height}">` +
    `<rect class="tp-canvas" width="${w}" height="${h}" rx="3" />` +
    `<path class="tp-edge" d="${edges}" />` +
    pri
      .map(
        (p, k) =>
          `<g class="tp-node"><circle cx="${x(k)}" cy="${y(k)}" r="${R}" />` +
          `<text x="${x(k)}" y="${y(k)}" dy="0.35em">${p}</text></g>`
      )
      .join("") +
    `<g class="tp-axis">` +
    pri
      .map((_, k) => `<text x="${x(k)}" y="${h + 16}">${k + 1}</text>`)
      .join("") +
    `</g></svg>`
  );
}
