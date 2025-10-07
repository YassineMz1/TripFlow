"use client";
import { useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { useLang, type Lang } from "../lib/useLang";

export default function ClientIntlProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const [lang] = useLang(initialLang);
  const [messages, setMessages] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import(/* webpackChunkName: "i18n-[request]" */ `../messages/${lang}.json`);
        if (!cancelled) setMessages(mod.default || {});
      } catch {
        if (!cancelled) setMessages({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  return (
    <NextIntlClientProvider locale={lang} messages={messages || {}}>
      {children}
    </NextIntlClientProvider>
  );
}
