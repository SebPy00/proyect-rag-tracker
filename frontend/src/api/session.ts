import { jwtDecode } from "jwt-decode";
export interface Tokens {
  access: string;
  refresh: string;
}
const key = "authTokens";
export const sessionEvent = "tracker-session";

export function readTokens(): Tokens | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    if (
      !value ||
      typeof value.access !== "string" ||
      typeof value.refresh !== "string"
    )
      return null;
    const refresh = jwtDecode<{ exp: number }>(value.refresh);
    if (!refresh.exp || refresh.exp * 1000 <= Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    jwtDecode(value.access);
    return value;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function writeTokens(tokens: Tokens | null) {
  if (tokens) localStorage.setItem(key, JSON.stringify(tokens));
  else localStorage.removeItem(key);
  window.dispatchEvent(new Event(sessionEvent));
}

export function accessExpired(token: string) {
  try {
    return (
      (jwtDecode<{ exp: number }>(token).exp || 0) * 1000 < Date.now() + 30000
    );
  } catch {
    return true;
  }
}
