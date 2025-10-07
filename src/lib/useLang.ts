"use client";
import { useEffect, useState } from "react";

export type Lang = "en" | "fr" | "es" | "de";
const ALLOWED: ReadonlyArray<Lang> = ["en", "fr", "es", "de"];
const isLang = (v: any): v is Lang => ALLOWED.includes(v);

export function useLang(defaultLang?: Lang): [Lang, (l: Lang) => void] {
  // Compute initial value without calling other hooks, stable across renders
  const getInitial = () => {
    if (isLang(defaultLang)) return defaultLang as Lang;
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lang") as Lang | null;
        if (isLang(saved)) return saved as Lang;
      } catch {}
    }
    return "en" as Lang;
  };
  const [lang, setLang] = useState<Lang>(getInitial);

  useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
    } catch {}
    if (typeof document !== "undefined") {
  document.documentElement.lang = lang;
  // Force LTR (Arabic removed)
  document.documentElement.dir = "ltr";
      window.dispatchEvent(new CustomEvent("lang-change", { detail: lang }));
      try {
        // Persist also in a cookie so SSR can read it
        document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`;
      } catch {}
    }
  }, [lang]);

  useEffect(() => {
    const onLangChange = (e: Event) => {
      const detail = (e as CustomEvent).detail as Lang | undefined;
      if (detail && detail !== lang && isLang(detail)) setLang(detail);
    };
    window.addEventListener("lang-change", onLangChange as any);
    return () => window.removeEventListener("lang-change", onLangChange as any);
  }, [lang]);

  // Sync across tabs/windows via the storage event
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "lang" && isLang(e.newValue)) {
        const next = e.newValue as Lang;
        if (next !== lang) setLang(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [lang]);

  return [lang, setLang];
}
