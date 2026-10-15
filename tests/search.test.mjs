import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const page = await readFile(
  new URL("../src/pages/search.astro", import.meta.url),
  "utf8"
);
const source = page
  .match(/<script>([\s\S]*?)<\/script>/)[1]
  .replaceAll("import.meta.env.DEV", "false");
const script = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
  },
}).outputText;

class Element {
  listeners = new Map();
  attributes = new Map();
  isConnected = true;

  constructor(selector = "") {
    this.selector = selector;
  }

  addEventListener(name, callback) {
    const callbacks = this.listeners.get(name) ?? [];
    callbacks.push(callback);
    this.listeners.set(name, callbacks);
  }

  emit(name, event = {}) {
    for (const callback of this.listeners.get(name) ?? []) callback(event);
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  matches(selector) {
    return selector === this.selector;
  }

  closest(selector) {
    return this.matches(selector) ? this : null;
  }
}

class HTMLInputElement extends Element {
  value = "";
}

async function setup() {
  const container = new Element();
  container.dataset = { bundlePath: "/pagefind/" };
  container.querySelector = () => null;
  const document = new Element();
  document.querySelector = () => container;
  const location = {
    href: "https://example.test/search/?q=push&keep=1#test",
    get search() {
      return new URL(this.href).search;
    },
  };
  const history = {
    state: { index: 3, scrollY: 100 },
    replaceState(state, _title, url) {
      assert.equal(state, this.state);
      location.href = String(url);
    },
  };
  const idle = [];
  let instances = 0;
  const queries = [];
  class PagefindUI {
    constructor() {
      instances += 1;
    }
    triggerSearch(query) {
      queries.push(query);
    }
  }
  runInNewContext(script, {
    Element,
    HTMLInputElement,
    document,
    history,
    URL,
    URLSearchParams,
    window: { location, requestIdleCallback: callback => idle.push(callback) },
    require: () => ({ PagefindUI }),
  });
  return {
    container,
    document,
    location,
    queries,
    instances: () => instances,
    async load() {
      for (const callback of idle.splice(0)) callback();
      // Allow the dynamic import and constructor continuation to settle.
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    },
  };
}

test("search controls mounted after initialization update only the q parameter", async () => {
  const search = await setup();
  await search.load();
  assert.equal(search.instances(), 1);
  assert.deepEqual(search.queries, ["push"]);

  const input = new HTMLInputElement(".pagefind-ui__search-input");
  input.value = "rank";
  search.container.emit("input", { target: input });
  assert.equal(
    search.location.href,
    "https://example.test/search/?q=rank&keep=1#test"
  );

  const clearIcon = new Element();
  clearIcon.closest = selector =>
    selector === ".pagefind-ui__search-clear" ? new Element(selector) : null;
  search.container.emit("click", { target: clearIcon });
  assert.equal(
    search.location.href,
    "https://example.test/search/?keep=1#test"
  );

  input.value = "  ";
  search.container.emit("input", { target: input });
  assert.equal(
    search.location.href,
    "https://example.test/search/?keep=1#test"
  );

  input.value = "keyboard";
  search.container.emit("input", { target: input });
  search.container.emit("keydown", { target: input, key: "Escape" });
  assert.equal(
    search.location.href,
    "https://example.test/search/?keep=1#test"
  );
});

test("pending and persisted navigation create a single search instance", async () => {
  const search = await setup();
  search.document.emit("astro:after-swap");
  await search.load();
  assert.equal(search.instances(), 1);
  search.location.href = "https://example.test/search/?q=next";
  search.document.emit("astro:after-swap");
  assert.deepEqual(search.queries, ["push", "next"]);
  assert.equal(search.instances(), 1);
});

test("navigation away prevents pending initialization and detached URL updates", async () => {
  const pending = await setup();
  pending.container.isConnected = false;
  await pending.load();
  assert.equal(pending.instances(), 0);

  const loaded = await setup();
  await loaded.load();
  loaded.container.isConnected = false;
  const input = new HTMLInputElement(".pagefind-ui__search-input");
  input.value = "old page";
  loaded.container.emit("input", { target: input });
  assert.equal(
    loaded.location.href,
    "https://example.test/search/?q=push&keep=1#test"
  );
});
