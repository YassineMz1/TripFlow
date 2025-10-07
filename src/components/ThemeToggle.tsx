"use client";
import { useEffect, useState, useId } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle({ size = "md", initialTheme }: { size?: "sm" | "md" | "lg"; initialTheme?: Theme }) {
  const [theme, setTheme] = useState<Theme>(initialTheme ?? "light");

  // Initialize from SSR-provided initialTheme, cookie, data-attribute, or localStorage
  useEffect(() => {
    try {
      const html = document.documentElement;
      const cookieMatch = document.cookie.match(/(?:^|; )theme=([^;]+)/);
      const fromCookie = cookieMatch ? (decodeURIComponent(cookieMatch[1]) as Theme) : null;
      const stored = localStorage.getItem("theme") as Theme | null;
      const current = (html.getAttribute("data-theme") as Theme) || fromCookie || stored || initialTheme || "light";
      setTheme(current);
    } catch {}
  }, []);

  useEffect(() => {
    // Keep local state in sync with data-theme even if changed elsewhere
    try {
      const html = document.documentElement;
      const observer = new MutationObserver(() => {
        const current = (html.getAttribute("data-theme") as Theme) || "light";
        setTheme(current);
      });
      observer.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
      return () => observer.disconnect();
    } catch {
      return;
    }
  }, []);

  // Cross-tab sync via storage event and custom event
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme" && (e.newValue === "light" || e.newValue === "dark")) {
        const next = e.newValue as Theme;
        setTheme(next);
        try { document.documentElement.setAttribute("data-theme", next); } catch {}
      }
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as Theme | undefined;
      if (detail === "light" || detail === "dark") setTheme(detail);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("theme-change", onCustom as any);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("theme-change", onCustom as any);
    };
  }, []);

  const toggle = () => {
    try {
      const html = document.documentElement;
      const current = (html.getAttribute("data-theme") as Theme) || theme || "light";
      const next: Theme = current === "dark" ? "light" : "dark";
  // Smooth but short transition to reduce color flashing
  html.classList.add("theme-transition");
  window.setTimeout(() => html.classList.remove("theme-transition"), 180);
      html.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
      window.dispatchEvent(new CustomEvent("theme-change", { detail: next }));
      setTheme(next);
    } catch {}
  };

  const dims = size === "sm" ? { btn: "h-10 w-10", sun: 18, moon: 16 } : size === "lg" ? { btn: "h-14 w-14 sm:h-16 sm:w-16", sun: 28, moon: 26 } : { btn: "h-12 w-12", sun: 24, moon: 22 };

  return (
    <button
      aria-label="Toggle theme"
      onClick={toggle}
      className={`relative ${dims.btn} rounded-full hover:scale-[1.02] transition-transform`}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 10px 26px rgba(0,0,0,0.18)",
      }}
    >
      {/* halo */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: theme === "dark" ? "0 0 0 2px rgba(255,255,255,0.08) inset" : "0 0 0 2px rgba(0,0,0,0.04) inset",
        }}
      />

      {/* Sun icon */}
      <span
        aria-hidden
  className="absolute inset-0 grid place-items-center transition-all duration-300"
        style={{
          opacity: theme === "light" ? 1 : 0,
          transform: theme === "light" ? "rotate(0deg) scale(1)" : "rotate(-30deg) scale(0.85)",
          color: "var(--foreground)",
          zIndex: theme === "light" ? 2 : 1,
        }}
      >
        <SunIcon size={dims.sun} />
      </span>

      {/* Moon icon */}
      <span
        aria-hidden
  className="absolute inset-0 grid place-items-center transition-all duration-300"
        style={{
          opacity: theme === "dark" ? 1 : 0,
          transform: theme === "dark" ? "rotate(0deg) scale(1)" : "rotate(30deg) scale(0.85)",
          color: "var(--foreground)",
          zIndex: theme === "dark" ? 2 : 1,
        }}
      >
        <MoonIcon size={dims.moon} />
      </span>
    </button>
  );
}

function SunIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ size = 20 }: { size?: number }) {
  const maskId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <mask id={maskId}>
          <rect width="24" height="24" fill="#fff" />
          {/* cut-out to form a crescent */}
          <circle cx="16" cy="8" r="9" fill="#000" />
        </mask>
      </defs>
      <circle cx="12" cy="12" r="9" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}
