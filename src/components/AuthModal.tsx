"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, LoginInput, SignupInput } from "../lib/api";
import { storeToken } from "../lib/auth";

export type AuthModalProps = {
  mode: "login" | "signup";
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AuthModal({ mode, open, onClose, onSuccess }: AuthModalProps) {
  const [current, setCurrent] = useState<"login" | "signup">(mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrent(mode);
    setError(null);
  }, [mode, open]);

  const [form, setForm] = useState({
    email: "",
    motDePasse: "",
    prenom: "",
    nom: "",
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      // reset minimal state on close
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const title = useMemo(() => (current === "login" ? "Welcome back" : "Create your account"), [current]);

  const canSubmit = useMemo(() => {
    if (!form.email || !form.motDePasse) return false;
    if (current === "signup" && (!form.prenom || !form.nom || !photo)) return false;
    return true;
  }, [current, form, photo]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);

    try {
      if (current === "login") {
        const payload: LoginInput = { email: form.email.trim(), motDePasse: form.motDePasse };
        const res = await api.login(payload);
        storeToken(res.access_token);
        onClose();
        onSuccess?.();
        // route will be handled by caller (e.g., push to /home)
      } else {
        const payload: SignupInput = {
          email: form.email.trim(),
          motDePasse: form.motDePasse,
          prenom: form.prenom.trim(),
          nom: form.nom.trim(),
          photoProfil: photo || undefined,
        };
        await api.signup(payload);
        // Auto-login UX: immediately call login
        const loginRes = await api.login({ email: payload.email, motDePasse: payload.motDePasse });
        storeToken(loginRes.access_token);
        onClose();
        onSuccess?.();
      }
    } catch (err: any) {
      const msg = (err?.message as string) || "Something went wrong";
      // Basic normalization from backend messages
      if (/Email already exists/i.test(msg)) setError("This email is already registered. Try logging in.");
      else if (/Invalid credentials|Unauthorized/i.test(msg)) setError("Invalid email or password.");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const pickFile = () => fileRef.current?.click();

  // Resize image to a square preview and reduce size for payload
  const handleFile = async (f: File) => {
    if (!f || !f.type.startsWith("image/")) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
    try {
      const img = new Image();
      img.onload = () => {
        const size = 256; // target avatar size
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) { setPhoto(dataUrl); return; }
        // crop to square center
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        canvas.width = size; canvas.height = size;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const compressed = canvas.toDataURL("image/jpeg", 0.9);
        setPhoto(compressed);
      };
      img.src = dataUrl;
    } catch {
      setPhoto(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center backdrop-blur-sm" role="dialog" aria-modal>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Card */}
      <div
        className="relative w-[92%] max-w-[560px] rounded-3xl p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)]"
        style={{ background: "var(--background)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-start gap-4">
          <div
            className="size-12 rounded-2xl grid place-items-center shadow-[0_10px_24px_rgba(59,130,246,0.35)]"
            style={{ background: "linear-gradient(135deg,#60a5fa,#22d3ee)" }}
          >
            <span className="text-white font-extrabold">TF</span>
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-black leading-tight" style={{ color: "var(--foreground)" }}>{title}</h3>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              {current === "login" ? "Sign in to continue your trip." : "Join TripFlow and start your journey."}
            </p>
          </div>
          <button onClick={onClose} className="-m-2 p-2 rounded-xl hover:bg-black/5 focus:outline-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7a1 1 0 1 0-1.41 1.42L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"/></svg>
          </button>
        </div>

        <form className="mt-7 grid gap-4" onSubmit={onSubmit}>
          {current === "signup" && (
            <>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-2xl" style={{ background: "var(--surface)" }}>👤</div>
                    )}
                  </div>
                  {photo && (
                    <button type="button" onClick={() => setPhoto(null)}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[11px] px-2.5 py-0.5 rounded-full"
                      style={{ background: "#ef4444", color: "white", boxShadow: "0 6px 16px rgba(239,68,68,0.35)" }}
                    >Remove</button>
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-sm mb-1 block font-medium" style={{ color: "var(--muted-foreground)" }}>Profile picture <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={pickFile} className="rounded-xl px-3.5 py-2 text-sm"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 8px 20px rgba(0,0,0,0.10)" }}>
                      {photo ? "Change photo" : "Upload photo"}
                    </button>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>JPG/PNG required, we’ll optimize it.</span>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); if (e.target) (e.target as HTMLInputElement).value = ""; }} />
                </div>
              </div>
            </>
          )}
          {current === "signup" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm mb-1 block" style={{ color: "var(--muted-foreground)" }}>First name</label>
                <input
                  value={form.prenom}
                  onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                  className="w-full rounded-xl px-3.5 py-3 border text-[15px]"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  placeholder="e.g. John"
                />
              </div>
              <div>
                <label className="text-sm mb-1 block" style={{ color: "var(--muted-foreground)" }}>Last name</label>
                <input
                  value={form.nom}
                  onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                  className="w-full rounded-xl px-3.5 py-3 border text-[15px]"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  placeholder="e.g. Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm mb-1 block" style={{ color: "var(--muted-foreground)" }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-xl px-3.5 py-3 border text-[15px]"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block" style={{ color: "var(--muted-foreground)" }}>Password</label>
            <input
              type="password"
              value={form.motDePasse}
              onChange={(e) => setForm((f) => ({ ...f, motDePasse: e.target.value }))}
              className="w-full rounded-xl px-3.5 py-3 border text-[15px]"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="mt-1 text-sm rounded-lg px-3 py-2" style={{ color: "#ef4444", background: "#ef44441a" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="mt-1 w-full rounded-2xl py-3 text-base font-semibold shadow-[0_10px_26px_rgba(0,0,0,0.25)] disabled:opacity-60"
            style={{ background: current === "login" ? "#2563eb" : "#10b981", color: "white" }}
          >
            {loading ? "Please wait…" : current === "login" ? "Sign in" : "Create account"}
          </button>

          <div className="mt-2 text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
            {current === "login" ? (
              <span>
                No account? {" "}
                <button type="button" className="underline" onClick={() => setCurrent("signup")}>Create one</button>
              </span>
            ) : (
              <span>
                Already have an account? {" "}
                <button type="button" className="underline" onClick={() => setCurrent("login")}>Sign in</button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
