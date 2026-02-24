// // peerinsights/app/lib/formApi.ts
// import { FormRequest, 
//   FormRequestSchema, 
//   FormResponse, 
//   FormResponseSchema, 
//   SubmissionPayload, 
//   SubmissionPayloadSchema, 
//   SubmitResponse, 
//   SubmitResponseSchema } from "./zodSchemas";
// import { z,ZodType } from "zod";
// /** Always call same-origin routes; do not expose secrets via NEXT_PUBLIC_* */
// const BASE = ""; // same origin

// /** helpers */
// function parseOrThrow<T>(schema: ZodType<T>, data: unknown, path: string): T {
//   const parsed = schema.safeParse(data);
//   if (!parsed.success) throw new Error("Unexpected server response. Please try again.");
//   return parsed.data;
// }
// /** Schemas for special cases (no any needed) */
// const ErrorJSONSchema = z.object({ message: z.string() });
// const InactiveFormSchema = z.object({
//   ok: z.boolean().optional(),
//   is_active: z.literal(false),
//   message: z.string().optional(),
// });

// /** POST /api/form */
// export async function fetchFormMeta(body: FormRequest, opts?: { signal?: AbortSignal }): Promise<FormResponse> {
//   const req = FormRequestSchema.parse(body);
//   const res = await fetch(`${BASE}/api/form`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(req),
//     signal: opts?.signal,
//     cache: "no-store", // dynamic, user-specific
//   });

//  if (!res.ok) {
//     // Prefer JSON {message}, fallback to text – all type-safe
//     try {
//       const j = await res.json();
//       const err = ErrorJSONSchema.safeParse(j);
//       if (err.success) throw new Error(err.data.message);
//     } catch {
//       /* ignore JSON parse errors */
//     }
//     const text = await res.text().catch(() => "");
//     throw new Error(text || `Request failed (${res.status})`);
//   }


//   const json = await res.json();
  
//  // Soft inactive case: turn backend message into an Error for the UI
//   const inactive = InactiveFormSchema.safeParse(json);
//   if (inactive.success) {
//     throw new Error(inactive.data.message ?? "No open assignment right now.");
//   }
//   return parseOrThrow<FormResponse>(FormResponseSchema, json, "/api/form");
// }

// /** POST /api/submit */
// export async function submitEvaluation(
//   body: SubmissionPayload,
//   opts?: { signal?: AbortSignal }
// ): Promise<SubmitResponse> {
//   const payload = SubmissionPayloadSchema.parse(body);
//   const res = await fetch(`/api/submit`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//     signal: opts?.signal,
//     cache: "no-store",
//   });
// if (!res.ok) {
//     try {
//       const j = await res.json();
//       const err = ErrorJSONSchema.safeParse(j);
//       if (err.success) throw new Error(err.data.message);
//     } catch {
//       /* ignore */
//     }
//     const text = await res.text().catch(() => "");
//     throw new Error(text || `Submit failed (${res.status})`);
//   }

//   const json = await res.json();
//   return parseOrThrow(SubmitResponseSchema, json, "/api/submit");
// }

// peerinsights/app/lib/formApi.ts
import {
  FormRequest,
  FormRequestSchema,
  FormResponse,
  FormResponseSchema,
  SubmissionPayload,
  SubmissionPayloadSchema,
  SubmitResponse,
  SubmitResponseSchema,
} from "./zodSchemas";
import { z, ZodType } from "zod";

/** Always call same-origin routes; do not expose secrets via NEXT_PUBLIC_* */
const BASE = ""; // same origin

/** helpers */
function parseOrThrow<T>(schema: ZodType<T>, data: unknown, path: string): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new Error("Unexpected server response. Please try again.");
  return parsed.data;
}

/** Schemas for special cases (no any needed) */
const ErrorJSONSchema = z.object({ message: z.string() });
const InactiveFormSchema = z.object({
  ok: z.boolean().optional(),
  is_active: z.literal(false),
  message: z.string().optional(),
});

/** Read error body once and surface a useful message */
async function readErrorMessage(res: Response, fallback: string) {
  const raw = await res.text().catch(() => "");
  if (!raw) return `${fallback} (${res.status})`;
  try {
    const j = JSON.parse(raw);
    const parsed = ErrorJSONSchema.safeParse(j);
    if (parsed.success) return parsed.data.message;
    // If server returns arbitrary JSON, stringify it for visibility
    return `${fallback} (${res.status}): ${raw}`;
  } catch {
    // Not JSON — return plain text
    return `${fallback} (${res.status}): ${raw}`;
  }
}

/** POST /api/form */
export async function fetchFormMeta(body: FormRequest, opts?: { signal?: AbortSignal }): Promise<FormResponse> {
  const req = FormRequestSchema.parse(body);
  const res = await fetch(`${BASE}/api/form`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal: opts?.signal,
    cache: "no-store", // dynamic, user-specific
  });

  if (!res.ok) {
    const msg = await readErrorMessage(res, "Request failed");
    throw new Error(msg);
  }

  const json = await res.json();

  // Soft inactive case: turn backend message into an Error for the UI
  const inactive = InactiveFormSchema.safeParse(json);
  if (inactive.success) {
    throw new Error(inactive.data.message ?? "No open assignment right now.");
  }

  return parseOrThrow<FormResponse>(FormResponseSchema, json, "/api/form");
}

/** POST /api/submit */
export async function submitEvaluation(
  body: SubmissionPayload,
  opts?: { signal?: AbortSignal }
): Promise<SubmitResponse> {
  // 🔒 Sanitize: filter out self-rows for PRAISE only (leave ratings/comments untouched)
  const sanitized: SubmissionPayload = {
    ...body,
    praises: (body.praises ?? []).filter((p) => p.to_student_id !== body.from_student_id),
  };

  // Validate after sanitizing
  const payload = SubmissionPayloadSchema.parse(sanitized);

  const res = await fetch(`/api/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: opts?.signal,
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await readErrorMessage(res, "Submit failed");
    throw new Error(msg);
  }

  const json = await res.json();
  return parseOrThrow(SubmitResponseSchema, json, "/api/submit");
}
