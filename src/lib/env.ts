const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
const AUTH_GOOGLE_PATH = process.env.NEXT_PUBLIC_AUTH_GOOGLE_PATH || "/user/auth/google";
// Make auth paths configurable to match backend routes without code changes
const LOGIN_PATH = process.env.NEXT_PUBLIC_LOGIN_PATH || "/user/login";
const SIGNUP_PATH = process.env.NEXT_PUBLIC_SIGNUP_PATH || "/user/add";
const LOGOUT_PATH = process.env.NEXT_PUBLIC_LOGOUT_PATH || "/user/logout";

export function withApiBase(path: string) {
    const base = API_BASE.replace(/\/+$/, "");
    const p = path.startsWith("/") ? path.slice(1) : path;
    return `${base}/${p}`;
}
export { API_BASE, AUTH_GOOGLE_PATH, LOGIN_PATH, SIGNUP_PATH, LOGOUT_PATH };

