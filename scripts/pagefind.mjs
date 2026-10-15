import { cp, rm } from "node:fs/promises";

const command = process.argv[2];
if (command !== "clean" && command !== "sync") {
  throw new Error("Usage: node scripts/pagefind.mjs <clean|sync>");
}

const publicIndex = new URL("../public/pagefind/", import.meta.url);
// Astro copies public/ into dist/. Remove the previous index before building
// so deleted posts cannot leave stale search chunks in the next deployment.
await rm(publicIndex, { recursive: true, force: true });

if (command === "sync") {
  await cp(new URL("../dist/pagefind/", import.meta.url), publicIndex, {
    recursive: true,
  });
}
