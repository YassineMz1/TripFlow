"use client";
import { useState } from "react";
import Link from "next/link";
import { withApiBase } from "../../lib/env";
import { useTranslation } from "../../lib/translation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const { t } = useTranslation();

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

      const data = await res.json();
      setToken(data.token);
      setSuccess(true);
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
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            <h1 className="text-2xl font-extrabold mb-2" style={{ color: "var(--foreground)" }}>
              Email Sent!
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
              We've sent password reset instructions to <strong>{email}</strong>
            </p>

            <div
              className="rounded-xl p-4 mb-6 text-left"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                📧 Check your inbox and click the reset link
              </p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                ⏰ The link expires in 1 hour
              </p>
            </div>

            <Link
              href="/"
              className="block w-full rounded-xl px-6 py-3 text-sm font-semibold text-white"
              style={{ background: "#2563eb", boxShadow: "0 10px 26px rgba(0,0,0,0.20)" }}
            >
              Back to Login
            </Link>
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
              Forgot Password?
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
              Enter your email and we'll send you reset instructions
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
              <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#3A67FF]"
                style={{
                  background: "var(--background)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#2563eb", boxShadow: "0 10px 26px rgba(0,0,0,0.20)" }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
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
