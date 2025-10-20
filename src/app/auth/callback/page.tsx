"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { decodeJwt } from "@/lib/auth";

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

      // Parse hash fragment (e.g. #access_token=...&id_token=...&picture=...)
      const hash = window.location.hash || "";
      const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
      const tokenHash =
        hashParams.get("access_token") ||
        hashParams.get("token") ||
        hashParams.get("id_token") ||
        "";

      const token = tokenQuery || tokenHash;

      // Try to extract picture from query/hash params directly
      const pictureParam = url.searchParams.get("picture") || url.searchParams.get("photo") || hashParams.get("picture") || hashParams.get("photo");

      if (token) {
        // Store token
        localStorage.setItem("auth_token", token);

        // Try to decode token to extract a picture field (JWT may include 'picture' or 'photoProfil')
        try {
          const payload = decodeJwt<any>(token);
          const photoFromToken = payload?.photoProfil ?? payload?.picture ?? payload?.photo ?? payload?.image ?? payload?.avatar;
          const finalPhoto = pictureParam || photoFromToken;
          if (finalPhoto) {
            try { localStorage.setItem("user_profile_photo", finalPhoto); } catch {}
            // Notify other windows/components
            try { window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: finalPhoto })); } catch {}
          }
        } catch (err) {
          // ignore decode errors
        }
      } else if (pictureParam) {
        // No token but picture provided in URL/hash (unlikely) — store it
        try { localStorage.setItem("user_profile_photo", pictureParam); } catch {}
        try { window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: pictureParam })); } catch {}
      }

      router.replace(`/intro?next=${encodeURIComponent(next)}`);
    } catch (e) {
      router.replace("/");
    }
  }, [router]);

  return null;
}
