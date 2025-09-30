import { ZodType, z } from "zod";
import {
  CreateClassRequest,
  CreateClassRequestSchema,
  CreateClassResponse,
  CreateClassResponseSchema,
  CreatedClassSchema,
} from "./zodSchemas";

const BASE = "";

function parseOrThrow<T>(schema: ZodType<T>, data: unknown, path: string): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new Error(`Unexpected server response at ${path}.`);
  return parsed.data;
}

const ErrorJSONSchema = z.object({ message: z.string() });

async function readError(res: Response, fallback: string) {
  const text = await res.text().catch(() => "");
  if (!text) return `${fallback} (${res.status})`;
  try {
    const j = JSON.parse(text);
    const p = ErrorJSONSchema.safeParse(j);
    return p.success ? p.data.message : `${fallback} (${res.status}): ${text}`;
  } catch {
    return `${fallback} (${res.status}): ${text}`;
  }
}

export async function createClass(reqBody: CreateClassRequest): Promise<CreateClassResponse> {
  const body = CreateClassRequestSchema.parse(reqBody);
  const res = await fetch(`${BASE}/api/classes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(await readError(res, "Create class failed"));
  const json = await res.json();
  return parseOrThrow(CreateClassResponseSchema, json, "/api/classes");
}
const ListClassesResponseSchema = z.object({
  ok: z.literal(true),
  classes: z.array(CreatedClassSchema),
});
export type ListClassesResponse = z.infer<typeof ListClassesResponseSchema>;

export async function fetchClassesByInstructor(email: string, opts?: { signal?: AbortSignal }) {
  const res = await fetch(`/api/classes/by-instructor?email=${encodeURIComponent(email)}`, {
    method: "GET",
    cache: "no-store",
    signal: opts?.signal,
  });
  if (!res.ok) throw new Error(`Failed to load classes (${res.status})`);
  const json = await res.json();
  const parsed = ListClassesResponseSchema.parse(json);
  return parsed.classes;
}