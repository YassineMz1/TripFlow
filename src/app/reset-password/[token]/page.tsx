"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { withApiBase } from "../../../lib/env";

export default function ResetPasswordPage() {
  // Prevent scroll restoration from jumping to top
  if (typeof window !== "undefined") {
    window.history.scrollRestoration = "manual";
  }
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(withApiBase(`/user/reset-password/${token}`), {
        method: "POST",
        mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to reset password" }));
        throw new Error(errorData.message || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main
        className="min-h-screen w-full flex items-center justify-center px-4"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <div className="w-full max-w-md">
          <div
            className="rounded-3xl p-8 text-center"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
            }}
          >
            {/* Success Icon */}
            <div
              className="mx-auto h-16 w-16 rounded-2xl grid place-items-center mb-4"
              style={{
                background: "linear-gradient(135deg,#22c55e,#16a34a)",
                color: "white",
                boxShadow: "0 16px 40px rgba(34,197,94,0.45)",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m20 6-11 11-5-5" />
              </svg>
            </div>

            <h1 className="text-2xl font-extrabold mb-2" style={{ color: "var(--foreground)" }}>
              Password Reset!
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
              Your password has been successfully reset. You can now log in with your new password.
            </p>

            <div className="space-y-2">
              <div
                className="rounded-xl p-3 text-sm"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                Redirecting to login in 3 seconds...
              </div>
              <Link
                href="/"
                className="block w-full rounded-xl px-6 py-3 text-sm font-semibold text-white"
                style={{ background: "#2563eb", boxShadow: "0 10px 26px rgba(0,0,0,0.20)" }}
              >
                Go to Login Now
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <div className="w-full max-w-md">
        <div
          className="rounded-3xl p-8"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-extrabold select-none inline-block mb-2">
              <span>Trip</span>
              <span className="text-[#29D1FF]">Flow</span>
            </Link>
            <h1 className="text-xl font-bold mt-4" style={{ color: "var(--foreground)" }}>
              Reset Your Password
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
              Enter your new password below
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-6 rounded-xl px-4 py-3 text-sm"
              style={{ background: "#fee2e2", color: "#7f1d1d", border: "1px solid #fecaca" }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-[#3A67FF]"
                  style={{
                    background: "var(--background)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-black/5"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#3A67FF]"
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>

            {/* Password Requirements */}
            <div
              className="rounded-xl p-3 text-xs"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            >
              <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>
                Password Requirements:
              </p>
              <ul className="space-y-1" style={{ color: "var(--muted-foreground)" }}>
                <li className={newPassword.length >= 6 ? "text-green-600" : ""}>
                  {newPassword.length >= 6 ? "✓" : "○"} At least 6 characters
                </li>
                <li className={newPassword === confirmPassword && newPassword ? "text-green-600" : ""}>
                  {newPassword === confirmPassword && newPassword ? "✓" : "○"} Passwords match
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#2563eb", boxShadow: "0 10px 26px rgba(0,0,0,0.20)" }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm hover:underline transition-colors"
              style={{ color: "var(--muted-foreground)" }}
            >
              ← Back to Login
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
