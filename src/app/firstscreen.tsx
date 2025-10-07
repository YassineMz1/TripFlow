"use client";
import { useEffect, useRef, useState } from "react";
import { CARDS } from "../features/onboarding/cardsData";
import OnboardingCard from "../features/onboarding/OnboardingCard";
import { startGoogleLogin } from "../lib/auth";
import ThemeToggle from "../components/ThemeToggle";
import AuthModal from "../components/AuthModal";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const [active, setActive] = useState(0);
  const [authOpen, setAuthOpen] = useState<false | "login" | "signup">(false);

  // Helper to compute one step distance (slide width + gap)
  const getStep = () => {
    const el = carouselRef.current;
    if (!el) return 0;
    const child = el.firstElementChild as HTMLElement | null;
    const styles = el ? getComputedStyle(el) : ({} as CSSStyleDeclaration);
    const gap = parseFloat((styles.columnGap as any) || (styles.gap as any) || "0") || 0;
    const childWidth = child?.clientWidth ?? 0;
    return childWidth + gap;
  };

  const TOTAL = CARDS.length;

  // Forward-only navigation (always moves to the right)
  const goToForward = (target: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const step = getStep();
    const current = indexRef.current;
    const DURATION = 450; // ms (matches smooth scroll perception)

    if (target === current) return;

    // If target is ahead, just scroll to it (+1 for leading clone)
    if (target > current) {
      el.scrollTo({ left: (target + 1) * step, behavior: "smooth" });
      indexRef.current = target;
      setActive(target);
      return;
    }

    // If target is behind, go forward to trailing clone first, then to target
    el.scrollTo({ left: (TOTAL + 1) * step, behavior: "smooth" });
    // Wait for the smooth scroll; the onScroll handler will snap to first real slide
    window.setTimeout(() => {
      // Now move forward to the desired target from the first slide
      el.scrollTo({ left: (target + 1) * step, behavior: "smooth" });
      indexRef.current = target;
      setActive(target);
    }, DURATION);
  };

  // Initialize to first real slide (index 1 because of leading clone)
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      const step = getStep();
      el.scrollTo({ left: step, behavior: "auto" });
      indexRef.current = 0;
      setActive(0);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Auto-scroll (account for leading clone)
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const interval = setInterval(() => {
      const step = getStep();
      const next = (indexRef.current + 1) % TOTAL;
      if (next === 0) {
        // Scroll forward to the trailing clone so the first card appears from the right
        el.scrollTo({ left: (TOTAL + 1) * step, behavior: "smooth" });
        // onScroll handler will snap to the first real slide immediately after
      } else {
        // +1 because of leading clone
        el.scrollTo({ left: (next + 1) * step, behavior: "smooth" });
      }
      indexRef.current = next;
      setActive(next);
    }, 3500);
    return () => clearInterval(interval);
  }, [TOTAL]);

  // Track active slide when user scrolls
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onScroll = () => {
      const step = getStep();
      if (step <= 0) return;
      const left = el.scrollLeft;
      const maxLeft = step * (TOTAL + 1); // trailing clone position
      const epsilon = step * 0.5; // tolerance to detect near edges

      // Near leading clone -> jump to last real slide
      if (left <= epsilon) {
        el.scrollTo({ left: TOTAL * step, behavior: "auto" });
        indexRef.current = TOTAL - 1;
        setActive(TOTAL - 1);
        return;
      }
      // Near trailing clone -> jump to first real slide
      if (left >= maxLeft - epsilon) {
        el.scrollTo({ left: step, behavior: "auto" });
        indexRef.current = 0;
        setActive(0);
        return;
      }

      // Compute real index from position (subtract leading clone)
      const rawIndex = Math.round(left / step);
      const realIndex = Math.max(0, Math.min(TOTAL - 1, rawIndex - 1));
      if (realIndex !== indexRef.current) {
        indexRef.current = realIndex;
        setActive(realIndex);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll as any);
  }, [TOTAL]);

  // Keep position on resize
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onResize = () => {
      const step = getStep();
      el.scrollTo({ left: (indexRef.current + 1) * step, behavior: "auto" });
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
      {/* Theme toggle (top-right) */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle size="sm" />
      </div>
      {/* Cards carousel */}
      <section className="w-full pt-6 pb-8">
        <div
          ref={carouselRef}
          className="no-scrollbar mx-auto flex w-full max-w-[420px] sm:max-w-[560px] snap-x snap-mandatory overflow-x-auto px-4 gap-5 scroll-smooth"
        >
          {/* leading clone = last card */}
          <div
            className="shrink-0 snap-center w-[80%] sm:w-[70%] transition-[transform,opacity] duration-500 ease-out will-change-transform"
            style={{ transform: "scale(0.96)", opacity: 0.9 }}
          >
            <OnboardingCard c={CARDS[CARDS.length - 1]} active={false} />
          </div>

          {CARDS.map((c, i) => (
            <div
              key={i}
              className="shrink-0 snap-center w-[80%] sm:w-[70%] transition-[transform,opacity] duration-500 ease-out will-change-transform"
              style={{
                transform: i === active ? "scale(1)" : "scale(0.96)",
                opacity: i === active ? 1 : 0.88,
              }}
            >
              <OnboardingCard c={c} active={i === active} />
            </div>
          ))}

          {/* trailing clone = first card */}
          <div
            className="shrink-0 snap-center w-[80%] sm:w-[70%] transition-[transform,opacity] duration-500 ease-out will-change-transform"
            style={{ transform: "scale(0.96)", opacity: 0.9 }}
          >
            <OnboardingCard c={CARDS[0]} active={false} />
          </div>
        </div>
        {/* Dots */}
        <div className="mt-4 flex items-center justify-center gap-3" style={{ color: "var(--foreground)" }}>
          {CARDS.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goToForward(i)}
              className="h-[6px] w-[6px] rounded-full focus:outline-none"
              style={{ backgroundColor: i === active ? "var(--foreground)" : "var(--border)" }}
            />
          ))}
        </div>
      </section>

      {/* Brand + social sign-in */}
  <section className="w-full max-w-[720px] px-4 pb-16">
        <h1 className="text-center text-4xl font-extrabold" style={{ color: "var(--foreground)" }}>
          <span>Trip</span>
          <span className="text-[#6BD3FF]">Flow</span>
        </h1>
        <p className="text-center mt-2" style={{ color: "var(--muted-foreground)" }}>Your journey starts here</p>

        <div className="mt-8 grid gap-3 justify-items-center">
          <button onClick={startGoogleLogin} className="w-[92%] sm:w-[420px] rounded-xl bg-white text-gray-900 py-3 text-sm font-semibold shadow-[0_6px_18px_rgba(0,0,0,0.35)] flex items-center justify-center gap-3">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.621 33.14 29.278 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.602 6.053 29.571 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20c10.493 0 19-8.507 19-19 0-1.341-.138-2.651-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.207 16.093 18.74 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.602 6.053 29.571 4 24 4 16.318 4 9.745 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.214 0 10.19-1.98 13.971-5.231l-6.451-5.458C29.406 34.941 26.834 36 24 36c-5.255 0-9.593-3.851-10.955-8.999l-6.6 5.087C9.848 38.686 16.401 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.28 3.88-4.906 6.667-11.303 6.667-5.255 0-9.593-3.851-10.955-8.999l-6.6 5.087C8.152 38.686 15.401 44 24 44c10.493 0 19-8.507 19-19 0-1.341-.138-2.651-.389-3.917z"/>
            </svg>
            Continue with Google
          </button>
          <button onClick={() => setAuthOpen("signup")} className="w-[92%] sm:w-[420px] rounded-xl bg-[#2563eb] text-white py-3 text-sm font-semibold shadow-[0_6px_18px_rgba(0,0,0,0.35)] border border-transparent flex items-center justify-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 12a5 5 0 1 0 0-10a5 5 0 0 0 0 10Z"/>
              <path fillRule="evenodd" d="M12 14c-5 0-9 2.239-9 5v1h18v-1c0-2.761-4-5-9-5Z" clipRule="evenodd"/>
            </svg>
            Create account
          </button>
          <button
            onClick={() => setAuthOpen("login")}
            className="w-[92%] sm:w-[420px] rounded-xl py-3 text-sm font-semibold shadow-[0_6px_18px_rgba(0,0,0,0.10)] flex items-center justify-center gap-3"
            style={{
              background: "var(--surface)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 1a5 5 0 0 1 5 5v3h-2V6a3 3 0 1 0-6 0v3H7V6a5 5 0 0 1 5-5Z"/>
              <path d="M5 9h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"/>
            </svg>
            Sign in
          </button>
        </div>
      </section>
      <AuthModal
        mode={(authOpen || "login") as any}
        open={!!authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => router.push("/intro?next=/home")}
      />
    </main>
  );
}
