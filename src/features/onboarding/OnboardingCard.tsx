import { Card } from "./cardsData";

export default function OnboardingCard({ c, active = false }: { c: Card; active?: boolean }) {
  return (
    <article
      className={`relative w-full h-[320px] sm:h-[300px] rounded-2xl p-5 transition-transform duration-300 ${active ? 'scale-100' : 'scale-98'} text-white overflow-hidden`}
      aria-label={c.title}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${c.gradient}`} aria-hidden />

      {/* Subtle surface and border */}
      <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.04))', border: '1px solid rgba(255,255,255,0.06)' }} aria-hidden />

      {/* Inner content */}
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start gap-4">
          <div className={`flex items-center justify-center h-14 w-14 rounded-lg bg-white/12 backdrop-blur-sm ring-1 ring-white/10`} style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <span className={`text-2xl ${active ? 'text-white' : 'text-white/95'}`}>{c.icon}</span>
          </div>

          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-extrabold leading-snug text-white">{c.title}</h3>
            <p className="mt-1 text-sm text-white/85 max-w-[44ch]">{c.subtitle}</p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {c.pills.map((p) => (
              <span key={p} className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/8 text-white/95">{p}</span>
            ))}
          </div>

          <div className="ml-4 flex items-center gap-2">
            {/* active indicator */}
            <span className={`inline-block rounded-full ${active ? 'bg-white' : 'bg-white/14'} w-2.5 h-2.5`} aria-hidden />
          </div>
        </div>
      </div>
    </article>
  );
}
