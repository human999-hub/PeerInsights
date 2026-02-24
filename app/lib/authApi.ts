// peerinsights/app/lib/authApi.ts
import {
  RegisterRequest,
  RegisterResponse,
  RegisterResponseSchema,
  LoginRequest,
  LoginResponse,
  LoginResponseSchema,
} from "./zodSchemas";

type FetchOptions = {
  signal?: AbortSignal;
};

async function handleResponse<T>(
  res: Response,
  schema: (data: unknown) => T
): Promise<T> {
  const json = await res.json();

  if (!res.ok || json?.ok === false) {
    // backend sends { ok: false, error: string }
    const msg = json?.error || "Request failed";
    throw new Error(msg);
  }

  return schema(json);
}

// ---- Register (instructor / TA) ----
export async function registerUser(
  payload: RegisterRequest,
  options: FetchOptions = {}
): Promise<RegisterResponse> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  return handleResponse(res, (data) => RegisterResponseSchema.parse(data));
}

// ---- Login (student / instructor / TA) ----
export async function loginUser(
  payload: LoginRequest,
  options: FetchOptions = {}
): Promise<LoginResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  return handleResponse(res, (data) => LoginResponseSchema.parse(data));
}
