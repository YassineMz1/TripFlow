"use client";
import { useState } from "react";
import Link from "next/link";
import { withApiBase } from "../lib/env";

export type ForgotPasswordModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(withApiBase("/user/forgot-password"), {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to send reset email" }));
        throw new Error(errorData.message || "Failed to send reset email");
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center backdrop-blur-sm" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[92%] max-w-[420px] rounded-3xl p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] z-20 bg-white">
        {success ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="size-12 rounded-2xl grid place-items-center shadow-[0_10px_24px_rgba(34,197,94,0.35)]" style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              </div>
              <div>
                <h3 className="text-2xl font-black leading-tight text-green-700">Email Sent!</h3>
                <p className="text-sm mt-1 text-gray-600">We've sent password reset instructions to <strong>{email}</strong></p>
              </div>
            </div>
            <div className="rounded-xl p-4 mb-6 text-left bg-gray-50 border border-gray-200">
              <p className="text-xs mb-2 text-gray-700">📧 Check your inbox and click the reset link</p>
              <p className="text-xs text-gray-700">⏰ The link expires in 1 hour</p>
            </div>
            <button onClick={onClose} className="block w-full rounded-xl px-6 py-3 text-sm font-semibold text-white bg-blue-600 shadow">Back to Login</button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="size-12 rounded-2xl grid place-items-center shadow-[0_10px_24px_rgba(59,130,246,0.35)]" style={{ background: "linear-gradient(135deg,#60a5fa,#22d3ee)" }}>
                <span className="text-white font-extrabold">TF</span>
              </div>
              <div>
                <h3 className="text-2xl font-black leading-tight text-blue-600">TripFlow</h3>
                <p className="text-sm mt-1 text-gray-600">Forgot Password?</p>
              </div>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm mb-1 block text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl px-3.5 py-3 border text-[15px] bg-gray-50 text-gray-900 placeholder-gray-400"
                  style={{ borderColor: '#d1d5db' }}
                  placeholder="your@email.com"
                  required
                />
              </div>
              {error && (
                <div className="mt-1 text-sm rounded-lg px-3 py-2 text-red-700 bg-red-50 border border-red-200">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-2xl py-3 text-base font-semibold shadow disabled:opacity-60 bg-blue-600 text-white"
              >
                {loading ? "Please wait…" : "Send Reset Link"}
              </button>
              <button type="button" onClick={onClose} className="block text-center text-sm text-blue-600 mt-4 hover:underline">
                ← Back to Login
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
