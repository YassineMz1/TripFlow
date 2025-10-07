"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get("token") || url.searchParams.get("access_token") || "";
  const next = url.searchParams.get("next") || "/home";

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
