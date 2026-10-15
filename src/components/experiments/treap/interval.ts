import { build } from "./treap";

const COL = 40;
const ROW = 32;
const R = 13;
const TOP = R + 8;

const x_ = (k: number) => `<i>x</i><sub>${k + 1}</sub>`;
// Read aloud, 2, 4, 5 and 9 end in a vowel.
const vowelEnd = (k: number) => "2459".includes(String(k + 1).at(-1)!);
const eun = (k: number) => x_(k) + (vowelEnd(k) ? "는" : "은");
const ga = (k: number) => x_(k) + (vowelEnd(k) ? "가" : "이");
const ida = (k: number) => x_(k) + (vowelEnd(k) ? "다" : "이다");

function topOf(pri: number[], lo: number, hi: number) {
  let top = lo;
  for (let k = lo + 1; k <= hi; k++) if (pri[k] < pri[top]) top = k;
  return top;
}

/**
 * The treap in the key-priority plane: the column is the key, the row is the
 * priority, smaller on top. Shades keys j..i and rings the topmost node there.
 */
export function renderPlane(pri: number[], i: number, j: number) {
  const n = pri.length;
  const { parent } = build(pri);
  const lo = Math.min(i, j);
  const hi = Math.max(i, j);
  const top = topOf(pri, lo, hi);
  const w = n * COL;
  const h = 2 * TOP + (n - 1) * ROW;
  const x = (k: number) => (k + 0.5) * COL;
  const y = (k: number) => TOP + (pri[k] - 1) * ROW;
  const edge = (k: number) =>
    `M${x(k)} ${y(k)}L${x(parent[k])} ${y(parent[k])}`;

  const path = new Set<number>();
  for (let k = i; parent[k] >= 0; k = parent[k]) path.add(k);
  const others = parent.map((q, k) => (q < 0 || path.has(k) ? "" : edge(k)));

  return (
    `<svg class="tp-svg" viewBox="0 0 ${w} ${h}" role="img" ` +
    `aria-label="키 순서대로 우선순위 ${pri.join(", ")}">` +
    `<rect class="tp-canvas" width="${w}" height="${h}" rx="3" />` +
    `<rect class="tp-band" x="${lo * COL}" width="${(hi - lo + 1) * COL}" height="${h}" />` +
    `<path class="tp-edge" d="${others.join("")}" />` +
    `<path class="tp-edge tp-path" d="${[...path].map(edge).join("")}" />` +
    `<circle class="tp-ring" cx="${x(top)}" cy="${y(top)}" r="${R + 4}" />` +
    pri
      .map(
        (p, k) =>
          `<g class="tp-node${k === i ? " tp-on" : ""}">` +
          `<circle cx="${x(k)}" cy="${y(k)}" r="${R}" />` +
          `<text x="${x(k)}" y="${y(k)}" dy="0.35em">${p}</text></g>`
      )
      .join("") +
    pri
      .map((_, k) =>
        k === i
          ? ""
          : `<rect class="tp-hit" data-col="${k}" x="${k * COL}" width="${COL}" height="${h}" />`
      )
      .join("") +
    `</svg>`
  );
}

export function describe(pri: number[], i: number, j: number) {
  const lo = Math.min(i, j);
  const hi = Math.max(i, j);
  const top = topOf(pri, lo, hi);
  const size = hi - lo + 1;
  const range = `구간 [${x_(lo)}, ${x_(hi)}]에서 맨 위에 있는 점은`;

  const verdict =
    top === j
      ? `${range} ${x_(j)} 자신이다. 그래서 ${eun(j)} ${x_(i)}의 조상이다.`
      : top === i
        ? `${range} ${x_(i)} 자신이다. 그래서 ${eun(j)} 조상이 아니고, 거꾸로 ${ga(i)} ${x_(j)}의 조상이다.`
        : `${range} ${ida(top)}. ${ga(j)} 아니니 ${eun(j)} ${x_(i)}의 조상이 아니다. ${eun(top)} 둘의 공통 조상이다.`;

  return (
    verdict +
    ` 우선순위를 무작위로 섞으면 이 구간의 ${size}개 중 ${ga(j)} 맨 위에 올 확률은 1/${size}이다.`
  );
}
