"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const tokenQuery =
        url.searchParams.get("token") ||
        url.searchParams.get("access_token") ||
        "";
      const next = url.searchParams.get("next") || "/home";

      // Parse hash fragment (e.g. #access_token=...&id_token=...)
      const hash = window.location.hash || "";
      const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
      const tokenHash =
        hashParams.get("access_token") ||
        hashParams.get("token") ||
        hashParams.get("id_token") ||
        "";

      const token = tokenQuery || tokenHash;

      if (token) {
        // Store token; switch to httpOnly cookie from backend if possible
        localStorage.setItem("auth_token", token);
      }
      router.replace(`/intro?next=${encodeURIComponent(next)}`);
    } catch (e) {
      router.replace("/");
    }
  }, [router]);

  return null;
}
