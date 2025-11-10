import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppBar from "../components/AppBar";
import OfflineIndicator from "../components/OfflineIndicator";
import OfflineFallback from "../components/OfflineFallback";
import { TranslationProvider } from "../lib/translation";
import TravelAssistant from "../components/TravelAssistant";

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
      <head>
        {/* Link to the web manifest so browsers can install the PWA */}
        <link rel="manifest" href="/manifest.json" />
  {/* Apple touch icon hint (optional) */}
  <link rel="apple-touch-icon" sizes="192x192" href="/icons/plane.png" />
  {/* Favicon to avoid /favicon.ico 404 */}
  <link rel="icon" href="/icons/plane.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Service worker registration runs client-side only; Next will hydrate the register component */}
        <noscript />
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
        <Script id="global-error-normalizer" strategy="beforeInteractive">
          {`
            // Normalize unhandled promise rejections so DevOverlay gets readable messages
            window.addEventListener('unhandledrejection', function(ev) {
              try {
                var reason = ev && ev.reason;
                if (!reason) return;
                // If the rejection reason is an Event (e.g., MessageEvent/AbortEvent), coerce to a string
                if (typeof reason === 'object' && !(reason instanceof Error)) {
                  var type = reason && reason.type ? reason.type : null;
                  var str = type ? ('Unhandled rejection event: ' + type) : String(reason);
                  // Replace reason with an Error so frameworks display it nicely
                  ev.reason = new Error(str);
                }
              } catch (e) {
                // ignore
              }
            });
            window.addEventListener('error', function(ev) {
              // ensure runtime errors are at least logged
              try { console.error('Window error', ev.error || ev.message || ev); } catch(e) {}
            });
          `}
        </Script>
  <TranslationProvider>
  <AppBar initialLang={initialLang} initialTheme={initialTheme} />
  <OfflineIndicator />
  <OfflineFallback message={"You're offline — viewing cached app shell"} />
  <TravelAssistant />
  <div className="pt-16">{children}</div>
    {/* Register the service worker on the client after hydration */}
    <Script src="/sw-register.js" strategy="afterInteractive" />
  </TranslationProvider>
      </body>
    </html>
  );
}
