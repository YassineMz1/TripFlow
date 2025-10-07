"use client";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import ProfileMenu from "./ProfileMenu";
import { useLang, type Lang } from "../lib/useLang";
import { usePathname } from "next/navigation";

export default function AppBar({ initialLang, initialTheme }: { initialLang?: Lang; initialTheme?: "light" | "dark" }) {
  const pathname = usePathname();
  // Always call hooks in a consistent order to satisfy React Rules of Hooks
  const [lang] = useLang(initialLang);
  const isRoot = pathname === "/";
  if (isRoot) return null;
  const t = (k: string) => {
    const dict: Record<string, Record<string, string>> = {
      en: { navHome: "Home", navTrips: "My trips", navExplore: "Explore" },
      fr: { navHome: "Accueil", navTrips: "Mes voyages", navExplore: "Explorer" },
      es: { navHome: "Inicio", navTrips: "Mis viajes", navExplore: "Explorar" },
      de: { navHome: "Start", navTrips: "Meine Reisen", navExplore: "Entdecken" },
    };
    const d = dict[lang] || dict.en;
    return d[k] || dict.en[k] || k;
  };

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
          </nav>
        </div>

        {/* Center spacer to keep layout symmetric */}
        <div />

        {/* Right: profile menu + theme toggle at the very end */}
        <div className="flex items-center justify-end gap-3">
          <ProfileMenu />
          <ThemeToggle size="sm" initialTheme={initialTheme} />
        </div>
      </div>
    </header>
  );
}
