"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getToken, decodeJwt, logout } from "../lib/auth";
import { withApiBase } from "../lib/env";

type JwtPayload = { sub?: string; email?: string; prenom?: string; nom?: string; photoProfil?: string; picture?: any };

// Normalize different photo representations into a usable image src string.
const normalizePhoto = (v: any): string | null => {
  if (!v && v !== '') return null;
  try {
    // If already a full data URL or blob or http(s) URL
    if (typeof v === 'string') {
      const s = v.trim();
        // If it's a Google-hosted avatar leave it unchanged (these URLs often include size hints)
        if (/googleusercontent\.com|lh3\.googleusercontent\.com|avatars\.googleusercontent\.com/i.test(s)) return s;
        if (/^data:\w+\/[\w+.-]+;base64,/.test(s)) return s; // already a data URL
        if (/^(https?:|blob:|data:)/i.test(s)) return s; // valid URL-like

      // If it's raw base64 without data: prefix, try to heuristically detect mime
      // JPEG often starts with '/9j' when base64-encoded, PNG with 'iVBOR', GIF with 'R0lG'
      if (/^[A-Za-z0-9+/]+=*$/.test(s) && s.length > 64) {
        const prefix = s.slice(0, 4);
        let mime = 'image/jpeg';
        if (prefix.startsWith('iVB')) mime = 'image/png';
        else if (prefix.startsWith('R0l')) mime = 'image/gif';
        else if (prefix.startsWith('UEs')) mime = 'application/zip';
        return `data:${mime};base64,${s}`;
      }

      // Otherwise treat as URL string
      return s;
    }

    // If it's an object, try common properties
    if (typeof v === 'object') {
      if (typeof v.url === 'string') return normalizePhoto(v.url);
      if (typeof v.src === 'string') return normalizePhoto(v.src);
      if (typeof v.data === 'string') return normalizePhoto(v.data);
      if (typeof v.base64 === 'string') return normalizePhoto(v.base64);
      if (typeof v.picture === 'string') return normalizePhoto(v.picture);
      // Some providers return nested objects
      if (v.profile && typeof v.profile === 'object') {
        return normalizePhoto(v.profile.picture || v.profile.photo || v.profile.image || v.profile.avatar);
      }
    }
  } catch (err) {
    // ignore and return null
  }
  return null;
};

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  // Listen for mobile menu open event to close profile menu (register immediately)
  useEffect(() => {
    const handler = () => setOpen(false);
    window.addEventListener("mobile-menu-opened", handler, { passive: true });
    return () => window.removeEventListener("mobile-menu-opened", handler);
  }, []);
  const [mounted, setMounted] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const imgErrorAttempts = useRef<Record<string, number>>({});

  const cleanImageSrc = (s: string) => {
    try {
      if (!s) return s;
      // Remove common Google size suffixes (e.g. =s96-c, =s96, ?sz=96)
      const withoutHash = s.split('#')[0];
      const urlObj = new URL(withoutHash, window.location.href);
      // remove sz/size query params
      urlObj.searchParams.delete('sz');
      urlObj.searchParams.delete('size');
      urlObj.searchParams.delete('s');
      let pathname = urlObj.pathname;
      // strip trailing '=s96-c' style suffixes
      pathname = pathname.replace(/=s\d+(-c)?$/i, '');
      urlObj.pathname = pathname;
      return urlObj.toString();
    } catch {
      return s;
    }
  };

  const handleImgError = async (el: HTMLImageElement) => {
    const src = el?.src || photo || '';
    if (!src) return;
    imgErrorAttempts.current[src] = (imgErrorAttempts.current[src] || 0) + 1;
    
    // Try different strategies to load Google images
    if (imgErrorAttempts.current[src] === 1) {
      // For Google avatar URLs, try adding a size parameter if missing
      if (/googleusercontent\.com|lh3\.googleusercontent\.com|avatars\.googleusercontent\.com/i.test(src)) {
        try {
          const u = new URL(src);
          // Add size parameter if not present
          if (!u.searchParams.has('sz') && !u.pathname.includes('=s')) {
            u.searchParams.set('sz', '256');
            const withSize = u.toString();
            el.src = withSize;
            setPhoto(withSize);
            try { localStorage.setItem('user_profile_photo', withSize); } catch {}
            return;
          }
        } catch {}
      }
    }

    if (imgErrorAttempts.current[src] === 2) {
      // Try fetching through CORS proxy or with different cache settings
      try {
        const res = await fetch(src, { cache: 'reload', mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          if (blob && blob.type.startsWith('image')) {
            const obj = URL.createObjectURL(blob);
            el.src = obj;
            setPhoto(obj);
            return;
          }
        }
      } catch (err) {
        console.warn('Image fetch failed:', err);
      }
    }

    // Give up and clear photo to show initials/avatar fallback
    setPhoto(null);
  };

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
      // Accept many fields returned by different providers (Google uses 'picture')
      const candidate = normalizePhoto((payload as any)?.photoProfil ?? (payload as any)?.picture ?? (payload as any)?.photo ?? (payload as any)?.image ?? (payload as any)?.avatar);
      if (candidate) {
        setPhoto(candidate);
        try { localStorage.setItem("user_profile_photo", candidate); } catch {}
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

        fetch(withApiBase(`/user/getProfileByUserId/${uid}`), { 
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          cache: "no-store" 
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((j) => {
            const candidate2 = normalizePhoto(j?.profile?.photoProfil ?? j?.profile?.picture ?? j?.profile?.photo ?? j?.profile?.image ?? j?.profile?.avatar ?? j?.photoProfil ?? j?.picture);
            if (candidate2) {
              setPhoto(candidate2);
              try { localStorage.setItem("user_profile_photo", candidate2); } catch {}
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
        onClick={() => {
          window.dispatchEvent(new Event("profile-menu-opened"));
          setTimeout(() => setOpen((v) => !v), 0);
        }}
        className="h-10 w-10 rounded-full overflow-hidden border grid place-items-center transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2"
        style={{ borderColor: "var(--border)", boxShadow: open ? "0 6px 18px rgba(0,0,0,0.25)" : undefined }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="avatar" className="block h-full w-full object-cover" onError={(e) => { try { handleImgError(e.currentTarget as HTMLImageElement); } catch { setPhoto(null); } }} />
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
                  <img src={photo} alt="avatar" className="h-full w-full object-cover" onError={(e) => { try { handleImgError(e.currentTarget as HTMLImageElement); } catch { setPhoto(null); } }} />
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
                setOpen(false);
                try { (e.currentTarget as HTMLElement).blur(); } catch {}
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
