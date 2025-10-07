import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppBar from "../components/AppBar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TripFlow",
  description: "Mobile-ready onboarding UI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f1624",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read initial language from cookie so SSR markup matches client expectation
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("lang")?.value;
  const initialLang = ["en","fr","es","de"].includes(cookieLang || "") ? (cookieLang as any) : "en";
  // Read initial theme from cookie to SSR the right theme without flash
  const cookieTheme = cookieStore.get("theme")?.value;
  const initialTheme = cookieTheme === "dark" ? "dark" : "light";

  return (
  <html lang={initialLang} dir="ltr" data-theme={initialTheme} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script id="lang-init" strategy="beforeInteractive">
          {`
            try {
              // Prefer cookie (SSR hint), fallback to localStorage
              var cookie = document.cookie.match(/(?:^|; )lang=([^;]+)/);
              var fromCookie = cookie ? decodeURIComponent(cookie[1]) : null;
              var saved = fromCookie || localStorage.getItem('lang');
              if (['en','fr','es','de'].includes(saved)) {
                document.documentElement.lang = saved;
                document.documentElement.dir = 'ltr';
              }

              // Theme setup: prefer cookie, fallback to localStorage
              var themeCookie = document.cookie.match(/(?:^|; )theme=([^;]+)/);
              var themeFromCookie = themeCookie ? decodeURIComponent(themeCookie[1]) : null;
              var storedTheme = localStorage.getItem('theme');
              var theme = themeFromCookie || storedTheme;
              if (theme !== 'light' && theme !== 'dark') {
                try {
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  theme = prefersDark ? 'dark' : 'light';
                } catch (_) { theme = 'light'; }
              }
              if (theme === 'light' || theme === 'dark') {
                document.documentElement.setAttribute('data-theme', theme);
              }
            } catch (e) {}
          `}
        </Script>
  <AppBar initialLang={initialLang} initialTheme={initialTheme} />
        <div className="pt-16">{children}</div>
      </body>
    </html>
  );
}
