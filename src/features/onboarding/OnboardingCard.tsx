import { Card } from "./cardsData";

export default function OnboardingCard({ c, active = false }: { c: Card; active?: boolean }) {
  return (
    <div
      className="relative w-full h-[420px] rounded-[32px] p-6 sm:p-7 text-white"
      style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
    >
      <div className={`absolute inset-0 rounded-[32px] bg-gradient-to-br ${c.gradient}`} />
  <div className="absolute inset-px rounded-[30px] ring-1 ring-white/40 shadow-[inset_0_2px_14px_rgba(255,255,255,0.20)]" />
      <div
        className="pointer-events-none absolute inset-0 rounded-[32px] opacity-70"
        style={{
          background:
            "radial-gradient(600px 280px at 10% 0%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(600px 280px at 90% 100%, rgba(255,255,255,0.18), transparent 65%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[32px]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 25%, transparent 40%), linear-gradient(315deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.08) 25%, transparent 45%)",
          mixBlendMode: "soft-light",
        }}
      />

      <div className="relative h-full flex flex-col items-center">
        <div
          className="mt-1 sm:mt-0 h-[72px] w-[72px] rounded-2xl bg-white/25 backdrop-blur-md grid place-items-center shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/40 transition-all duration-500"
          style={{ transform: active ? "translateY(-2px) scale(1.02)" : "translateY(0) scale(1)" }}
        >
          <span className="text-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">{c.icon}</span>
        </div>
        <div className="px-5 mt-5 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)] whitespace-pre-line">{c.title}</h2>
          <p className="text-white/90 text-sm sm:text-base mt-3">{c.subtitle}</p>
        </div>
        <div className="mt-auto w-full px-6 sm:px-8 pb-6">
          <div className="rounded-full border border-white/70 bg-white/12 backdrop-blur-md px-6 py-3 text-center text-white/95 text-[12px] sm:text-sm font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]">
            {c.pills.join(" · ")}
          </div>
        </div>
      </div>
    </div>
  );
}
