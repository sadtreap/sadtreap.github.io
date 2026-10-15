import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = await readFile(
  new URL("../src/scripts/theme.ts", import.meta.url),
  "utf8"
);
const script = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const layout = await readFile(
  new URL("../src/layouts/Layout.astro", import.meta.url),
  "utf8"
);
const inlineScript = layout.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];

function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(name, callback) {
      const callbacks = listeners.get(name) ?? [];
      callbacks.push(callback);
      listeners.set(name, callbacks);
    },
    emit(name, event = {}) {
      for (const callback of listeners.get(name) ?? []) callback(event);
    },
  };
}

class Element {
  attributes = new Map();
  classes = new Set();
  classList = {
    toggle: (name, enabled) =>
      enabled ? this.classes.add(name) : this.classes.delete(name),
  };

  constructor(id = "") {
    this.id = id;
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  closest(selector) {
    return selector === `#${this.id}` ? this : null;
  }
}

function setup({ stored = null, dark = false, blocked = false } = {}) {
  const root = new Element();
  const meta = new Element();
  const button = new Element("theme-btn");
  const media = { ...eventTarget(), matches: dark };
  const writes = [];
  const document = {
    ...eventTarget(),
    documentElement: root,
    body: new Element(),
    querySelector: selector => (selector === "#theme-btn" ? button : meta),
  };
  const window = {
    ...eventTarget(),
    matchMedia: () => media,
    getComputedStyle: () => ({
      backgroundColor: root.classes.has("dark")
        ? "rgb(0, 0, 0)"
        : "rgb(255, 255, 255)",
    }),
  };
  const localStorage = {
    getItem() {
      if (blocked) throw new Error("Storage blocked");
      return stored;
    },
    setItem(key, value) {
      if (blocked) throw new Error("Storage blocked");
      writes.push([key, value]);
    },
  };
  const context = { Element, document, window, localStorage };
  runInNewContext(inlineScript, context);
  const initialTheme = root.getAttribute("data-theme");
  runInNewContext(script, context);

  return {
    root,
    meta,
    button,
    document,
    window,
    writes,
    initialTheme,
    theme: () => root.getAttribute("data-theme"),
    click: () => document.emit("click", { target: button }),
    changeSystem(matches) {
      media.matches = matches;
      media.emit("change", { matches });
    },
  };
}

test("blocked storage preserves system theme and still allows toggling", () => {
  const page = setup({ blocked: true, dark: true });
  assert.equal(page.initialTheme, "dark");
  assert.equal(page.theme(), "dark");
  page.click();
  assert.equal(page.theme(), "light");
  assert.equal(page.button.getAttribute("aria-pressed"), "false");
  page.changeSystem(true);
  assert.equal(page.theme(), "light");
});

test("invalid saved themes fall back consistently before and after first paint", () => {
  const page = setup({ stored: "invalid", dark: true });
  assert.equal(page.initialTheme, "dark");
  assert.equal(page.theme(), "dark");
});

test("system changes stay automatic until a user explicitly chooses a theme", () => {
  const page = setup();
  page.changeSystem(true);
  assert.equal(page.theme(), "dark");
  assert.deepEqual(page.writes, []);
  page.click();
  assert.deepEqual(page.writes, [["theme", "light"]]);
  page.changeSystem(false);
  page.changeSystem(true);
  assert.equal(page.theme(), "light");
});

test("saved choices survive OS changes and repeated page swaps", () => {
  const page = setup({ stored: "light", dark: true });
  page.changeSystem(true);
  assert.equal(page.theme(), "light");
  page.document.emit("astro:after-swap");
  page.document.emit("astro:after-swap");
  page.click();
  assert.equal(page.theme(), "dark");
  assert.equal(page.writes.length, 1);

  const incomingRoot = new Element();
  const incomingMeta = new Element();
  page.document.emit("astro:before-swap", {
    newDocument: {
      documentElement: incomingRoot,
      querySelector: () => incomingMeta,
    },
  });
  assert.equal(incomingRoot.getAttribute("data-theme"), "dark");
  assert.equal(incomingRoot.classes.has("dark"), true);
  assert.equal(incomingMeta.getAttribute("content"), "rgb(0, 0, 0)");
});

test("cross-tab theme changes and clearing the saved choice update the page", () => {
  const page = setup({ stored: "light", dark: true });
  page.window.emit("storage", { key: "unrelated", newValue: "dark" });
  assert.equal(page.theme(), "light");
  page.window.emit("storage", { key: "theme", newValue: "dark" });
  assert.equal(page.theme(), "dark");
  page.window.emit("storage", { key: null, newValue: null });
  page.changeSystem(false);
  assert.equal(page.theme(), "light");
  assert.deepEqual(page.writes, []);
});
