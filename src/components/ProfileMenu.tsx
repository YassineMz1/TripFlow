"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getToken, decodeJwt, logout } from "../lib/auth";
import { withApiBase } from "../lib/env";

type JwtPayload = { sub?: string; email?: string; prenom?: string; nom?: string; photoProfil?: string };

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;

    // Listen for storage changes to update photo in real-time (cross-tab)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "user_profile_photo") {
        setPhoto(event.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for same-tab updates via a custom event
    const handleImmediate = (e: Event) => {
      const ce = e as CustomEvent<string | null>;
      setPhoto(ce.detail ?? null);
    };
    window.addEventListener("profile-photo-updated", handleImmediate as EventListener);

    // Initial load logic
    const t = getToken();
    if (!t) return;

    // Prioritize localStorage for instant feedback
    const cachedPhoto = localStorage.getItem("user_profile_photo");
    if (cachedPhoto) {
      setPhoto(cachedPhoto);
    }

    const payload = decodeJwt<JwtPayload>(t);
    setName([payload?.prenom, payload?.nom].filter(Boolean).join(" ") || null);

    // If no cached photo, try token, then fetch
    if (!cachedPhoto) {
      if (payload?.photoProfil) {
        setPhoto(payload.photoProfil);
        localStorage.setItem("user_profile_photo", payload.photoProfil);
      } else if (payload?.sub) {
        const normalize = (v: any): string | null => {
          if (!v) return null;
          if (typeof v === "string") return v;
          if (typeof v === "object") {
            if (typeof (v as any).$oid === "string") return (v as any).$oid;
            if (typeof (v as any)._id === "string") return (v as any)._id;
          }
          try { return String(v); } catch { return null; }
        };
        const uid = normalize(payload.sub);
        if (!uid) return;

        fetch(withApiBase(`/user/getProfileByUserId/${uid}`), { cache: "no-store" })
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => {
            if (j?.profile?.photoProfil) {
              setPhoto(j.profile.photoProfil);
              localStorage.setItem("user_profile_photo", j.profile.photoProfil);
            }
          })
          .catch(() => {});
      }
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("profile-photo-updated", handleImmediate as EventListener);
    };
  }, [mounted]);

  return (
    <div className="relative">
      <button
        aria-label="Open profile menu"
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-10 rounded-full overflow-hidden border grid place-items-center"
        style={{ borderColor: "var(--border)" }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="avatar" className="block h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center" style={{ background: "var(--surface)" }}>👤</div>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-2xl p-2 z-50 backdrop-blur"
          style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}
        >
          <div className="px-3 py-2 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {name || "Your account"}
          </div>
          <nav className="grid gap-1">
            <Link href="/profile" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:opacity-90" style={{ color: "var(--foreground)" }}>Profile</Link>
            <button
              onClick={async () => { setOpen(false); await logout(); }
              
            }
              className="rounded-lg px-3 py-2 text-left hover:bg-red-500/10 hover:text-red-600 transition-colors flex items-center gap-2"
              style={{ color: "var(--foreground)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 3a1 1 0 0 1 1 1v4h-2V5H6v14h6v-3h2v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8Z"/>
                <path d="M16.293 8.293 20 12l-3.707 3.707-1.414-1.414L16.172 13H10v-2h6.172l-1.293-1.293 1.414-1.414Z"/>
              </svg>
              Logout
            </button>
          </nav>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}
