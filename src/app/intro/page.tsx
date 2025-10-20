"use client";
// Prevent scroll restoration from jumping to top
if (typeof window !== "undefined") {
  window.history.scrollRestoration = "manual";
}
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

      {/* Plane animation removed for a quieter intro */}

      <style jsx>{`
        @keyframes pulseRing { from { transform: scale(0.86); opacity: 0.9 } 60% { opacity: 0.25 } to { transform: scale(1.15); opacity: 0 } }
        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(8px) } 100% { opacity: 1; transform: translateY(0) } }
        @keyframes blink { 0%, 20% { opacity: 0.15 } 50% { opacity: 1 } 100% { opacity: 0.15 } }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          /* No plane animation present */
        }
      `}</style>
    </div>
  );
}
