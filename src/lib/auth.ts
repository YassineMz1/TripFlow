import { withApiBase, AUTH_GOOGLE_PATH } from "./env";
import { api } from "./api";

export const startGoogleLogin = () => {
  if (typeof window !== "undefined") {
    window.location.href = withApiBase(AUTH_GOOGLE_PATH);
  }
};

export const storeToken = (token: string) => {
  try {
    localStorage.setItem("auth_token", token);
  } catch {}
};

export const getToken = (): string | null => {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
};

export const logout = async () => {
  const token = getToken();
  // Debug: log token and time
  try { console.log('[auth.logout] invoked', { time: new Date().toISOString(), token: token ?? null }); } catch {}

  // Perform immediate client-side cleanup and redirect so the UI is responsive
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_profile_photo"); // Clear photo on logout
      sessionStorage.removeItem("auth_token");
      // Redirect to home to reflect logged-out state
      console.log('[auth.logout] client cleanup done, redirecting');
      window.location.href = "/";
    }
  } catch (err) {
    console.error('[auth.logout] client cleanup error', err);
  }

  // Fire-and-forget server logout; don't block the UI on network errors
  try {
    console.log('[auth.logout] firing background logout');
    api.logout(token).then(() => console.log('[auth.logout] background logout success')).catch((error) => console.error("Logout failed (background):", error));
  } catch (error) {
    console.error("Logout failed (background):", error);
  }
};

export function decodeJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    try {
      // Fallback without escape for modern browsers
      const [, payload] = token.split(".");
      const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
