"use client";

const KEY = "theme";

export const LANGUAGES: Record<string, string> = {
   en: "English",
   ar: "العربية",
};

export function getTheme(): string {
   return (
      document.documentElement.dataset.theme ||
      localStorage.getItem(KEY) ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
   );
}

export function setTheme(theme: string): void {
   document.documentElement.dataset.theme = theme;
   localStorage.setItem(KEY, theme);
}

/** Flips the theme, saves it, and returns the new one. */
export function toggleTheme(): string {
   const next = getTheme() === "dark" ? "light" : "dark";
   setTheme(next);
   return next;
}

export function applyLanguage(code = "en"): void {
   document.documentElement.lang = code;
}

/** Inline script (runs pre-hydration in <head>) to avoid theme flash. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t;}catch(e){}})();`;
