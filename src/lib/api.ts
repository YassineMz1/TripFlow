import { withApiBase, LOGIN_PATH, SIGNUP_PATH, LOGOUT_PATH } from "./env";

export type SignupInput = {
  email: string;
  motDePasse: string;
  prenom: string;
  nom: string;
  dateNaissance?: string | null;
  photoProfil?: string | null;
  budget?: string | null;
  accommodation?: string | null;
  transport?: string | null;
  interests?: string[] | null;
  foodPreferences?: string[] | null;
};

export type LoginInput = {
  email: string;
  motDePasse: string;
};

export type LoginResponse = { access_token: string };

export type SignupResponse = {
  message: string;
  user: any;
  profile: any;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(withApiBase(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed ${res.status}`);
  }
  return res.json();
}

export const api = {
  signup: (data: SignupInput) =>
    request<SignupResponse>(SIGNUP_PATH, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: async (data: LoginInput): Promise<LoginResponse> => {
    const res = await fetch(withApiBase(LOGIN_PATH), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Request failed ${res.status}`);
    }
    const json: any = await res.json();
    const token = json?.access_token || json?.token || json?.jwt || json?.data?.access_token || json?.data?.token;
    if (!token) throw new Error("Login response missing token");
    return { access_token: token };
  },

  logout: (token?: string | null) =>
    request<{ message: string }>(LOGOUT_PATH, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
};
