"use client"
import { useMemo } from "react"
import Link from "next/link"
import { useLang, type Lang } from "../../lib/useLang"

type Feature = { title: string; subtitle: string; icon: string; gradient: string }
const FEATURES: Feature[] = [
  {
    title: "Smart Itineraries",
    subtitle: "AI-crafted plans in minutes",
    icon: "🧭",
    gradient: "from-[#3A67FF] to-[#2CC7A5]",
  },
  {
    title: "Live Collaboration",
    subtitle: "Plan trips together in real-time",
    icon: "🤝",
    gradient: "from-[#3F7BFA] to-[#72D5FF]",
  },
  {
    title: "Map + Timeline",
    subtitle: "Visualize routes and schedules",
    icon: "🗺️",
    gradient: "from-[#2FB46B] to-[#77DD77]",
  },
  { title: "Budget Control", subtitle: "Keep costs transparent", icon: "💳", gradient: "from-[#E86BB0] to-[#7BC9FF]" },
]

export default function HomeClient({ initialLang }: { initialLang: Lang }) {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [lang] = useLang(initialLang)
  const t = (k: string) => {
    const dict: Record<string, Record<string, string>> = {
      en: {
        heroTitle: "Design your next journey with precision and ease",
        heroSub:
          "Build itineraries in minutes, coordinate with friends, and explore curated experiences — all in one place.",
        whereTo: "Where to?",
        startPlanning: "Start planning",
        featuresTitle: "Everything you need to travel better",
        ctaTitle: "Plan smarter, travel further",
        ctaSub: "Join thousands of explorers building stress-free trips with TripFlow.",
        getStarted: "Get started",
        explore: "Explore features",
        navHome: "Home",
        navTrips: "My trips",
        navExplore: "Explore",
      },
      fr: {
        heroTitle: "Conçois ton prochain voyage avec précision et simplicité",
        heroSub:
          "Crée des itinéraires en quelques minutes, coordonne-toi avec tes amis et explore des expériences sélectionnées — tout au même endroit.",
        whereTo: "Où aller ?",
        startPlanning: "Commencer",
        featuresTitle: "Tout ce dont tu as besoin pour mieux voyager",
        ctaTitle: "Planifie plus intelligemment, voyage plus loin",
        ctaSub: "Rejoins des milliers d'explorateurs qui voyagent sereinement avec TripFlow.",
        getStarted: "Commencer",
        explore: "Découvrir les fonctionnalités",
        navHome: "Accueil",
        navTrips: "Mes voyages",
        navExplore: "Explorer",
      },
      es: {
        heroTitle: "Diseña tu próximo viaje con precisión y facilidad",
        heroSub:
          "Crea itinerarios en minutos, coordínate con amigos y explora experiencias seleccionadas, todo en un solo lugar.",
        whereTo: "¿A dónde?",
        startPlanning: "Empezar",
        featuresTitle: "Todo lo que necesitas para viajar mejor",
        ctaTitle: "Planifica mejor, viaja más lejos",
        ctaSub: "Únete a miles de exploradores que organizan viajes sin estrés con TripFlow.",
        getStarted: "Comenzar",
        explore: "Explorar funciones",
        navHome: "Inicio",
        navTrips: "Mis viajes",
        navExplore: "Explorar",
      },
      de: {
        heroTitle: "Plane deine nächste Reise präzise und mühelos",
        heroSub:
          "Erstelle in Minuten Reisepläne, koordiniere dich mit Freunden und entdecke kuratierte Erlebnisse – alles an einem Ort.",
        whereTo: "Wohin?",
        startPlanning: "Planung starten",
        featuresTitle: "Alles, was du für besseres Reisen brauchst",
        ctaTitle: "Plane smarter, reise weiter",
        ctaSub: "Schließe dich Tausenden von Entdeckern an, die stressfreie Reisen mit TripFlow planen.",
        getStarted: "Los geht's",
        explore: "Funktionen entdecken",
        navHome: "Start",
        navTrips: "Meine Reisen",
        navExplore: "Entdecken",
      },
    }
    const d = dict[lang] || dict.en
    return d[k] || dict.en[k] || k
  }

  return (
    <main className="min-h-dvh" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-16 pb-12 relative">
        <div
          className="pointer-events-none absolute -top-16 -right-24 h-72 w-72 rounded-full blur-3xl opacity-30 hidden sm:block"
          style={{ background: "radial-gradient(closest-side, #7C4DFF, transparent)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-24 h-72 w-72 rounded-full blur-3xl opacity-30 hidden sm:block"
          style={{ background: "radial-gradient(closest-side, #2CC7A5, transparent)" }}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">{t("heroTitle")}</h1>
            <p className="mt-4 text-base sm:text-lg" style={{ color: "var(--muted-foreground)" }}>
              {t("heroSub")}
            </p>

            {/* Search / Planner quick start */}
            <div
              className="mt-8 rounded-2xl p-4 sm:p-5 backdrop-blur"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  aria-label="Destination"
                  placeholder={t("whereTo")}
                  className="rounded-xl px-4 py-3 outline-none"
                  style={{ background: "white", color: "#0b1220", border: "1px solid rgba(0,0,0,0.08)" }}
                />
                <input
                  aria-label="Dates"
                  type="date"
                  defaultValue={today}
                  className="rounded-xl px-4 py-3 outline-none"
                  style={{ background: "white", color: "#0b1220", border: "1px solid rgba(0,0,0,0.08)" }}
                />
                <button
                  className="rounded-xl font-semibold px-4 py-3"
                  style={{ background: "#2563eb", color: "#fff", boxShadow: "0 10px 26px rgba(0,0,0,0.22)" }}
                >
                  {t("startPlanning")}
                </button>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                Tip: you can refine later — destinations, dates, and travelers are always editable.
              </p>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative h-[340px] sm:h-[420px]">
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-[#7C4DFF] to-[#9B7BFF] shadow-[0_30px_90px_rgba(0,0,0,0.35)]" />
            <div className="absolute inset-px rounded-[26px] ring-1" style={{ borderColor: "rgba(255,255,255,0.3)" }} />
            <div className="absolute left-6 top-6 right-6 bottom-6 rounded-[22px] bg-white/5 ring-1 ring-white/20" />
            <div className="relative h-full rounded-[28px] grid place-items-center text-white">
              <div className="text-center px-8">
                <div className="text-6xl">✈️</div>
                <div className="mt-4 text-xl font-semibold">TripFlow Planner</div>
                <div className="text-white/85 text-sm">Your companion to effortless travel</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold">{t("featuresTitle")}</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="relative rounded-3xl p-5 text-white"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.20)" }}
            >
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${f.gradient}`} />
              <div className="absolute inset-px rounded-[22px] ring-1 ring-white/30" />
              <div className="relative">
                <div className="text-3xl">{f.icon}</div>
                <div className="mt-4 text-lg font-bold">{f.title}</div>
                <div className="text-white/90 text-sm">{f.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust bar / CTA */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div
          className="rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div>
            <h3 className="text-xl font-extrabold">Plan smarter, travel further</h3>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              Join thousands of explorers building stress-free trips with TripFlow.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="rounded-xl px-4 py-3 font-semibold"
              style={{ background: "#2563eb", color: "#fff" }}
            >
              {t("getStarted")}
            </Link>
            <Link
              href="/explore"
              className="rounded-xl px-4 py-3 font-semibold"
              style={{ border: "1px solid var(--border)" }}
            >
              {t("explore")}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          © {new Date().getFullYear()} TripFlow. All rights reserved.
        </div>
      </footer>
    </main>
  )
}
