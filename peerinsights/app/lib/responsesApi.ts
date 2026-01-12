// app/lib/responsesApi.ts
import { ZodType } from "zod";
import {
  InstructorSummaryResponse,
  InstructorSummaryResponseSchema,
} from "./zodSchemas";

function parseOrThrow<T>(schema: ZodType<T>, data: unknown, path: string): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new Error(`Unexpected server response at ${path}.`);
  return parsed.data;
}

async function readError(res: Response, fallback: string) {
  const text = await res.text().catch(() => "");
  if (!text) return `${fallback} (${res.status})`;
  try {
    const j = JSON.parse(text);
    return j?.message ? `${fallback}: ${j.message}` : `${fallback} (${res.status})`;
  } catch {
    return `${fallback} (${res.status})`;
  }
}

export async function fetchInstructorSummary(
  instructorEmail: string,
  opts?: { signal?: AbortSignal }
): Promise<InstructorSummaryResponse> {
  const url = `/api/responses/instructor-summary?instructor_email=${encodeURIComponent(
    instructorEmail
  )}`;

  const res = await fetch(url, { method: "GET", signal: opts?.signal });
  if (!res.ok) throw new Error(await readError(res, "Failed to load responses"));

  const json = await res.json();
  return parseOrThrow(InstructorSummaryResponseSchema, json, url);
}
