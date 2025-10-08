// Runtime translation helper with simple cache and fallbacks
export async function translateTextAPI(text: string, targetLang: string, sourceLang: string = 'auto'): Promise<string> {
  if (!text) return text;
  const target = (targetLang || 'en').toLowerCase();
  const source = (sourceLang || 'auto').toLowerCase();
  // 1) First, try our server-side proxy to Google Translate (avoids CORS and is more stable)
  try {
    const resp = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target, source }),
    });
    if (resp.ok) {
      const j = await resp.json().catch(() => null);
      if (j && typeof j.translatedText === 'string') return j.translatedText;
    }
  } catch (e) {
    // ignore and fall through to public endpoints
  }

  // 2) Try unofficial Google Translate endpoint directly (fallback)
  try {
    const sl = source === 'auto' ? 'auto' : source;
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((seg: any) => (Array.isArray(seg) ? seg[0] : '')).join('');
        if (translated) return translated;
      }
    }
  } catch (e) {
    // ignore
  }

  // 2) Try LibreTranslate public instance as a secondary remote option
  try {
    const resp = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: source === 'auto' ? 'auto' : source, target, format: 'text' }),
    });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data && typeof data.translatedText === 'string') return data.translatedText;
    }
  } catch (e) {
    // ignore
  }

  // 3) Fallback: MyMemory free API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(source === 'auto' ? 'en' : source)}|${encodeURIComponent(target)}`;
    const r2 = await fetch(url);
    if (r2.ok) {
      const d2 = await r2.json().catch(() => ({}));
      if (d2 && d2.responseData && d2.responseData.translatedText) return d2.responseData.translatedText;
    }
  } catch (e) {
    // ignore
  }

  // Last-resort: return original text
  return text;
}

const STORAGE_PREFIX = 'tf:trans:';

export function cacheKey(text: string, lang: string) {
  return STORAGE_PREFIX + lang + ':' + text;
}

export function getCachedTranslation(text: string, lang: string): string | null {
  try {
    const key = cacheKey(text, lang);
    const v = localStorage.getItem(key);
    return v;
  } catch (e) {
    return null;
  }
}

export function setCachedTranslation(text: string, lang: string, translated: string) {
  try {
    const key = cacheKey(text, lang);
    localStorage.setItem(key, translated);
  } catch (e) {
    // ignore
  }
}

export async function translateAndCache(text: string, lang: string): Promise<string> {
  const cached = getCachedTranslation(text, lang);
  if (cached) return cached;
  const translated = await translateTextAPI(text, lang);
  try {
    setCachedTranslation(text, lang, translated);
  } catch (e) {
    // ignore
  }
  return translated;
}
