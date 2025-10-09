"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import EN_DEFAULT from './locales';
import { getCachedTranslation, translateAndCache } from './translate';
import { Lang, useLang } from './useLang';

type TranslationContextShape = {
  lang: Lang;
  t: (key: string) => string;
  translateNow: (key: string) => Promise<string>;
};

const TranslationContext = createContext<TranslationContextShape | null>(null);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [lang] = useLang();
  const [, setRerender] = useState(0);

  // In-memory cache to avoid repeated localStorage reads during a single session
  const memCache = useMemo(() => new Map<string, string>(), []);

  const t = useCallback((key: string) => {
    const source = EN_DEFAULT[key] ?? key;
    // If target is English, return source immediately
    if (lang === 'en') return source;

    const cacheKey = `${source}::${lang}`;
    if (memCache.has(cacheKey)) return memCache.get(cacheKey)!;

    const persisted = getCachedTranslation(source, lang);
    if (persisted) {
      memCache.set(cacheKey, persisted);
      return persisted;
    }

    // Trigger background translation
    void translateAndCache(source, lang).then((res) => {
      memCache.set(cacheKey, res);
      setRerender((s) => s + 1);
    }).catch(() => {});

    // Return English as fallback
    return source;
  }, [lang, memCache]);

  const translateNow = useCallback(async (key: string) => {
    const source = EN_DEFAULT[key] ?? key;
    if (lang === 'en') return source;
    const res = await translateAndCache(source, lang);
    // update mem cache
    try { memCache.set(`${source}::${lang}`, res); } catch {}
    setRerender((s) => s + 1);
    return res;
  }, [lang, memCache]);

  const value = useMemo(() => ({ lang, t, translateNow }), [lang, t, translateNow]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useTranslation must be used inside TranslationProvider');
  return ctx;
}

export function Trans({ k }: { k: string }) {
  const { t } = useTranslation();
  return <>{t(k)}</>;
}

export default TranslationContext;
