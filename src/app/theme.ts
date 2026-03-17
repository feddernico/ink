export const VALID_THEMES = [
  "default",
  "classic",
  "cobalt",
  "monokai",
  "office",
  "twilight",
  "xcode",
];

export function applyTheme(theme: string): void {
  if (!VALID_THEMES.includes(theme)) {
    return;
  }

  if (theme === "default") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }

  try {
    localStorage.setItem("ink-theme", theme);
  } catch {
    // ignore localStorage errors
  }

  document.querySelectorAll(".menu-theme-check").forEach((el) => {
    el.classList.remove("active");
  });
  const checkEl = document.getElementById(`themeCheck-${theme}`);
  if (checkEl) {
    checkEl.classList.add("active");
  }
}

export function loadTheme(): void {
  let savedTheme = "default";
  try {
    savedTheme = localStorage.getItem("ink-theme") ?? "default";
  } catch {
    // ignore localStorage errors
  }
  applyTheme(VALID_THEMES.includes(savedTheme) ? savedTheme : "default");
}
