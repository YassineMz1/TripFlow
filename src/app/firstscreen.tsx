"use client";
import { useEffect, useRef, useState } from "react";
import { CARDS } from "../features/onboarding/cardsData";
import OnboardingCard from "../features/onboarding/OnboardingCard";
import { startGoogleLogin } from "../lib/auth";
import AuthModal from "../components/AuthModal";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const [active, setActive] = useState(0);
  const [authOpen, setAuthOpen] = useState<false | "login" | "signup">(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  // Helper: scroll a given real slide into center using scrollIntoView for robustness
  const scrollToIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
    const el = carouselRef.current?.querySelector(`[data-slide="${index}"]`) as HTMLElement | null;
    if (!el || !carouselRef.current) return;
    // Prevent scroll restoration from jumping to top
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
      // Save current scroll position
      const scrollY = window.scrollY;
      el.scrollIntoView({ behavior, block: "nearest", inline: "center" } as any);
      // Restore scroll position if it jumps
      setTimeout(() => {
        if (window.scrollY < scrollY) {
          window.scrollTo({ top: scrollY, behavior: "auto" });
        }
      }, 10);
    } else {
      el.scrollIntoView({ behavior, block: "nearest", inline: "center" } as any);
    }
  };

  const TOTAL = CARDS.length;

  // Navigate to a given slide index
  const goToForward = (target: number) => {
    if (target === indexRef.current) return;
    // Save current scroll position before moving card
    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    scrollToIndex(target, "smooth");
    // Restore scroll position after moving card
    setTimeout(() => {
      if (typeof window !== "undefined" && window.scrollY < scrollY) {
        window.scrollTo({ top: scrollY, behavior: "auto" });
      }
    }, 10);
    indexRef.current = target;
    setActive(target);
  };

  // Initialize to first real slide (center the 0 index)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      scrollToIndex(0, "auto");
      indexRef.current = 0;
      setActive(0);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Auto-scroll using scrollIntoView
  useEffect(() => {
    const interval = setInterval(() => {
      const next = (indexRef.current + 1) % TOTAL;
      // Save current scroll position before auto-scroll
      const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
      goToForward(next);
      // Restore scroll position after auto-scroll
      setTimeout(() => {
        if (typeof window !== "undefined" && window.scrollY < scrollY) {
          window.scrollTo({ top: scrollY, behavior: "auto" });
        }
      }, 10);
    }, 3500);
    return () => clearInterval(interval);
  }, [TOTAL]);

  // Track active slide by finding the slide closest to carousel center on scroll
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onScroll = () => {
      const slides = Array.from(el.querySelectorAll<HTMLElement>('[data-slide]'));
      if (!slides.length) return;
      const containerRect = el.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;

      // Only consider slides with numeric data-slide (ignore clone-leading/trailing)
      const numericSlides = slides
        .map((s) => ({ el: s, attr: s.getAttribute('data-slide') }))
        .filter((x) => x.attr !== null && /^[0-9]+$/.test(x.attr))
        .map((x) => ({ el: x.el, idx: Number(x.attr) }));

      if (!numericSlides.length) return;

      let bestIndex = numericSlides[0].idx;
      let bestDist = Infinity;
      numericSlides.forEach(({ el: s, idx }) => {
        const rect = s.getBoundingClientRect();
        const slideCenter = rect.left + rect.width / 2;
        const dist = Math.abs(slideCenter - centerX);
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = idx;
        }
      });
      if (bestIndex !== indexRef.current) {
        indexRef.current = bestIndex;
        setActive(bestIndex);
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    // run once to initialize
    onScroll();
    return () => el.removeEventListener('scroll', onScroll as any);
  }, [TOTAL]);

  // Keep position on resize
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onResize = () => {
      // Re-center the current slide after resize
      scrollToIndex(indexRef.current, "auto");
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // If already logged in, go to home
  useEffect(() => {
    try {
      const t = localStorage.getItem("auth_token");
      if (t) window.location.assign("/home");
    } catch {}
  }, []);
  return (
    <main className="min-h-dvh w-full flex flex-col items-center -mt-16 relative">
      {/* Background image (full-bleed) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(5,8,15,0.64), rgba(5,8,15,0.68)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          filter: "saturate(1.02) brightness(0.9)",
        }}
      />

      {/* Soft vignette */}
      <div aria-hidden className="absolute inset-0 -z-5" style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.45) 100%)' }} />

      {/* Theme toggle removed on this screen by design */}

      {/* Cards carousel (kept, but moved into hero) */}
      <section className="w-full pt-20 pb-8">
        <div
          ref={carouselRef}
          className="no-scrollbar mx-auto flex w-full max-w-[420px] sm:max-w-[720px] lg:max-w-[820px] snap-x snap-mandatory overflow-x-auto px-4 gap-4 scroll-smooth"
        >
          {/* leading clone = last card (kept for smooth looping but marked as clone) */}
          <div
            data-slide="clone-leading"
              className="shrink-0 snap-center w-[320px] sm:w-[420px] md:w-[520px] lg:w-[600px] transition-[transform,opacity] duration-500 ease-out will-change-transform"
            style={{ transform: "scale(0.96)", opacity: 0.92 }}
          >
            <OnboardingCard c={CARDS[CARDS.length - 1]} active={false} />
          </div>

          {CARDS.map((c, i) => (
            <div
              key={i}
              data-slide={i}
              className="shrink-0 snap-center w-[72%] sm:w-[56%] lg:w-[44%] transition-[transform,opacity] duration-500 ease-out will-change-transform"
              style={{
                  transform: i === active ? "scale(1)" : "scale(0.98)",
                  opacity: i === active ? 1 : 0.96,
                }}
            >
              <OnboardingCard c={c} active={i === active} />
            </div>
          ))}

          {/* trailing clone = first card (clone) */}
          <div
            data-slide="clone-trailing"
              className="shrink-0 snap-center w-[320px] sm:w-[420px] md:w-[520px] lg:w-[600px] transition-[transform,opacity] duration-500 ease-out will-change-transform"
            style={{ transform: "scale(0.96)", opacity: 0.92 }}
          >
            <OnboardingCard c={CARDS[0]} active={false} />
          </div>
        </div>
        {/* Dots */}
        <div className="mt-3 flex items-center justify-center gap-2" style={{ color: "var(--foreground)" }}>
          {CARDS.map((_, i) => {
            const isActive = i === active;
            const size = isActive ? 8 : 6; // px
            const bg = isActive ? 'rgba(255,255,255,0.95)' : 'transparent';
            const border = isActive ? '1px solid rgba(255,255,255,0.98)' : '1px solid rgba(255,255,255,0.18)';
            const box = isActive ? '0 6px 18px rgba(0,0,0,0.45)' : 'none';
            return (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => goToForward(i)}
                className="rounded-full focus:outline-none transition-transform duration-200 hover:scale-110"
                style={{ width: `${size}px`, height: `${size}px`, backgroundColor: bg, boxShadow: box, border }}
              />
            );
          })}
        </div>
      </section>

      {/* Brand + social sign-in (hero card) */}
      <section className="w-full max-w-[980px] px-4 pb-28">
        <div className="mx-auto mt-6 max-w-[820px] rounded-2xl p-8 sm:p-10" style={{ backdropFilter: 'saturate(1.2) blur(6px)', background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 60px rgba(2,6,23,0.6)' }}>
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight" style={{ color: 'white' }}>
                <span>Trip</span>
                <span className="text-[#6BD3FF]">Flow</span>
              </h1>
              <p className="mt-3 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Your travel companion — instant itineraries, local tips and a smart assistant that plans with you.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row items-center sm:justify-start gap-3">
                <button onClick={startGoogleLogin} className="min-w-[220px] rounded-full bg-white text-gray-900 py-3 px-4 text-sm font-semibold shadow-[0_8px_30px_rgba(2,6,23,0.52)] flex items-center justify-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.621 33.14 29.278 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.602 6.053 29.571 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20c10.493 0 19-8.507 19-19 0-1.341-.138-2.651-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.207 16.093 18.74 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.602 6.053 29.571 4 24 4 16.318 4 9.745 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.214 0 10.19-1.98 13.971-5.231l-6.451-5.458C29.406 34.941 26.834 36 24 36c-5.255 0-9.593-3.851-10.955-8.999l-6.6 5.087C9.848 38.686 16.401 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.28 3.88-4.906 6.667-11.303 6.667-5.255 0-9.593-3.851-10.955-8.999l-6.6 5.087C8.152 38.686 15.401 44 24 44c10.493 0 19-8.507 19-19 0-1.341-.138-2.651-.389-3.917z"/>
                  </svg>
                  Continue with Google
                </button>

                <button onClick={() => setAuthOpen("signup")} className="min-w-[200px] rounded-full bg-[#2563eb] text-white py-3 px-4 text-sm font-semibold shadow-[0_8px_30px_rgba(37,99,235,0.14)] border border-transparent flex items-center justify-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 12a5 5 0 1 0 0-10a5 5 0 0 0 0 10Z"/>
                    <path fillRule="evenodd" d="M12 14c-5 0-9 2.239-9 5v1h18v-1c0-2.761-4-5-9-5Z" clipRule="evenodd"/>
                  </svg>
                  Create account
                </button>

                <button
                  onClick={() => setAuthOpen("login")}
                  className="min-w-[160px] rounded-full py-3 px-4 text-sm font-semibold shadow-[0_6px_18px_rgba(2,6,23,0.20)] flex items-center justify-center gap-3"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 1a5 5 0 0 1 5 5v3h-2V6a3 3 0 1 0-6 0v3H7V6a5 5 0 0 1 5-5Z"/>
                    <path d="M5 9h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"/>
                  </svg>
                  Sign in
                </button>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <span>Or continue without signing in — explore public demos and features.</span>
        </div>
      </section>
      <AuthModal
        mode={(authOpen || "login") as any}
        open={!!authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => router.push("/intro?next=/home")}
        // Add a prop to trigger forgot password modal
        onForgotPassword={() => {
          setAuthOpen(false);
          setForgotOpen(true);
        }}
      />
      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
      />
    </main>
  );
}
