// app/lib/assignmentsApi.ts
import { ZodType } from "zod";
import {
  CreateAssignmentRequest,
  CreateAssignmentRequestSchema,
  CreateAssignmentResponse,
  CreateAssignmentResponseSchema,
  ListAssignmentsResponse,
  ListAssignmentsResponseSchema,
  UpdateAssignmentRequest,
  UpdateAssignmentResponse,
  UpdateAssignmentRequestSchema,
  UpdateAssignmentResponseSchema,
  AssignmentItemSchema,
} from "./zodSchemas";

const BASE = "";

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
    return `${fallback} (${res.status}): ${text}`;
  }
}
// Create Assignment
export async function createAssignment(
  body: CreateAssignmentRequest
): Promise<CreateAssignmentResponse> {
  const payload = CreateAssignmentRequestSchema.parse(body);
  const res = await fetch(`${BASE}/api/assignments/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res, "Create assignment failed"));
  const json = await res.json();
  return parseOrThrow(CreateAssignmentResponseSchema, json, "/api/assignments/create");
}

// List Assignments by Class
// export async function fetchAssignmentsByClass(
//   instructorEmail: string,
//   section: string,
//   opts?: { signal?: AbortSignal }
// ): Promise<ListAssignmentsResponse["assignments"]> {
//   const url = `/api/assignments/by-class?instructor_email=${encodeURIComponent(
//     instructorEmail
//   )}&section=${encodeURIComponent(section)}`;
//   const res = await fetch(url, { method: "GET", cache: "no-store", signal: opts?.signal });
//   if (!res.ok) throw new Error(`Failed to load assignments (${res.status})`);
//   const json = await res.json();
//   const parsed = ListAssignmentsResponseSchema.parse(json);
//   return parsed.assignments;
// }

export async function fetchAssignmentsByClass(
  instructorEmail: string,
  section: string,
  opts?: { signal?: AbortSignal }
): Promise<ListAssignmentsResponse["assignments"]> {
  const url = `/api/assignments/by-class?instructor_email=${encodeURIComponent(
    instructorEmail
  )}&section=${encodeURIComponent(section)}`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal: opts?.signal,
  });

  if (!res.ok) throw new Error(`Failed to load assignments (${res.status})`);

  const json = await res.json();

  // Normalize backend fields -> frontend fields
  // const normalized = (Array.isArray(json.assignments) ? json.assignments : []).map(
  //   (a: AssignmentItem) => ({
  //     _id: a.assignment_id,
  //     name: a.assignment_name,
  //     start_date: a.start_date,
  //     end_date: a.end_date,
  //   })
  // );
    const normalized = (Array.isArray(json.assignments) ? json.assignments : []).map((a: unknown) =>
    AssignmentItemSchema.parse(a)
  );

  // Now validate using your existing zod schema (keeps it safe)
  const parsed = ListAssignmentsResponseSchema.parse({
    ok: true,
    assignments: normalized,
  });

  return parsed.assignments;
}


// UPDATE (edit)
export async function updateAssignment(
  body: UpdateAssignmentRequest
): Promise<UpdateAssignmentResponse> {
  const payload = UpdateAssignmentRequestSchema.parse(body);
  const res = await fetch(`${BASE}/api/assignments/edit`, {
    method: "POST", // use POST if that’s how your route is defined
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res, "Update assignment failed"));
  const json = await res.json();
  return parseOrThrow(UpdateAssignmentResponseSchema, json, "/api/assignments/edit");
}