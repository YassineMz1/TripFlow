"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Intro() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/home";

  useEffect(() => {
    // Prefetch the next route for snappier transition
    try { router.prefetch(next); } catch {}
    const id = window.setTimeout(() => router.replace(next), 1800);
    return () => window.clearTimeout(id);
  }, [next, router]);

  return (
    <div className="fixed inset-0 grid place-items-center" style={{ background: "var(--background)" }}>
      <div className="relative w-56 h-56 grid place-items-center">
        {/* expanding ring */}
        <span aria-hidden className="absolute inset-0 rounded-full animate-[pulseRing_1.6s_ease-out_infinite]"
              style={{ boxShadow: "0 0 0 2px var(--border) inset" }} />

        {/* logo wordmark */}
        <div className="text-4xl sm:text-5xl font-extrabold select-none tracking-tight" style={{ color: "var(--foreground)" }}>
          <span className="inline-block animate-[fadeUp_600ms_ease]">Trip</span>
          <span className="inline-block text-[#6BD3FF] animate-[fadeUp_600ms_ease_120ms]">Flow</span>
        </div>

        {/* subtle dots */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted-foreground)] animate-[blink_1.2s_infinite]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted-foreground)] animate-[blink_1.2s_infinite_120ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted-foreground)] animate-[blink_1.2s_infinite_240ms]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes pulseRing { from { transform: scale(0.86); opacity: 0.9 } 60% { opacity: 0.25 } to { transform: scale(1.15); opacity: 0 } }
        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(8px) } 100% { opacity: 1; transform: translateY(0) } }
        @keyframes blink { 0%, 20% { opacity: 0.15 } 50% { opacity: 1 } 100% { opacity: 0.15 } }
      `}</style>
    </div>
  );
}
