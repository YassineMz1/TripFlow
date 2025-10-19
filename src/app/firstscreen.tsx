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
    <main className="min-h-screen w-full flex flex-col items-center bg-[var(--background)] transition-colors duration-300">
      {/* Modern grid layout for hero and carousel */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-16 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Carousel */}
          <section className="flex flex-col items-center justify-center">
            <div
              ref={carouselRef}
              className="no-scrollbar flex w-full max-w-lg snap-x snap-mandatory overflow-x-auto px-2 gap-6 scroll-smooth"
            >
              {/* leading clone = last card */}
              <div
                data-slide="clone-leading"
                className="shrink-0 snap-center w-[320px] sm:w-[420px] md:w-[520px] lg:w-[600px] transition-[transform,opacity] duration-500 ease-out will-change-transform rounded-2xl shadow-lg bg-[var(--surface)]"
                style={{ transform: "scale(0.96)", opacity: 0.92 }}
              >
                <OnboardingCard c={CARDS[CARDS.length - 1]} active={false} />
              </div>
              {CARDS.map((c, i) => (
                <div
                  key={i}
                  data-slide={i}
                  className={`shrink-0 snap-center w-[72%] sm:w-[56%] lg:w-[44%] transition-[transform,opacity] duration-500 ease-out will-change-transform rounded-2xl shadow-lg ${i === active ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' : 'bg-[var(--surface)]'}`}
                  style={{
                    transform: i === active ? "scale(1)" : "scale(0.98)",
                    opacity: i === active ? 1 : 0.96,
                  }}
                >
                  <OnboardingCard c={c} active={i === active} />
                </div>
              ))}
              {/* trailing clone = first card */}
              <div
                data-slide="clone-trailing"
                className="shrink-0 snap-center w-[320px] sm:w-[420px] md:w-[520px] lg:w-[600px] transition-[transform,opacity] duration-500 ease-out will-change-transform rounded-2xl shadow-lg bg-[var(--surface)]"
                style={{ transform: "scale(0.96)", opacity: 0.92 }}
              >
                <OnboardingCard c={CARDS[0]} active={false} />
              </div>
            </div>
            {/* Dots */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {CARDS.map((_, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={i}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => goToForward(i)}
                    className={`rounded-full border transition-transform duration-200 hover:scale-110 ${isActive ? 'bg-blue-600 border-blue-600 shadow-lg' : 'bg-[var(--surface)] border-[var(--border)]'}`}
                    style={{ width: isActive ? 10 : 8, height: isActive ? 10 : 8 }}
                  />
                );
              })}
            </div>
          </section>
          {/* Right: Hero card */}
          <section className="flex flex-col justify-center">
            <div className="rounded-2xl shadow-xl p-10 bg-[var(--surface)] border border-[var(--border)]">
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-2" style={{ color: 'var(--foreground)' }}>
                <span>Trip</span>
                <span className="text-[#6BD3FF]">Flow</span>
              </h1>
              <p className="mt-2 max-w-xl text-base" style={{ color: 'var(--muted-foreground)' }}>
                Your travel companion — instant itineraries, local tips and a smart assistant that plans with you.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <button onClick={startGoogleLogin} className="min-w-[180px] rounded-xl bg-blue-600 text-white py-3 px-4 text-sm font-semibold shadow-lg flex items-center justify-center gap-3">
                  {/* ...existing code for Google SVG ... */}
                  Continue with Google
                </button>
                <button onClick={() => setAuthOpen("signup")} className="min-w-[160px] rounded-xl bg-[var(--foreground)] text-white py-3 px-4 text-sm font-semibold shadow-lg border border-transparent flex items-center justify-center gap-3">
                  {/* ...existing code for user SVG ... */}
                  Create account
                </button>
                <button
                  onClick={() => setAuthOpen("login")}
                  className="min-w-[140px] rounded-xl py-3 px-4 text-sm font-semibold shadow-lg flex items-center justify-center gap-3 bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]"
                >
                  {/* ...existing code for sign-in SVG ... */}
                  Sign in
                </button>
              </div>
              <div className="mt-6 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Or continue without signing in — explore public demos and features.
              </div>
            </div>
          </section>
        </div>
      </div>
      <AuthModal
        mode={(authOpen || "login") as any}
        open={!!authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => router.push("/intro?next=/home")}
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
