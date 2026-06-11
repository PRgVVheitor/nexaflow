export type Theme = "dark" | "light";

export const themeKey = "nexaflow-theme";

export function getStoredTheme(): Theme {
  const stored = localStorage.getItem(themeKey);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  localStorage.setItem(themeKey, theme);
}
