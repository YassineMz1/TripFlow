"use client";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import ProfileMenu from "./ProfileMenu";
import { useLang, type Lang } from "../lib/useLang";
import { useTranslation } from "../lib/translation";
import { usePathname } from "next/navigation";

export default function AppBar({ initialLang, initialTheme }: { initialLang?: Lang; initialTheme?: "light" | "dark" }) {
  const pathname = usePathname();
  // Always call hooks in a consistent order to satisfy React Rules of Hooks
  const [lang] = useLang(initialLang);
  const isRoot = pathname === "/";
  if (isRoot) return null;
  const { t } = useTranslation();

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 backdrop-blur"
      style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
    >
  <div className="max-w-7xl mx-auto h-12 px-4 grid grid-cols-[1fr_auto_1fr] items-center no-theme-transition">
        {/* Left: brand + links */}
        <div className="flex items-center gap-6">
          <Link href="/home" className="text-lg font-extrabold select-none no-theme-transition">
            <span>Trip</span><span className="text-[#6BD3FF]">Flow</span>
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm" style={{ color: "var(--muted-foreground)" }}>
            <Link href="/home" className="hover:opacity-90" style={{ color: "var(--foreground)" }}>{t("navHome")}</Link>
            <Link href="#" className="hover:opacity-90">{t("navTrips")}</Link>
            <Link href="#" className="hover:opacity-90">{t("navExplore")}</Link>
            {/* Prominent Translate button next to Explore */}
            <Link
              href="/translateVoice"
              className="ml-1 px-2 py-1 rounded-md text-sm font-medium text-[var(--accent)] hover:bg-[rgba(46,167,217,0.06)] transition-colors"
              aria-label="Translate"
            >
              Translate
            </Link>
          </nav>
        </div>

        {/* Center spacer to keep layout symmetric */}
        <div />

        {/* Right: translate shortcut, profile menu + theme toggle at the very end */}
        <div className="flex items-center justify-end gap-3">
          {/* ...existing code (ProfileMenu, ThemeToggle) ... */}
          <ProfileMenu />
          <ThemeToggle size="sm" initialTheme={initialTheme} />
        </div>
      </div>
    </header>
  );
}
