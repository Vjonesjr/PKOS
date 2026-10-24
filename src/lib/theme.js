export const THEME_STORAGE_KEY = "smart_pkos_theme";

export const THEMES = [
  { value: "dark", label: "Dark", description: "Charcoal surfaces with a restrained green accent" },
  { value: "oled", label: "OLED", description: "True black surfaces for OLED displays" },
  { value: "light-blue", label: "Light Blue", description: "Calm blue surfaces with clear contrast" },
  { value: "red", label: "Red", description: "Professional red accents on deep neutral surfaces" },
];

export function getStoredTheme() {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return THEMES.some((theme) => theme.value === stored) ? stored : "dark";
}

export function applyTheme(theme = getStoredTheme()) {
  const selected = THEMES.some((item) => item.value === theme) ? theme : "dark";
  document.documentElement.dataset.theme = selected;
  document.documentElement.style.colorScheme = selected === "light-blue" ? "light" : "dark";
  window.localStorage.setItem(THEME_STORAGE_KEY, selected);
  return selected;
}
