"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const CHANGE_EVENT = "myasset-theme-change";

export function getStoredTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return (document.documentElement.dataset.theme as Theme) || "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage indisponível (modo privado, etc.) — tema não persiste, tudo bem.
  }
  window.dispatchEvent(new CustomEvent<Theme>(CHANGE_EVENT, { detail: theme }));
}

/**
 * Lê o tema atual e devolve uma função pra alternar. Componentes que
 * precisam da cor em JS (gráficos, por ex.) usam isso pra reagir ao
 * toggle sem precisar de um Context Provider.
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    setThemeState(getStoredTheme());
    const onChange = (e: Event) => setThemeState((e as CustomEvent<Theme>).detail);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme]);

  return [theme, toggle];
}

/**
 * Script injetado no <head> (ver app/layout.tsx), roda antes da
 * hidratação — evita o flash do tema errado no primeiro paint.
 */
export const NO_FLASH_THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}')||'light';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}})();`;
