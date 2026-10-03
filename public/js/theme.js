const KEY = "theme";

export const LANGUAGES = { en: "English", ar: "العربية" };

export function getTheme() {
   return (
      document.documentElement.dataset.theme ||
      localStorage.getItem(KEY) ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
   );
}

export function initTheme() {
   const saved =
      localStorage.getItem(KEY) ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
   document.documentElement.dataset.theme = saved;
}

// Flips the theme, saves it, and returns the new one
export function toggleTheme() {
   const next = getTheme() === "dark" ? "light" : "dark";
   setTheme(next);
   return next;
}

export function setTheme(theme) {
   document.documentElement.dataset.theme = theme;
   localStorage.setItem(KEY, theme);
}

export function applyLanguage(code = "en") {
   document.documentElement.lang = code;
}
