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
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "user_profile_photo") {
        setPhoto(event.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const handleImmediate = (e: Event) => {
      const ce = e as CustomEvent<string | null>;
      setPhoto(ce.detail ?? null);
    };
    window.addEventListener("profile-photo-updated", handleImmediate as EventListener);

    const t = getToken();
    if (!t) return;

    const cachedPhoto = localStorage.getItem("user_profile_photo");
    if (cachedPhoto) {
      setPhoto(cachedPhoto);
    }

    const payload = decodeJwt<JwtPayload & { email?: string }>(t);
    setName([payload?.prenom, payload?.nom].filter(Boolean).join(" ") || null);
    setEmail((payload as any)?.email || null);

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
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open profile menu"
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-10 rounded-full overflow-hidden border grid place-items-center transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ borderColor: "var(--border)", boxShadow: open ? "0 6px 18px rgba(0,0,0,0.25)" : undefined }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="avatar" className="block h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center" style={{ background: "var(--surface)", color: "var(--muted-foreground)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 21v-1c0-2.761-4-5-8-5s-8 2.239-8 5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-2xl p-2 z-50 backdrop-blur"
          role="menu"
          aria-label="Profile menu"
          style={{ background: "var(--background)", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}
        >
          <div className="px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-[color:var(--surface)] flex-shrink-0 grid place-items-center" style={{ border: "1px solid var(--border)" }}>
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }}>
                    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20 21v-1c0-2.761-4-5-8-5s-8 2.239-8 5v1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{name || "Your account"}</div>
                {email && <div className="text-xs truncate mt-0.5" style={{ color: "var(--muted-foreground)" }}>{email}</div>}
              </div>
            </div>
          </div>

          <div className="border-t" style={{ borderColor: 'var(--border)' }} />

          <nav className="grid gap-1 px-2 py-2">
            <Link href="/profile" onClick={() => { setOpen(false); setTimeout(() => { try { (document.activeElement as HTMLElement | null)?.blur(); } catch {} }, 50); }} onMouseDown={(e) => e.preventDefault()} className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/6 transition-colors" style={{ color: "var(--foreground)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 21v-1c0-2.761-4-5-8-5s-8 2.239-8 5v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-sm">Profile</span>
            </Link>

            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                // Debug logs to help trace logout issues
                try {
                  console.log("[ProfileMenu] Logout clicked", {
                    time: new Date().toISOString(),
                    activeElement: (document.activeElement as HTMLElement | null)?.outerHTML?.slice?.(0, 200) || String(document.activeElement),
                    token: getToken?.() ?? null,
                  });
                } catch (err) {
                  console.error("[ProfileMenu] Error logging logout click", err);
                }

                // Close menu immediately and remove focus so hover/focus styles don't persist
                setOpen(false);
                try { (e.currentTarget as HTMLElement).blur(); } catch {}
                // small fallback to ensure no lingering focus
                setTimeout(() => { try { (document.activeElement as HTMLElement | null)?.blur(); } catch {} }, 50);
                void logout();
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-red-500/10 hover:text-red-600 transition-colors"
              style={{ color: "var(--foreground)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="flex-shrink-0">
                <path d="M13 3a1 1 0 0 1 1 1v4h-2V5H6v14h6v-3h2v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8Z"/>
                <path d="M16.293 8.293 20 12l-3.707 3.707-1.414-1.414L16.172 13H10v-2h6.172l-1.293-1.293 1.414-1.414Z"/>
              </svg>
              <span className="text-sm">Logout</span>
            </button>
          </nav>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setOpen(false);
            try { (document.activeElement as HTMLElement | null)?.blur(); } catch {}
          }}
        />
      )}
    </div>
  );
}
