/*
 * Sheet stacks for the AHC074 post, drawn with the problem's own notation:
 * each row is one sheet from top to bottom, "." is a hole. A cell is "on"
 * when that sheet is the one visible through the window.
 */

export type SheetRow = {
  n: string; // sheet label
  p: string; // pattern
  g?: string; // group label, shown when the group changes
  mv?: boolean; // moved in this step
  note?: string;
};

export type SheetFig = {
  head?: string; // window numbers
  split?: number; // gap before this column
  groups?: boolean; // show the group column
  flat?: boolean; // just the patterns, no visibility
  rows: SheetRow[];
  eq?: string; // note on the visible row
  target?: string; // compare the visible row with this
  marks?: string; // "1" puts a ^ under the column
  marksNote?: string;
  small?: boolean;
};

export type Cell = { ch: string; on: boolean; sp: boolean };

export type Line = {
  kind: "head" | "row" | "out" | "goal" | "mark";
  group: string;
  label: string;
  cells: Cell[];
  note?: string;
  mv?: boolean;
  gap?: boolean;
};

const TX = "10110101";
const H8 = { head: "01234567", split: 3 };

export const FIGS: Record<string, SheetFig> = {
  ex0: {
    head: "0123",
    rows: [
      { n: "시트 0", p: "10.1" },
      { n: "시트 1", p: "1100" },
      { n: "시트 2", p: "0.1." },
    ],
  },
  ex1: {
    head: "0123",
    rows: [
      { n: "시트 1", p: "1100" },
      { n: "시트 2", p: "0.1." },
      { n: "시트 0", p: "10.1", mv: true, note: "← 맨 아래로" },
    ],
  },

  opq: {
    ...H8,
    rows: [
      { n: "1", p: "01010011" },
      { n: "2", p: "10001100" },
      { n: "X", p: TX, note: "← 주문은 X인데 가려져서 못 뽑는다" },
    ],
  },

  s4a: {
    ...H8,
    groups: true,
    rows: [
      { n: "1", p: "0..10011", g: "그룹 0" },
      { n: "2", p: "1..01100", g: "그룹 0" },
      { n: "3", p: "01.00110", g: "그룹 1" },
      { n: "X", p: "10.10101", g: "그룹 1" },
      { n: "5", p: "11001011", g: "그룹 2" },
      { n: "6", p: "00111110", g: "그룹 2" },
    ],
  },
  s4b: {
    ...H8,
    groups: true,
    eq: "= X",
    rows: [
      { n: "X", p: "10.10101", g: "맨 위", mv: true, note: "← ② 맨 위로" },
      { n: "1", p: "0..10011", g: "그룹 0" },
      { n: "2", p: "1..01100", g: "그룹 0" },
      { n: "3", p: "01.00110", g: "그룹 1", mv: true, note: "← ① 아래로" },
      { n: "6", p: "00111110", g: "그룹 2" },
      { n: "5", p: "11001011", g: "그룹 2", mv: true, note: "← ③ 아래로" },
    ],
    target: TX,
  },

  pair: {
    ...H8,
    flat: true,
    marks: "00110100",
    marksNote: "← 서로 다른 칸",
    rows: [
      { n: "X", p: TX },
      { n: "Y", p: "10000001" },
      { n: "P", p: "10..0.01", mv: true, note: "← 둘이 같이 쓰는 페어 시트" },
    ],
  },

  s5x: {
    head: "34567",
    eq: "= X",
    rows: [
      { n: "P", p: ".0.01", g: "t" },
      { n: "C", p: ".0110", g: "b" },
      { n: "B", p: "1.0.1", g: "b" },
      { n: "A", p: "01.0.", g: "b" },
    ],
  },
  s5y: {
    head: "34567",
    eq: "= Y",
    rows: [
      { n: "P", p: ".0.01", g: "t" },
      { n: "A", p: "01.0.", g: "b" },
      { n: "B", p: "1.0.1", g: "b" },
      { n: "C", p: ".0110", g: "b" },
    ],
  },

  s6a: {
    ...H8,
    groups: true,
    target: TX,
    rows: [
      { n: "A", p: "...01.0.", g: "베이스" },
      { n: "B", p: "...1.0.1", g: "베이스" },
      { n: "C", p: "....0110", g: "베이스" },
      { n: "1", p: "0..10011", g: "그룹 0" },
      { n: "2", p: "1..01100", g: "그룹 0" },
      { n: "3", p: "01.00110", g: "그룹 1" },
      { n: "P", p: "10..0.01", g: "그룹 1" },
      { n: "5", p: "11001011", g: "그룹 2" },
      { n: "6", p: "00111110", g: "그룹 2" },
    ],
  },
  s6c: {
    ...H8,
    groups: true,
    eq: "= 목표",
    target: TX,
    rows: [
      { n: "P", p: "10..0.01", g: "맨 위", mv: true, note: "← ④ 맨 위로" },
      { n: "C", p: "....0110", g: "베이스", mv: true, note: "← ③ 맨 위로" },
      { n: "B", p: "...1.0.1", g: "베이스" },
      { n: "A", p: "...01.0.", g: "베이스", mv: true, note: "← ② 맨 아래로" },
      { n: "1", p: "0..10011", g: "그룹 0" },
      { n: "2", p: "1..01100", g: "그룹 0" },
      { n: "3", p: "01.00110", g: "그룹 1", mv: true, note: "← ① 아래로" },
      { n: "6", p: "00111110", g: "그룹 2" },
      { n: "5", p: "11001011", g: "그룹 2", mv: true, note: "← ⑤ 아래로" },
    ],
  },

  lf0: {
    head: "0123",
    groups: true,
    target: "1101",
    rows: [
      { n: "T", p: "1...", g: "맨 위" },
      { n: "1", p: "0...", g: "그룹 0" },
      { n: "2", p: "00..", g: "그룹 1" },
      { n: "3", p: "11..", g: "그룹 1" },
      { n: "4", p: "101.", g: "그룹 2" },
      { n: "5", p: "010.", g: "그룹 2" },
      { n: "L", p: "0101", g: "그룹 3" },
      { n: "7", p: "1010", g: "그룹 3" },
    ],
  },
  lf1: {
    head: "0123",
    groups: true,
    eq: "= 목표",
    target: "1101",
    rows: [
      { n: "T", p: "1...", g: "맨 위" },
      { n: "1", p: "0...", g: "그룹 0" },
      { n: "L", p: "0101", g: "", mv: true, note: "← 그룹 1 윗장 위로" },
      { n: "2", p: "00..", g: "그룹 1" },
      { n: "3", p: "11..", g: "그룹 1" },
      { n: "4", p: "101.", g: "그룹 2" },
      { n: "5", p: "010.", g: "그룹 2" },
      { n: "7", p: "1010", g: "그룹 3" },
    ],
  },
};

// seed 0: the six base sheets a.cpp printed. Columns where all six are holes
// are group windows.
const BASE6 = [
  "....1....1....1.........1....0.0.....1..00...0..1.1..0..........",
  ".0.......0...0..0..........1.10............0.1...1.1.1..0.......",
  "......1....0.......101......0.1.........1........0..0..1..0.1...",
  "......0......1.................1.....0.1.1.1..1...0.......1.00.0",
  ".1.00..1......0.1....0.............................01..0.....1.1",
  "...1...0...1.......01...0..01..........0......0.0.......1.......",
];

FIGS.base6 = {
  flat: true,
  small: true,
  marks: Array.from({ length: 64 }, (_, j) =>
    BASE6.every(r => r[j] === ".") ? "1" : "0"
  ).join(""),
  rows: BASE6.map((p, i) => ({ n: String(i), p })),
};

// seed 0: sheets per group, and how many of them are pair sheets.
export const GROUP_SIZE = [
  2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 6, 6, 8, 8, 8, 8, 8, 10, 10, 10, 10, 10, 12,
  12, 12,
];
export const GROUP_PAIRS = [
  1, 1, 2, 2, 1, 2, 2, 3, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4,
];

export function layout(fig: SheetFig): Line[] {
  const { rows, split = 0 } = fig;
  const n = rows[0].p.length;
  const vis = Array.from({ length: n }, (_, j) =>
    rows.findIndex(r => r.p[j] !== ".")
  );
  const cells = (s: string, on: (j: number) => boolean): Cell[] =>
    [...s].map((ch, j) => ({ ch, on: on(j), sp: split > 0 && j === split }));

  const out: Line[] = [];
  if (fig.head) {
    out.push({
      kind: "head",
      group: "",
      label: "",
      cells: cells(fig.head, () => false),
    });
  }
  rows.forEach((r, i) => {
    const newGroup = i > 0 && r.g !== rows[i - 1].g;
    out.push({
      kind: "row",
      group: (i === 0 || newGroup) && r.g ? r.g : "",
      label: r.n,
      cells: cells(r.p, j => r.p[j] !== "." && (!!fig.flat || vis[j] === i)),
      note: r.note,
      mv: r.mv,
      gap: newGroup,
    });
  });
  if (fig.marks) {
    out.push({
      kind: "mark",
      group: "",
      label: "",
      cells: cells(
        [...fig.marks].map(c => (c === "1" ? "^" : " ")).join(""),
        () => true
      ),
      note: fig.marksNote,
    });
  }
  if (!fig.flat) {
    const shown = vis.map((k, j) => (k < 0 ? "0" : rows[k].p[j])).join("");
    out.push({
      kind: "out",
      group: "",
      label: "보임",
      cells: cells(shown, () => true),
      note: fig.eq,
    });
    if (fig.target && shown !== fig.target) {
      const diff = [...shown].map((c, j) => c !== fig.target![j]);
      out.push({
        kind: "goal",
        group: "",
        label: "목표",
        cells: cells(fig.target, () => true),
      });
      out.push({
        kind: "mark",
        group: "",
        label: "",
        cells: cells(diff.map(d => (d ? "^" : " ")).join(""), () => true),
      });
    }
  }
  return out;
}
