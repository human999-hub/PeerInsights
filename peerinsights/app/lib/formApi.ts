import { FormRequest, 
  FormRequestSchema, 
  FormResponse, 
  FormResponseSchema, 
  SubmissionPayload, 
  SubmissionPayloadSchema, 
  SubmitResponse, 
  SubmitResponseSchema } from "./zodSchemas";
import { ZodType } from "zod";
/** Always call same-origin routes; do not expose secrets via NEXT_PUBLIC_* */
const BASE = ""; // same origin

/** helpers */
function parseOrThrow<T>(schema: ZodType<T>, data: unknown, path: string): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new Error("Unexpected server response. Please try again.");
  return parsed.data;
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
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Request failed (${res.status})`);
  }
  const json = await res.json();
  return parseOrThrow<FormResponse>(FormResponseSchema, json, "/api/form");
}

/** POST /api/submit */
export async function submitEvaluation(
  body: SubmissionPayload,
  opts?: { signal?: AbortSignal }
): Promise<SubmitResponse> {
  const payload = SubmissionPayloadSchema.parse(body);
  const res = await fetch(`/api/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: opts?.signal,
    cache: "no-store",
  });
  if (!res.ok) throw new Error((await res.text().catch(() => "")) || `Submit failed (${res.status})`);
  const json = await res.json();
  return parseOrThrow(SubmitResponseSchema, json, "/api/submit");
}
