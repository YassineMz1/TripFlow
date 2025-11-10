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
  useLang(initialLang)
  const { t } = useTranslation()

  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => setMounted(true), [])

  // Detect scroll for glass effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Listen for profile menu open event to close mobile menu
  useEffect(() => {
    const handler = () => setMenuOpen(false);
    window.addEventListener("profile-menu-opened", handler);
    return () => window.removeEventListener("profile-menu-opened", handler);
  }, []);

  if (!mounted) return null
  const isRoot = pathname === "/"
  if (isRoot) return null

  // Check if current path is active
  const isActive = (path: string) => pathname === path

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl" : "backdrop-blur-md"
      }`}
      style={{ 
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        background: scrolled 
          ? "rgba(var(--surface-rgb), 0.8)" 
          : "rgba(var(--surface-rgb), 0.6)",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.08)" : "none"
      }}
    >
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Left: brand + desktop nav */}
        <div className="flex items-center gap-8">
          {/* Brand */}
          <Link
            href="/home"
            className="flex items-center gap-2 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#29D1FF] to-[#2EA7D9] rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
              <div 
                className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#29D1FF] to-[#2EA7D9] flex items-center justify-center shadow-lg"
                style={{
                  animation: "spin 8s linear infinite"
                }}
              >
                <span className="text-white font-black text-lg">TF</span>
              </div>
            </div>
            <div className="text-xl font-extrabold select-none hidden sm:block">
              <span style={{ color: "var(--foreground)" }}>Trip</span>
              <span className="bg-gradient-to-r from-[#29D1FF] to-[#2EA7D9] bg-clip-text text-transparent">Flow</span>
            </div>
          </Link>

          <style jsx>{`
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "/home", label: t("navHome") || "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
              { href: "/itineraries", label: t("Itineraries") || "Itineraries", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
              { href: "/explore", label: t("navExplore") || "Explore", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
              { href: "/translateVoice", label: t("Translate") || "Translate", icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" }
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all group ${
                  isActive(item.href) ? "" : "hover:bg-opacity-50"
                }`}
                style={{
                  background: isActive(item.href) 
                    ? "linear-gradient(135deg, rgba(41, 209, 255, 0.15), rgba(46, 167, 217, 0.15))"
                    : "transparent",
                  color: isActive(item.href) ? "#29D1FF" : "var(--foreground)"
                }}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </div>
                {isActive(item.href) && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-gradient-to-r from-[#29D1FF] to-[#2EA7D9]" />
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Center spacer */}
        <div />

        {/* Right: actions */}
        <div className="flex items-center justify-end gap-2">
          <ProfileMenu />
          <div className="hidden sm:block">
            <ThemeToggle size="sm" initialTheme={initialTheme} />
          </div>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl transition-all hover:bg-opacity-10"
            style={{ 
              background: menuOpen ? "rgba(41, 209, 255, 0.1)" : "transparent",
              color: menuOpen ? "#29D1FF" : "var(--foreground)"
            }}
            onClick={() => {
              window.dispatchEvent(new Event("mobile-menu-opened"));
              setMenuOpen((v) => !v);
            }}
            aria-label="Toggle menu"
          >
            <svg 
              className="w-6 h-6 transition-transform duration-300" 
              style={{ transform: menuOpen ? "rotate(90deg)" : "rotate(0deg)" }}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu with smooth animation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{
          background: "var(--surface)",
          borderTop: menuOpen ? "1px solid var(--border)" : "none"
        }}
      >
        <nav className="px-4 py-3 space-y-1">
          {[
            { href: "/home", label: t("navHome") || "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
            { href: "/itineraries", label: t("Itineraries") || "Itineraries", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { href: "/explore", label: t("navExplore") || "Explore", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
            { href: "/translateVoice", label: t("Translate") || "Translate", icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" }
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href) ? "shadow-sm" : ""
              }`}
              style={{
                background: isActive(item.href)
                  ? "linear-gradient(135deg, rgba(41, 209, 255, 0.15), rgba(46, 167, 217, 0.15))"
                  : "transparent",
                color: isActive(item.href) ? "#29D1FF" : "var(--foreground)"
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <span>{item.label}</span>
              {isActive(item.href) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#29D1FF]" />
              )}
            </Link>
          ))}
          
          {/* Theme toggle for mobile */}
          <div className="pt-2 mt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <div className="px-4 py-2">
              <ThemeToggle size="sm" initialTheme={initialTheme} />
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
