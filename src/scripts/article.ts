import { initLightbox } from "./lightbox";

function initProgress(signal: AbortSignal) {
  const container = document.createElement("div");
  container.className = "progress-container fixed inset-x-0 top-0 z-10 h-0.5";
  container.setAttribute("aria-hidden", "true");
  const bar = document.createElement("div");
  bar.className = "progress-bar h-full origin-left bg-accent";
  bar.style.transform = "scaleX(0)";
  container.append(bar);
  document.body.append(container);

  let frame = 0;
  function update() {
    frame = 0;
    const root = document.documentElement;
    const height = root.scrollHeight - root.clientHeight;
    const progress =
      height > 0 ? Math.min(1, Math.max(0, window.scrollY / height)) : 0;
    bar.style.transform = `scaleX(${progress})`;
  }
  function scheduleUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  document.addEventListener("scroll", scheduleUpdate, {
    passive: true,
    signal,
  });
  window.addEventListener("resize", scheduleUpdate, { signal });
  const observer = new ResizeObserver(scheduleUpdate);
  observer.observe(document.body);
  scheduleUpdate();

  signal.addEventListener(
    "abort",
    () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      container.remove();
    },
    { once: true }
  );
}

function addHeadingLinks(article: HTMLElement) {
  for (const heading of article.querySelectorAll<HTMLElement>(
    "h2[id], h3[id], h4[id], h5[id], h6[id]"
  )) {
    if (heading.querySelector(".heading-link")) continue;
    heading.classList.add("group");
    const link = document.createElement("a");
    link.className =
      "heading-link ms-2 text-muted-foreground no-underline! opacity-0 group-hover:opacity-100 focus:opacity-100";
    link.href = `#${encodeURIComponent(heading.id)}`;
    link.setAttribute("aria-label", heading.textContent?.trim() ?? heading.id);
    const marker = document.createElement("span");
    marker.ariaHidden = "true";
    marker.textContent = "#";
    link.append(marker);
    heading.append(link);
  }
}

function attachCopyButtons(article: HTMLElement, signal: AbortSignal) {
  const timers = new Set<ReturnType<typeof setTimeout>>();
  for (const block of article.querySelectorAll("pre")) {
    if (block.parentElement?.querySelector(":scope > .copy-code")) continue;
    const wrapper = document.createElement("div");
    wrapper.className = "group relative";
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "copy-code absolute end-2 top-2 rounded border bg-background px-2 py-1 font-mono text-xs leading-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100";
    button.textContent = "Copy";
    button.setAttribute("aria-live", "polite");
    block.setAttribute("tabindex", "0");
    block.before(wrapper);
    wrapper.append(block, button);

    button.addEventListener(
      "click",
      async () => {
        button.disabled = true;
        try {
          await navigator.clipboard.writeText(
            block.querySelector("code")?.textContent ?? ""
          );
          if (signal.aborted) return;
          button.textContent = "Copied";
        } catch {
          if (signal.aborted) return;
          button.textContent = "Copy failed";
        }
        const timer = setTimeout(() => {
          button.textContent = "Copy";
          button.disabled = false;
          timers.delete(timer);
        }, 1000);
        timers.add(timer);
      },
      { signal }
    );
  }
  signal.addEventListener("abort", () => timers.forEach(clearTimeout), {
    once: true,
  });
}

let activeArticle: HTMLElement | null = null;
let controller: AbortController | undefined;

function cleanup() {
  controller?.abort();
  controller = undefined;
  activeArticle = null;
}

function setup() {
  const article = document.getElementById("article");
  if (article === activeArticle) return;
  cleanup();
  if (!article) return;
  activeArticle = article;
  controller = new AbortController();
  initProgress(controller.signal);
  addHeadingLinks(article);
  attachCopyButtons(article, controller.signal);
  initLightbox(article, controller.signal);
}

setup();
document.addEventListener("astro:page-load", setup);
document.addEventListener("astro:before-swap", cleanup);
