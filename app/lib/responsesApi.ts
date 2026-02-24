// app/lib/responsesApi.ts
import { ZodType } from "zod";
import {
  InstructorSummaryResponse,
  InstructorSummaryResponseSchema,
  InstructorSummaryLiteResponse,
  InstructorSummaryLiteResponseSchema,
  GroupAssignmentsResponse,
  GroupAssignmentsResponseSchema,
  AssignmentDetailResponse,
  AssignmentDetailResponseSchema,
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
    return j?.error
      ? `${fallback}: ${j.error}`
      : j?.message
        ? `${fallback}: ${j.message}`
        : `${fallback} (${res.status})`;
  } catch {
    return `${fallback} (${res.status})`;
  }
}

// 0) GET /api/responses/instructor-summary
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


// 1) GET /api/responses/instructor-summary-lite
export async function fetchInstructorSummaryLite(
  instructorEmail: string,
  opts?: { signal?: AbortSignal }
): Promise<InstructorSummaryLiteResponse> {
  const url = `/api/responses/instructor-summary-lite?instructor_email=${encodeURIComponent(
    instructorEmail
  )}`;

  const res = await fetch(url, { method: "GET", signal: opts?.signal });
  if (!res.ok) throw new Error(await readError(res, "Failed to load summary"));

  const json = await res.json();
  return parseOrThrow(InstructorSummaryLiteResponseSchema, json, url);
}

// 2) GET /api/responses/group-assignments
export async function fetchGroupAssignments(
  classId: string,
  teamId: string,
  opts?: { signal?: AbortSignal }
): Promise<GroupAssignmentsResponse> {
  const url = `/api/responses/group-assignments?classId=${encodeURIComponent(
    classId
  )}&teamId=${encodeURIComponent(teamId)}`;

  const res = await fetch(url, { method: "GET", signal: opts?.signal });
  if (!res.ok) throw new Error(await readError(res, "Failed to load assignments"));

  const json = await res.json();
  return parseOrThrow(GroupAssignmentsResponseSchema, json, url);
}

// 3) GET /api/responses/assignment-detail
export async function fetchAssignmentDetail(
  assignmentId: string,
  teamId: string,
  opts?: { signal?: AbortSignal }
): Promise<AssignmentDetailResponse> {
  const url = `/api/responses/assignment-detail?assignmentId=${encodeURIComponent(
    assignmentId
  )}&teamId=${encodeURIComponent(teamId)}`;

  const res = await fetch(url, { method: "GET", signal: opts?.signal });
  if (!res.ok) throw new Error(await readError(res, "Failed to load assignment detail"));

  const json = await res.json();
  return parseOrThrow(AssignmentDetailResponseSchema, json, url);
}