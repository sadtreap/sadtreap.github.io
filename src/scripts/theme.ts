const THEME_KEY = "theme";
const LIGHT = "light";
const DARK = "dark";
type Theme = typeof LIGHT | typeof DARK;

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function parseTheme(value: string | null): Theme | null {
  return value === LIGHT || value === DARK ? value : null;
}

function readStoredTheme(): Theme | null {
  try {
    return parseTheme(localStorage.getItem(THEME_KEY));
  } catch {
    // Storage can be unavailable even when the rest of the page works.
    return null;
  }
}

let selectedTheme = readStoredTheme();
let themeValue: Theme = selectedTheme ?? (systemTheme.matches ? DARK : LIGHT);

function reflect(): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", themeValue);
  root.classList.toggle("dark", themeValue === DARK);
  document
    .querySelector("#theme-btn")
    ?.setAttribute("aria-pressed", String(themeValue === DARK));

  // Match the browser chrome to the current page background.
  document
    .querySelector("meta[name='theme-color']")
    ?.setAttribute(
      "content",
      window.getComputedStyle(document.body).backgroundColor
    );
}

// Delegate once so buttons also work after client-side navigation.
document.addEventListener("click", event => {
  if (
    !(event.target instanceof Element) ||
    !event.target.closest("#theme-btn")
  ) {
    return;
  }

  selectedTheme = themeValue = themeValue === LIGHT ? DARK : LIGHT;
  reflect();
  try {
    localStorage.setItem(THEME_KEY, themeValue);
  } catch {
    // Keep the user's choice for this session when persistence is blocked.
  }
});

reflect();
document.addEventListener("astro:after-swap", reflect);

// Preserve the theme before the incoming document is displayed.
document.addEventListener("astro:before-swap", event => {
  const { newDocument } = event as Event & { newDocument: Document };
  newDocument.documentElement.setAttribute("data-theme", themeValue);
  newDocument.documentElement.classList.toggle("dark", themeValue === DARK);

  const color = document
    .querySelector("meta[name='theme-color']")
    ?.getAttribute("content");
  if (color) {
    newDocument
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", color);
  }
});

// Follow the OS only while the user has not explicitly chosen a theme.
systemTheme.addEventListener("change", ({ matches }) => {
  if (selectedTheme !== null) return;
  themeValue = matches ? DARK : LIGHT;
  reflect();
});

window.addEventListener("storage", event => {
  if (event.key !== THEME_KEY && event.key !== null) return;
  selectedTheme = parseTheme(event.newValue);
  themeValue = selectedTheme ?? (systemTheme.matches ? DARK : LIGHT);
  reflect();
});
