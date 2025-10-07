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
  try {
    // Call the logout endpoint
    await api.logout(token);
  } catch (error) {
    console.error("Logout failed:", error);
    // We still want to clear the token locally even if the server call fails
  }

  // Remove token from storage
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_profile_photo"); // Clear photo on logout
    sessionStorage.removeItem("auth_token");
    // Redirect to home to reflect logged-out state
    window.location.href = "/";
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
