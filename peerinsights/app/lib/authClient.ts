// app/lib/authClient.ts
import type { AuthUser } from "./zodSchemas"; // adjust path if needed
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("peerinsights_token");
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;

  const token = getToken();
  if (!token) return false;

  try {
    const [, payloadBase64] = token.split(".");
    if (!payloadBase64) throw new Error("Invalid token");

    // Decode base64 payload
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson) as { exp?: number };

    // exp is in seconds since epoch
    if (!payload.exp) {
      // no exp? treat as invalid
      localStorage.removeItem("peerinsights_token");
      localStorage.removeItem("peerinsights_user");
      return false;
    }

    const expiresAt = payload.exp * 1000;
    if (Date.now() >= expiresAt) {
      // token expired – clear and log out
      localStorage.removeItem("peerinsights_token");
      localStorage.removeItem("peerinsights_user");
      return false;
    }

    return true;
  } catch {
    // malformed token → clear it
    localStorage.removeItem("peerinsights_token");
    localStorage.removeItem("peerinsights_user");
    return false;
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("peerinsights_user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    // corrupted data – clear it
    localStorage.removeItem("peerinsights_user");
    return null;
  }
}