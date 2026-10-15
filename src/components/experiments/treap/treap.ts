export type Tree = { parent: number[]; depth: number[]; height: number };

/**
 * The treap on priorities listed in key order; the smaller priority sits
 * higher. The shape does not depend on insertion order, so this builds it
 * straight from the definition with a stack over the right spine.
 */
export function build(pri: number[]): Tree {
  const parent = pri.map(() => -1);
  const spine: number[] = [];
  pri.forEach((p, i) => {
    let last = -1;
    while (spine.length && pri[spine.at(-1)!] > p) last = spine.pop()!;
    if (last >= 0) parent[last] = i;
    if (spine.length) parent[i] = spine.at(-1)!;
    spine.push(i);
  });

  // A parent always has a smaller priority, so it is reached first.
  const depth = pri.map(() => 0);
  [...pri.keys()]
    .sort((a, b) => pri[a] - pri[b])
    .forEach(i => {
      if (parent[i] >= 0) depth[i] = depth[parent[i]] + 1;
    });
  return { parent, depth, height: pri.length && Math.max(...depth) + 1 };
}

/** 1..n in random order. */
export function shuffled(n: number) {
  const a = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * The same numbers as Python's random.Random(seed).random() (MT19937), so the
 * figure draws exactly the tree the post's Python code measures.
 */
export function pyRandom(seed: number) {
  const N = 624;
  const mt = new Uint32Array(N);
  const mix = (x: number, mul: number) => Math.imul(x ^ (x >>> 30), mul);

  mt[0] = 19650218;
  for (let k = 1; k < N; k++) mt[k] = mix(mt[k - 1], 1812433253) + k;
  let i = 1;
  for (let k = N; k; k--) {
    mt[i] = (mt[i] ^ mix(mt[i - 1], 1664525)) + seed;
    if (++i >= N) {
      mt[0] = mt[N - 1];
      i = 1;
    }
  }
  for (let k = N - 1; k; k--) {
    mt[i] = (mt[i] ^ mix(mt[i - 1], 1566083941)) - i;
    if (++i >= N) {
      mt[0] = mt[N - 1];
      i = 1;
    }
  }
  mt[0] = 0x80000000;

  let at = N;
  const next = () => {
    if (at >= N) {
      for (let k = 0; k < N; k++) {
        const y = (mt[k] & 0x80000000) | (mt[(k + 1) % N] & 0x7fffffff);
        mt[k] = mt[(k + 397) % N] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
      }
      at = 0;
    }
    let y = mt[at++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    return (y ^ (y >>> 18)) >>> 0;
  };
  return () => ((next() >>> 5) * 67108864 + (next() >>> 6)) / 2 ** 53;
}
