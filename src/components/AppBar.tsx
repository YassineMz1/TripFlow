"use client"
import Link from "next/link"
import ThemeToggle from "./ThemeToggle"
import ProfileMenu from "./ProfileMenu"
import { useLang, type Lang } from "../lib/useLang"
import { useTranslation } from "../lib/translation"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function AppBar({ initialLang, initialTheme }: { initialLang?: Lang; initialTheme?: "light" | "dark" }) {
  const pathname = usePathname()
  // Always call hooks in a consistent order to satisfy React Rules of Hooks
  useLang(initialLang)
  const { t } = useTranslation()

  // Avoid server/client hydration mismatch when pathname isn't available on the server.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Mobile menu state
  const [menuOpen, setMenuOpen] = useState(false)

  // Listen for profile menu open event to close mobile menu
  useEffect(() => {
    const handler = () => setMenuOpen(false);
    window.addEventListener("profile-menu-opened", handler);
    return () => window.removeEventListener("profile-menu-opened", handler);
  }, []);

  if (!mounted) return null
  const isRoot = pathname === "/"
  if (isRoot) return null // Only hide on actual root, not /home

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 backdrop-blur"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div className="max-w-7xl mx-auto h-12 px-4 grid grid-cols-[1fr_auto_1fr] items-center no-theme-transition">
        {/* Left: brand + links */}
        <div className="flex items-center gap-6">
          <Link
            href="/home"
            className="text-lg font-extrabold select-none no-theme-transition"
            style={{ color: "var(--foreground)" }}
          >
            <span>Trip</span>
            <span className="text-[#29D1FF]">Flow</span>
          </Link>
          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-4 text-sm" style={{ color: "var(--foreground)" }}>
            <Link href="/home" className="hover:opacity-90" style={{ color: "var(--foreground)" }} aria-label="nav-home">
              {t("navHome") || "Home"}
            </Link>
            <Link href="/itineraries" className="hover:opacity-90" style={{ color: "var(--foreground)" }}>
              {t("Itineraries") || "Itineraries"}
            </Link>
            <Link href="/explore" className="hover:opacity-90" style={{ color: "var(--foreground)" }}>
              {t("navExplore") || "Explore"}
            </Link>
            <Link href="/translateVoice" className="hover:opacity-90" style={{ color: "var(--foreground)" }} aria-label="nav-translate-voice">
              {t("Translate") || "Translate"}
            </Link>
          </nav>
        </div>

        {/* Center spacer to keep layout symmetric */}
        <div />

        {/* Right: profile menu + theme toggle + mobile menu icon */}
        <div className="flex items-center justify-end gap-3">
          <ProfileMenu />
          <ThemeToggle size="sm" initialTheme={initialTheme} />
          {/* Mobile nav: hamburger icon on right */}
          <button
            className="sm:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 focus:outline-none"
            aria-label="Open menu"
            onClick={() => {
              window.dispatchEvent(new Event("mobile-menu-opened"));
              setTimeout(() => setMenuOpen((v) => !v), 0);
            }}
            style={{ color: "var(--foreground)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div
          className="sm:hidden w-full z-50 animate-fade-in"
          style={{
            background: "var(--surface)",
            color: "var(--foreground)",
            borderBottom: "1.5px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            borderRadius: "0 0 18px 18px"
          }}
        >
          <nav className="flex flex-col items-center gap-2 py-4 text-base">
            <Link href="/home" className="w-full py-2 px-4 text-center hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl font-semibold" onClick={() => setMenuOpen(false)}>
              {t("navHome") || "Home"}
            </Link>
            <Link href="/itineraries" className="w-full py-2 px-4 text-center hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl font-semibold" onClick={() => setMenuOpen(false)}>
              {t("Itineraries") || "Itineraries"}
            </Link>
            <Link href="/explore" className="w-full py-2 px-4 text-center hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl font-semibold" onClick={() => setMenuOpen(false)}>
              {t("navExplore") || "Explore"}
            </Link>
            <Link href="/translateVoice" className="w-full py-2 px-4 text-center hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl font-semibold" onClick={() => setMenuOpen(false)}>
              {t("Translate") || "Translate"}
            </Link>
          </nav>
        </div>
      )}
      {/* Add margin below AppBar when menu is open on mobile */}
      {menuOpen && (
        <div className="sm:hidden" ></div>
      )}
    </header>
  )
}
