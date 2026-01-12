// app/(app)/responses/group/[teamId]/assignment/[assignmentId]/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { getCurrentUser, isLoggedIn } from "@/app/lib/authClient";
import { useInstructorSummary } from "@/app/lib/queries";

// helper: group responses by recipient student
function groupBy<T>(arr: T[], keyFn: (x: T) => string) {
  const m = new Map<string, T[]>();
  for (const x of arr) {
    const k = keyFn(x);
    const cur = m.get(k) ?? [];
    cur.push(x);
    m.set(k, cur);
  }
  return m;
}

export default function AssignmentResponsesPage() {
  const router = useRouter();
  const params = useParams<{ teamId: string; assignmentId: string }>();
  const searchParams = useSearchParams();

  const teamId = params?.teamId;
  const assignmentId = params?.assignmentId;
  const classId = searchParams.get("classId");
  const instructorEmailFromQuery = searchParams.get("instructorEmail");

  const instructorEmail = useMemo(() => {
    if (instructorEmailFromQuery) return instructorEmailFromQuery;
    if (isLoggedIn()) return getCurrentUser()?.email ?? null;
    return "instructor@example.com";
  }, [instructorEmailFromQuery]);

  const { data, isLoading, error, refetch } = useInstructorSummary(instructorEmail);

  // find class/team/assignment using existing summary payload
  const selected = useMemo(() => {
    if (!data?.classes || !teamId || !assignmentId || !classId) return null;

    const cls = data.classes.find((c) => c.class_id === classId);
    if (!cls) return null;

    const team = (cls.teams ?? []).find((t) => t.team_id === teamId);
    if (!team) return null;

    const assignment = (cls.assignments ?? []).find((a) => a.assignment_id === assignmentId);
    if (!assignment) return null;

    // submissions that belong to this team (some backends store only linked, but safer to filter)
    const teamSubmissions = (assignment.submissions ?? []).filter((s) => s.team_id === teamId);

    return { cls, team, assignment, teamSubmissions };
  }, [data, teamId, assignmentId, classId]);

  const expectedCount = selected?.team?.members?.length ?? 0;
  const submittedCount = selected?.teamSubmissions?.length ?? 0;

  // expand/collapse per submission_id
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 rounded-2xl border border-orange-100 p-6">
        <p className="text-sm text-red-600 font-medium">Error</p>
        <p className="text-sm text-gray-700 mt-1">{error.message}</p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => refetch()} className="px-4 py-2 rounded-xl border border-gray-300 text-sm">
            Retry
          </button>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-xl border border-gray-300 text-sm">
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="bg-white/90 rounded-2xl border border-orange-100 p-6">
        <p className="text-sm text-gray-700">
          Couldn&apos;t find this assignment/group. Try going back and re-opening it.
        </p>
        <button onClick={() => router.back()} className="mt-4 px-4 py-2 rounded-xl border border-gray-300 text-sm">
          Go back
        </button>
      </div>
    );
  }

  const { cls, team, assignment, teamSubmissions } = selected;

  // convenience map to show student name/email by id
  const memberById = new Map((team.members ?? []).map((m) => [m.user_id, m]));

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white/80 text-sm"
      >
        ← Back
      </button>

      {/* Context header (matches your wireframe top bar) */}
      <div className="bg-white rounded-2xl shadow p-5 border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Course</div>
            <div className="font-medium text-gray-900">{cls.name}</div>
          </div>
          <div>
            <div className="text-gray-500">Section</div>
            <div className="font-medium text-gray-900">{cls.section}</div>
          </div>
          <div>
            <div className="text-gray-500">Group</div>
            <div className="font-medium text-gray-900">{team.team_number}</div>
            <div className="text-xs text-gray-600 mt-1">
              {(team.members ?? []).map((m) => m.email).join(", ")}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Assignment</div>
            <div className="font-medium text-gray-900">{assignment.title}</div>
          </div>
        </div>
      </div>

      {/* Assignment responses section */}
      <div className="bg-white rounded-2xl shadow p-6 border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">
              Assignment Responses for {assignment.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(assignment.start_date).toLocaleDateString()} —{" "}
              {new Date(assignment.due_date).toLocaleDateString()}
            </p>
          </div>

          <div className="text-sm text-gray-600 font-medium">
            {submittedCount}/{expectedCount} student results
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {teamSubmissions.map((sub) => {
            const from = memberById.get(sub.from_student_id);
            const isOpen = !!open[sub.submission_id];

            // group things so UI looks like “questions and answers details”
            const ratingsByTo = groupBy(sub.responses ?? [], (r) => r.to_student_id);
            const commentsByTo = groupBy(sub.comments ?? [], (c) => c.to_student_id);
            const praisesByTo = groupBy(sub.praises ?? [], (p) => p.to_student_id);

            return (
              <div key={sub.submission_id} className="rounded-2xl border shadow-sm p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {from ? `${from.first_name} ${from.last_name}` : sub.from_student_id}
                    </div>
                    <div className="text-xs text-gray-600">{from?.email}</div>
                  </div>

                  <div className="text-xs text-gray-600">
                    submitted on: {new Date(sub.submitted_at).toLocaleString()}
                  </div>

                  <button
                    className="text-sm underline text-gray-700"
                    onClick={() =>
                      setOpen((prev) => ({ ...prev, [sub.submission_id]: !prev[sub.submission_id] }))
                    }
                  >
                    {isOpen ? "Collapse responses" : "Expand responses"}
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-4 rounded-xl border bg-gray-50 p-4">
                    <div className="text-sm font-medium text-gray-900 mb-3">
                      Questions and answers details
                    </div>

                    {/* Very MVP: show what this student wrote about each teammate */}
                    <div className="space-y-4 text-sm">
                      {(team.members ?? []).map((mate) => {
                        if (mate.user_id === sub.from_student_id) return null;

                        const r = ratingsByTo.get(mate.user_id) ?? [];
                        const c = commentsByTo.get(mate.user_id) ?? [];
                        const p = praisesByTo.get(mate.user_id) ?? [];

                        // hide empty teammate blocks
                        if (r.length === 0 && c.length === 0 && p.length === 0) return null;

                        return (
                          <div key={mate.user_id} className="rounded-xl border bg-white p-3">
                            <div className="font-medium text-gray-900">
                              About: {mate.first_name} {mate.last_name}{" "}
                              <span className="text-xs text-gray-500">({mate.email})</span>
                            </div>

                            {r.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-gray-500 mb-1">Ratings</div>
                                <ul className="list-disc pl-5">
                                  {r.map((x) => (
                                    <li key={x.response_id}>
                                      Q: {x.question?.title ?? x.question?.qid ?? x.question?.question_id ?? "Unknown question"} — Rating: {x.rating}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {c.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-gray-500 mb-1">Comments</div>
                                <ul className="list-disc pl-5">
                                  {c.map((x) => (
                                    <li key={x.comment_id}>
                                     Q: {x.question?.title ?? x.question?.qid ?? x.question?.question_id ?? "Unknown question"} — {x.comment_text}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {p.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-gray-500 mb-1">Praise</div>
                                <ul className="list-disc pl-5">
                                  {p.map((x) => (
                                    <li key={x.praise_id}>
                                     Q: {x.question?.title ?? x.question?.qid ?? x.question?.question_id ?? "General"} — {x.praise_text}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {teamSubmissions.length === 0 && (
            <div className="rounded-2xl border p-6 text-sm text-gray-600">
              No submissions found for this assignment + group yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
