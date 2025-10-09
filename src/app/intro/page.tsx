"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Intro() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/home";
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Prefetch the next route for snappier transition
    try { router.prefetch(next); } catch { }

    // Animation duration (ms) - keep in sync with .plane animation below. If user prefers reduced motion, shorten.
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wait = prefersReduced ? 900 : 3600;

    // Wait for plane animation before navigating, but allow skip
    timerRef.current = window.setTimeout(() => router.replace(next), wait);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [next, router]);

  return (
    <div className="fixed inset-0 grid place-items-center" style={{ background: 'var(--background)' }}>
      {/* Improved background: subtle travel photo with dark overlay for legibility */}
      <div aria-hidden className="absolute inset-0 -z-10" style={{ backgroundImage: "linear-gradient(180deg, rgba(3,7,18,0.52), rgba(3,7,18,0.7)), url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1920&q=70')", backgroundSize: 'cover', backgroundPosition: 'center center' }} />

      <div className="relative w-56 h-56 grid place-items-center">
        {/* expanding ring (improved) */}
        <span aria-hidden className="absolute inset-0 rounded-full animate-[pulseRing_1.6s_ease-out_infinite]"
          style={{ boxShadow: "0 0 0 4px rgba(255,255,255,0.02) inset, 0 18px 40px rgba(2,6,23,0.6)" }} />

        {/* logo wordmark (kept centered and refined) */}
        <div className="text-4xl sm:text-5xl font-extrabold select-none tracking-tight" style={{ color: "white", textShadow: '0 8px 26px rgba(2,6,23,0.6)' }}>
          <span className="inline-block animate-[fadeUp_600ms_ease]">Trip</span>
          <span className="inline-block animate-[fadeUp_600ms_ease_120ms]" style={{ color: '#29D1FF', textShadow: '0 8px 28px rgba(0,0,0,0.65)' }}>Flow</span>
        </div>

        {/* subtle dots */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted-foreground)] animate-[blink_1.2s_infinite]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted-foreground)] animate-[blink_1.2s_infinite_120ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted-foreground)] animate-[blink_1.2s_infinite_240ms]" />
        </div>

      </div>

      {/* Plane animation (contrail + plane) */}
      <div aria-hidden className="pointer-events-none absolute left-0 top-14 w-full h-12 -z-20">
        <svg className="plane" width="220" height="64" viewBox="0 0 220 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* contrail */}
          <path className="contrail" d="M10 34 C60 26, 120 18, 180 10" stroke="rgba(255,255,255,0.32)" strokeWidth="3" strokeLinecap="round" fill="none" />

          {/* plane body */}
          <g transform="translate(0,0)">
            <path d="M0 30 L28 24 L60 16 L80 14 L76 22 L116 30 L76 38 L80 46 L60 44 L28 36 Z" fill="#FFFFFF" opacity="0.98" />
            <path d="M64 18 L84 14 L92 18 L76 22 Z" fill="#E6F6FF" opacity="0.9" />
            <path d="M20 30 L36 28 L36 32 Z" fill="#DDEFFA" opacity="0.9" />
            <circle cx="52" cy="30" r="1.8" fill="#C6E9FF" />
          </g>
        </svg>
      </div>

      <style jsx>{`
        @keyframes pulseRing { from { transform: scale(0.86); opacity: 0.9 } 60% { opacity: 0.25 } to { transform: scale(1.15); opacity: 0 } }
        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(8px) } 100% { opacity: 1; transform: translateY(0) } }
        @keyframes blink { 0%, 20% { opacity: 0.15 } 50% { opacity: 1 } 100% { opacity: 0.15 } }

        .plane { position: absolute; left: -28%; top: 0; opacity: 0.98; filter: drop-shadow(0 10px 30px rgba(0,0,0,0.45)); animation: flyRight 3.2s cubic-bezier(.22,.9,.3,1) forwards; }
        .contrail { stroke-dasharray: 200; stroke-dashoffset: 200; opacity: 0.9; animation: trail 3.2s linear forwards; }

        @keyframes flyRight {
          0% { transform: translateX(-30vw) translateY(-6px) rotate(-6deg) scale(0.96); opacity: 0 }
          8% { opacity: 1 }
          55% { transform: translateX(36vw) translateY(-4px) rotate(-2deg) scale(1.02) }
          85% { transform: translateX(86vw) translateY(-6px) rotate(4deg) scale(1) }
          100% { transform: translateX(140vw) translateY(-8px) rotate(6deg) scale(1); opacity: 0.98 }
        }

        @keyframes trail { to { stroke-dashoffset: 0; opacity: 0.36 } }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .plane { animation: none; transform: translateX(40vw) !important; opacity: 1 !important; }
          .contrail { animation: none; stroke-dashoffset: 0; opacity: 0.32 }
        }
      `}</style>
    </div>
  );
}
