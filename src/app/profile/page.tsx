"use client";
import { useEffect, useMemo, useState } from "react";
import { getToken, decodeJwt} from "../../lib/auth";
import { withApiBase } from "../../lib/env";
import {
  ACCOMMODATION_OPTIONS,
  BUDGET_LABELS,
  BUDGET_STEPS,
  FOOD_OPTIONS,
  INTEREST_OPTIONS,
  TRANSPORT_OPTIONS,
} from "../../features/profile/options";
import { useLang } from "../../lib/useLang";
import { useTranslation, Trans } from '../../lib/translation';
import { PhotoEditor } from "../../components/PhotoEditor";
import { Toast } from "../../components/Toast";

type JwtPayload = {

  sub?: string;
  email?: string;
  prenom?: string;
  nom?: string;
  photoProfil?: string;
  role?: string;
  [k: string]: any;
};

type Profile = {
  user: { _id?: string; email: string };
  profile: {
    prenom: string;
    nom: string;
    photoProfil?: string;
    dateNaissance?: string;
    budget?: number | string;
    accommodation?: string;
    transport?: string;
    interests?: string[];
    foodPreferences?: string[];
    role?: string;
  };
};

export default function ProfilePage() {
  // Prevent scroll restoration from jumping to top
  if (typeof window !== "undefined") {
    window.history.scrollRestoration = "manual";
  }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Profile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [lang, setLang] = useLang();
  const { t } = useTranslation();

  useEffect(() => setMounted(true), []);

  // Helpers: convert between budget number (1-5) and label string (e.g., "Premium")
  const clamp = (n: number) => Math.min(5, Math.max(1, Math.round(n)));
  const toBudgetNumber = (v: any): number => {
    if (typeof v === "number") return clamp(v);
    if (typeof v === "string") {
      const s = v.trim();
      // Try match label (case-insensitive)
      const entry = Object.entries(BUDGET_LABELS).find(([, label]) => label.toLowerCase() === s.toLowerCase());
      if (entry) return clamp(parseInt(entry[0], 10));
      // Try parse numeric string
      const n = parseInt(s, 10);
      if (!Number.isNaN(n)) return clamp(n);
    }
    return 3; // default
  };
  const toBudgetLabel = (v: any): string => {
    if (typeof v === "number") return BUDGET_LABELS[clamp(v)] || "Standard";
    if (typeof v === "string") {
      const s = v.trim();
      // If already a known label, return canonical capitalization
      const entry = Object.entries(BUDGET_LABELS).find(([, label]) => label.toLowerCase() === s.toLowerCase());
      if (entry) return entry[1];
      // If numeric string, map to label
      const n = parseInt(s, 10);
      if (!Number.isNaN(n)) return BUDGET_LABELS[clamp(n)] || "Standard";
    }
    return "Standard";
  };

  const token = useMemo(() => (mounted ? getToken() : null), [mounted]);
  const userId = useMemo(() => {
    if (!mounted || !token) return null;
    const payload = decodeJwt<JwtPayload>(token);
    const sub: any = payload?.sub;
    const asString = (v: any): string | null => {
      if (!v) return null;
      if (typeof v === "string") return v;
      // Common serializations for ObjectId
      if (typeof v === "object") {
        if (typeof (v as any).$oid === "string") return (v as any).$oid;
        if (typeof (v as any)._id === "string") return (v as any)._id;
      }
      try {
        const s = String(v);
        return /^[a-fA-F0-9]{24}$/.test(s) ? s : s;
      } catch { return null; }
    };
    return asString(sub);
  }, [mounted, token]);

  useEffect(() => {
    const run = async () => {
      if (!mounted) return;
      if (!token || !userId) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }
      
      // Try to use cached data from JWT if backend is unreachable
      const payload = decodeJwt<JwtPayload>(token);
      const fallbackData: Profile = {
        user: { _id: userId, email: (payload as any)?.email || '' },
        profile: {
          prenom: payload?.prenom || '',
          nom: payload?.nom || '',
          photoProfil: (payload as any)?.photoProfil ?? (payload as any)?.picture,
          dateNaissance: undefined,
          budget: 3,
          accommodation: undefined,
          transport: undefined,
          interests: [],
          foodPreferences: [],
          role: payload?.role,
        }
      };
      
      try {
        setLoading(true);
        setError(null);
        // This endpoint is public on the backend (no guards), so don't send Authorization
        // to avoid hitting 431 (Request Header Fields Too Large) when tokens become big.
        const profileUrl = withApiBase(`/user/getProfileByUserId/${userId}`);
        console.log('[Profile] Fetching from:', profileUrl);
        const res = await fetch(profileUrl, {
          method: 'GET',
          mode: 'cors',
          credentials: 'include',
          cache: "no-store",
        });
        console.log('[Profile] Response status:', res.status);
        if (!res.ok) {
          const errorText = await res.text().catch(() => '');
          console.error('[Profile] Error response:', errorText);
          throw new Error(`Failed to load profile: ${res.status} - ${errorText}`);
        }
        const json = await res.json();
        console.log('[Profile] Loaded successfully:', json);
        setData(json as Profile);
      } catch (e: any) {
        console.error("[Profile] Load error:", e);
        // Use fallback data from JWT so the page is still usable
        setData(fallbackData);
        setError("Backend unavailable - showing cached data");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [mounted, token, userId]);

  // Close success modal with Escape (must be before any early return to keep hooks order stable)
  useEffect(() => {
    if (!savedMsg) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSavedMsg(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [savedMsg]);

  // Render a stable shell on SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <main className="min-h-dvh w-full flex items-center justify-center px-4" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <div className="text-sm opacity-80">{t("loading")}</div>
      </main>
    );
  }

  if (mounted && !token) {
    window.location.assign("/");
    return null;
  }

  // Save handler (not a hook to avoid hook order issues)
  const save = async () => {
    if (!token || !userId) return;
    const payload: any = {
      prenom: data?.profile?.prenom,
      nom: data?.profile?.nom,
      dateNaissance: data?.profile?.dateNaissance,
      photoProfil: data?.profile?.photoProfil,
      // Send human-readable label string to match backend requirement
      budget: toBudgetLabel(data?.profile?.budget),
      accommodation: data?.profile?.accommodation,
      transport: data?.profile?.transport,
      interests: data?.profile?.interests || [],
      foodPreferences: (data as any)?.profile?.foodPreferences || [],
    };
    try {
      setSaving(true);
      setSavedMsg(null);
      const res = await fetch(withApiBase(`/user/updateProfile/${userId}`), {
        method: "PUT",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      setSavedMsg(t("saved"));
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    }
    setSaving(false);
  };

  // Save only name (prenom, nom) using updateProfile by userId
  const saveName = async () => {
    if (!token || !userId) return;
    try {
      setSavingName(true);
      setSavedMsg(null);
      const res = await fetch(withApiBase(`/user/updateProfile/${userId}`), {
        method: "PUT",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prenom: data?.profile?.prenom ?? "",
          nom: data?.profile?.nom ?? "",
        }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      setEditingName(false);
      setSavedMsg(lang === 'fr' ? 'Nom mis à jour' : 'Name updated');
    } catch (e: any) {
      setError(e?.message || "Failed to save name");
    } finally {
      setSavingName(false);
    }
  };

  const handlePhotoChange = async (file: File) => {
    if (!data?.user._id) return;

    setSaving(true);

    // Create a resized, compressed base64 string
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
  const canvas = document.createElement("canvas");
  let size = 224; // start a bit smaller to keep payload safe
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setSaving(false);
          setToast({ message: "Failed to process image", type: "error" });
          return;
        }
        // Center-crop to square, then draw
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

        // Compress adaptively to keep payload small (< ~60KB)
        const toJpegWithQuality = (q: number) => canvas.toDataURL("image/jpeg", q);
        let quality = 0.8;
        let dataUrl = toJpegWithQuality(quality);
        const maxBytes = 60 * 1024; // 60KB safety
        // Base64 size estimate: 4/3 of bytes without header; we can approximate using length
        const dataSize = (s: string) => Math.ceil((s.length - s.indexOf(",") - 1) * 3 / 4);
        while (dataSize(dataUrl) > maxBytes && quality > 0.4) {
          quality -= 0.1;
          dataUrl = toJpegWithQuality(quality);
        }

        try {
          const token = getToken();
          const send = async (payload: string) => fetch(withApiBase(`/user/updateProfile/${data.user._id}`), {
            method: "PUT",
            mode: "cors",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ photoProfil: payload }),
          });
          let res = await send(dataUrl);
          // If network failed (CORS/payload), retry once with stronger compression/scaling
          if (!res || !res.ok) {
            if (!res) {
              // network error path usually throws before res exists
            }
            // downscale and recompress
            size = 192;
            canvas.width = size; canvas.height = size;
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
            let retryQ = 0.6;
            let retryData = toJpegWithQuality(retryQ);
            while (dataSize(retryData) > 50 * 1024 && retryQ > 0.4) {
              retryQ -= 0.1;
              retryData = toJpegWithQuality(retryQ);
            }
            res = await send(retryData);
          }
          if (!res || !res.ok) throw new Error("Failed to save photo");

          // Optimistically update UI
          setData((prev) =>
            prev ? { ...prev, profile: { ...prev.profile, photoProfil: dataUrl } } : null
          );
          // Also update localStorage cache for AppBar to pick it up
          localStorage.setItem("user_profile_photo", dataUrl);
          // Dispatch custom event so same-tab AppBar updates immediately
          window.dispatchEvent(new CustomEvent("profile-photo-updated", { detail: dataUrl }));
          setToast({ message: "Photo updated successfully", type: "success" });
        } catch (err: any) {
          setToast({ message: err.message || "An error occurred", type: "error" });
        } finally {
          setSaving(false);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    if (!data?.user._id) return;
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(withApiBase(`/user/updateProfile/${data.user._id}`), {
        method: "PUT",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photoProfil: null }),
      });
      if (!res.ok) throw new Error("Failed to remove photo");
      setData((prev) =>
        prev ? { ...prev, profile: { ...prev.profile, photoProfil: undefined } } : null
      );
      localStorage.removeItem("user_profile_photo");
      // Notify other components in same tab
      window.dispatchEvent(new CustomEvent("profile-photo-updated", { detail: null } as any));
      setToast({ message: "Photo removed", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "An error occurred", type: "error" });
    }
    setSaving(false);
  };


  const updateProfile = (updates: Partial<Profile["profile"]>) => {
    setData((prev) => (prev ? { ...prev, profile: { ...prev.profile, ...updates } } : prev));
  };

  return (
    <main className="min-h-dvh w-full px-4 pb-24" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {error && (
        <div className="mx-auto max-w-[980px] mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "#fee2e2", color: "#7f1d1d", border: "1px solid #fecaca" }}>
          <div className="font-semibold mb-1">Unable to connect to backend</div>
          <div className="text-xs opacity-90">
            The backend API at <code className="bg-red-900/20 px-1 py-0.5 rounded">{withApiBase("")}</code> is not responding. 
            Please ensure your backend server is running and CORS is configured to allow this origin.
          </div>
        </div>
      )}
      {savedMsg && (
        <div className="fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSavedMsg(null)} aria-hidden="true" />
          {/* Dialog */}
          <div className="absolute inset-0 grid place-items-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-label={savedMsg}
              className="relative w-full max-w-sm rounded-3xl p-6 sm:p-7 text-center animate-in fade-in zoom-in-50"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 30px 100px rgba(0,0,0,0.35)" }}
            >
              <div className="mx-auto h-14 w-14 rounded-2xl grid place-items-center"
                style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", boxShadow: "0 16px 40px rgba(34,197,94,0.45)" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m20 6-11 11-5-5" />
                </svg>
              </div>
              <h4 className="mt-4 text-lg font-extrabold" style={{ color: "var(--foreground)" }}>{savedMsg}</h4>
              <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
                {lang === 'fr' ? "Tes préférences ont été mises à jour avec succès." : "Your preferences have been updated successfully."}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={() => setSavedMsg(null)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold"
                  style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}
                >
                  {t("close")}
                </button>
                <button
                  onClick={() => setSavedMsg(null)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: "#2563eb", boxShadow: "0 10px 26px rgba(0,0,0,0.20)" }}
                >
                  {t("gotIt")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto w-full max-w-[980px] grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identity card */}
        <section className="lg:col-span-1 rounded-3xl p-6 sm:p-7 relative overflow-hidden backdrop-blur" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}>
          <div className="relative flex flex-col items-center text-center">
            <PhotoEditor
              photoUrl={data?.profile?.photoProfil}
              onPhotoChange={handlePhotoChange}
              onPhotoRemove={handleRemovePhoto}
              saving={saving}
            />
            {/* Name + Email with inline edit */}
            {!editingName ? (
              <div className="mt-5">
                <h2 className="text-2xl font-extrabold leading-tight">
                  {data?.profile?.prenom} {data?.profile?.nom}
                </h2>
                <p className="opacity-80 text-sm mt-2 truncate max-w-[260px]" title={data?.user?.email}>{data?.user?.email}</p>
                <div className="mt-3">
                  <button
                    onClick={() => setEditingName(true)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}
                  >
                    {lang === 'fr' ? 'Modifier le nom' : 'Edit name'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 w-full max-w-[280px]">
                <div className="grid grid-cols-1 gap-2">
                  <input
                    aria-label={lang === 'fr' ? 'Prénom' : 'First name'}
                    value={data?.profile?.prenom ?? ''}
                    onChange={(e) => updateProfile({ prenom: e.target.value })}
                    className="rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                  />
                  <input
                    aria-label={lang === 'fr' ? 'Nom' : 'Last name'}
                    value={data?.profile?.nom ?? ''}
                    onChange={(e) => updateProfile({ nom: e.target.value })}
                    className="rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--background)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setEditingName(false)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}
                  >
                    {lang === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    onClick={saveName}
                    disabled={savingName}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: "#2563eb" }}
                  >
                    {savingName ? (lang === 'fr' ? 'Enregistrement…' : 'Saving…') : (lang === 'fr' ? 'Appliquer' : 'Apply')}
                  </button>
                </div>
                <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {lang === 'fr' ? 'Clique sur Enregistrer pour sauvegarder.' : 'Click Save to persist changes.'}
                </p>
              </div>
            )}
            {/* Inline Settings under identity */}
            <div className="mt-6 w-full">
              <h4 className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>{t("settings")}</h4>
              <div className="mt-2 rounded-2xl overflow-hidden border" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
                <button
                  onClick={() => setLangPickerOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90"
                  style={{ color: "var(--foreground)" }}
                >
                  <div className="h-8 w-8 rounded-lg grid place-items-center" style={{ background: "#0ea5e925", color: "#0ea5e9" }}>🌐</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{t("language")}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t("changeLanguage")} — {lang.toUpperCase()}</div>
                  </div>
                  <div className="opacity-70">›</div>
                </button>
                <div className="h-px" style={{ background: "var(--border)" }} />
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90" style={{ color: "var(--foreground)" }}>
                  <div className="h-8 w-8 rounded-lg grid place-items-center" style={{ background: "#22c55e25", color: "#22c55e" }}>👥</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{t("invites")}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t("invitesSub")}</div>
                  </div>
                  <div className="opacity-70">›</div>
                </button>
                <div className="h-px" style={{ background: "var(--border)" }} />
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90" style={{ color: "var(--foreground)" }}>
                  <div className="h-8 w-8 rounded-lg grid place-items-center" style={{ background: "#f59e0b25", color: "#f59e0b" }}>⭐</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{t("upgrade")}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t("upgradeSub")}</div>
                  </div>
                  <div className="opacity-70">›</div>
                </button>
                <div className="h-px" style={{ background: "var(--border)" }} />
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90" style={{ color: "var(--foreground)" }}>
                  <div className="h-8 w-8 rounded-lg grid place-items-center" style={{ background: "#3b82f625", color: "#3b82f6" }}>⚙️</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{t("manageSub")}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t("manageSubSub")}</div>
                  </div>
                  <div className="opacity-70">›</div>
                </button>
                <div className="h-px" style={{ background: "var(--border)" }} />
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90" style={{ color: "var(--foreground)" }}>
                  <div className="h-8 w-8 rounded-lg grid place-items-center" style={{ background: "#f9731625", color: "#f97316" }}>❓</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{t("help")}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t("helpSub")}</div>
                  </div>
                  <div className="opacity-70">›</div>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Preferences card */}
        <section className="lg:col-span-2 rounded-3xl p-6 sm:p-7 relative backdrop-blur" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 24px 80px rgba(0,0,0,0.12)" }}>
          <header>
            <h3 className="text-xl font-extrabold">{t("preferences")}</h3>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{t("aboutYou")}</p>
          </header>

          {/* Budget */}
          <div className="mt-6 rounded-3xl p-4 sm:p-5" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">{t("budgetLevel")}</div>
              <div className="text-sm opacity-75">{toBudgetLabel(data?.profile?.budget)}</div>
            </div>
            <div className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{t("budgetQuestion")}</div>
            <div className="mt-4">
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={toBudgetNumber(data?.profile?.budget)}
                onChange={(e) => updateProfile({ budget: Number(e.target.value) })}
                className="w-full"
              />
              <div className="mt-3 flex items-center justify-between text-sm opacity-80">
                <span>{t("budgetMin")}</span>
                <span>{t("budgetMax")}</span>
              </div>
            </div>
          </div>

          {/* Accommodation */}
          <div className="mt-6 rounded-3xl p-4 sm:p-5" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
            <div className="text-lg font-bold">{t("accommodation")}</div>
            <div className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{t("accommodationQ")}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              {ACCOMMODATION_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => updateProfile({ accommodation: o.value })}
                  className={`rounded-full px-4 py-2 text-sm border ${data?.profile?.accommodation === o.value ? "ring-2 ring-[#3A67FF] border-[#3A67FF] bg-[#3A67FF]/10" : ""}`}
                  style={{ borderColor: "var(--border)", background: data?.profile?.accommodation === o.value ? undefined : "var(--surface)" }}
                >
                  <span className="mr-2">{o.emoji}</span>{o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transportation */}
          <div className="mt-6 rounded-3xl p-4 sm:p-5" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
            <div className="text-lg font-bold">{t("transport")}</div>
            <div className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{t("transportQ")}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              {TRANSPORT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => updateProfile({ transport: o.value })}
                  className={`rounded-full px-4 py-2 text-sm border ${data?.profile?.transport === o.value ? "ring-2 ring-[#3A67FF] border-[#3A67FF] bg-[#3A67FF]/10" : ""}`}
                  style={{ borderColor: "var(--border)", background: data?.profile?.transport === o.value ? undefined : "var(--surface)" }}
                >
                  <span className="mr-2">{o.emoji}</span>{o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="mt-6 rounded-3xl p-4 sm:p-5" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
            <div className="text-lg font-bold">{t("interests")}</div>
            <div className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{t("interestsQ")}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              {INTEREST_OPTIONS.map((o) => {
                const active = (data?.profile?.interests || []).includes(o.value);
                return (
                  <button
                    key={o.value}
                    onClick={() => {
                      const set = new Set(data?.profile?.interests || []);
                      if (active) set.delete(o.value); else set.add(o.value);
                      updateProfile({ interests: Array.from(set) });
                    }}
                    className={`rounded-full px-4 py-2 text-sm border ${active ? "ring-2 ring-[#3A67FF] border-[#3A67FF] bg-[#3A67FF]/10" : ""}`}
                    style={{ borderColor: "var(--border)", background: active ? undefined : "var(--surface)" }}
                  >
                    <span className="mr-2">{o.emoji}</span>{o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Food Preferences */}
          <div className="mt-6 rounded-3xl p-4 sm:p-5" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
            <div className="text-lg font-bold">{t("food")}</div>
            <div className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{t("foodQ")}</div>
            <div className="mt-4 flex flex-wrap gap-3">
              {FOOD_OPTIONS.map((o) => {
                const current = ((data as any)?.profile?.foodPreferences || []) as string[];
                const active = current.includes(o.value);
                return (
                  <button
                    key={o.value}
                    onClick={() => {
                      const set = new Set(current);
                      if (active) set.delete(o.value); else set.add(o.value);
                      setData((prev) => (prev ? { ...prev, profile: { ...prev.profile, foodPreferences: Array.from(set) } } : prev));
                    }}
                    className={`rounded-full px-4 py-2 text-sm border ${active ? "ring-2 ring-[#3A67FF] border-[#3A67FF] bg-[#3A67FF]/10" : ""}`}
                    style={{ borderColor: "var(--border)", background: active ? undefined : "var(--surface)" }}
                  >
                    <span className="mr-2">{o.emoji}</span>{o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-full px-6 py-3 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#2563eb", color: "#fff", boxShadow: "0 10px 26px rgba(0,0,0,0.20)" }}
            >
              {saving ? t("saving") : t("save")}
            </button>
          </div>
        </section>
      </div>

      {/* Language Picker Dialog */}
      <LangPicker
        open={langPickerOpen}
        onClose={() => setLangPickerOpen(false)}
        onSelect={(v) => setLang(v as any)}
        current={lang}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-white/30 bg-white/10 backdrop-blur px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-white/80">{label}</div>
      <div className="mt-1 text-base font-semibold text-white/95 break-words">{value || "—"}</div>
    </div>
  );
}

// Language picker modal
function LangPicker({ open, onClose, onSelect, current }: { open: boolean; onClose: () => void; onSelect: (v: "en"|"fr"|"es"|"de") => void; current: string }) {
  if (!open) return null;
  const items: Array<{ code: "en"|"fr"|"es"|"de"; label: string }>= [
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
    { code: "es", label: "Español" },
    { code: "de", label: "Deutsch" },
  ];
  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-sm rounded-3xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 30px 100px rgba(0,0,0,0.35)" }}>
          <h4 className="text-lg font-extrabold" style={{ color: "var(--foreground)" }}>Choose language</h4>
          <div className="mt-3 grid">
            {items.map((it) => (
              <button key={it.code} onClick={() => { onSelect(it.code); onClose(); }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl hover:opacity-90 ${current===it.code?"ring-2 ring-[#3A67FF]":""}`}
                style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", marginTop: 8 }}>
                <span>{it.label}</span>
                {current===it.code && <span>✓</span>}
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
