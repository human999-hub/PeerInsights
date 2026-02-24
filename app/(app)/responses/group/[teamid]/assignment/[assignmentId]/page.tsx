"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { useAssignmentDetail } from "@/app/lib/queries";
import SubmissionCard from "@/components/responses/SubmissionCard";
import { AssignmentDetailSubmission, AssignmentTeamMember } from "@/app/lib/zodSchemas";
// helper: group responses by recipient student
// function groupBy<T>(arr: T[], keyFn: (x: T) => string) {
//   const m = new Map<string, T[]>();
//   for (const x of arr) {
//     const k = keyFn(x);
//     const cur = m.get(k) ?? [];
//     cur.push(x);
//     m.set(k, cur);
//   }
//   return m;
// }

// function formatDateTime(v: unknown) {
//   if (!v) return "—";
//   const d = new Date(String(v));
//   if (Number.isNaN(d.getTime())) return String(v);
//   return d.toLocaleString();
// }

function formatDate(v: unknown) {
  if (!v) return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString();
}

function clampPct(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

// function questionLabel(x: any) {
//   return (
//     x?.question?.title ??
//     x?.question?.qid ??
//     x?.question?.question_id ??
//     x?.question_id ??
//     "Unknown question"
//   );
// }

export default function AssignmentResponsesPage() {
  const router = useRouter();
  const params = useParams<{ teamId: string; assignmentId: string }>();

  const teamId = params?.teamId ?? null;
  const assignmentId = params?.assignmentId ?? null;

  const { data, isLoading, error, refetch } = useAssignmentDetail(
    assignmentId,
    teamId,
  );

  const selected = useMemo(() => {
    if (!data?.ok) return null;
    return {
      team: data.team,
      assignment: data.assignment,
      submissions: data.submissions ?? [],
    };
  }, [data]);

  const expectedCount = selected?.team?.members?.length ?? 0;
  const submittedCount = selected?.submissions?.length ?? 0;
  const pct =
    expectedCount > 0 ? clampPct((submittedCount / expectedCount) * 100) : 0;

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
      <div className="mx-auto max-w-6xl p-6">
        <div className="bg-white rounded-2xl border p-6">
          <p className="text-sm text-red-600 font-medium">Error</p>
          <p className="text-sm text-gray-700 mt-1">{error.message}</p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm"
            >
              Retry
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl border border-gray-300 text-sm"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="bg-white rounded-2xl border p-6">
          <p className="text-sm text-gray-700">
            Couldn&apos;t find this assignment/group. Try going back and
            re-opening it.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 rounded-xl border border-gray-300 text-sm"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const { team, assignment, submissions } = selected;
  const members = team.members ?? [];
  const memberById = new Map(members.map((m: AssignmentTeamMember) => [m.user_id, m]));
  // auto-expand if only 1 submission exists
  const autoOpenSingle = submissions.length === 1;
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white text-sm"
      >
        ← Back
      </button>

      {/* Summary strip */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="text-sm text-gray-500">Assignment</div>
            <div className="text-lg font-semibold text-gray-900">
              {assignment.title ?? "Untitled"}
            </div>
            <div className="text-sm text-gray-600">
              {formatDate(assignment.start_date)} –{" "}
              {formatDate(assignment.due_date)}
              <span className="mx-2 text-gray-300">•</span>
              <span className="font-medium">Group:</span> {team.team_number}
            </div>
          </div>

          <div className="w-full md:max-w-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Submissions</span>
              <span className="font-medium text-gray-900">
                {submittedCount}/{expectedCount} ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Each submission corresponds to one student&apos;s evaluation.
            </div>
          </div>
        </div>

        {/* Members as pills */}
        <div className="mt-6">
          <p className="text-sm font-medium text-gray-700">
            Members <span className="text-gray-400">({members.length})</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {members.map((m: AssignmentTeamMember) => {
              const name =
                `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() ||
                "Student";
              return (
                <span
                  key={m.user_id}
                  className="inline-flex items-center gap-2 rounded-full border bg-gray-50 px-3 py-1 text-sm text-gray-800"
                  title={m.email ?? ""}
                >
                  <span className="font-medium">{name}</span>
                  <span className="text-gray-400 text-xs">{m.email ?? ""}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submissions */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Student submissions
            </h2>
            <p className="text-sm text-gray-600">
              Expand a student card to see ratings, comments, and praise per
              teammate.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {submissions.length} submission(s)
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {submissions.map((sub: AssignmentDetailSubmission) => {
            // const from = memberById.get(sub.from_student_id);
            // const fromName =
            // from ? `${from.first_name ?? ""} ${from.last_name ?? ""}`.trim() : sub.from_student_id;
            const isOpen = open[sub.submission_id] ?? autoOpenSingle;

            // const ratingsByTo = groupBy(sub.responses ?? [], (r: any) => r.to_student_id);
            // const commentsByTo = groupBy(sub.comments ?? [], (c: any) => c.to_student_id);
            // const praisesByTo = groupBy(sub.praises ?? [], (p: any) => p.to_student_id);

            return (
              // <div
              //   key={sub.submission_id}
              //   className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition"
              // >
              //   <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              //     <div className="min-w-0">
              //       <div className="text-sm font-semibold text-gray-900 truncate">{fromName}</div>
              //       <div className="text-xs text-gray-600">{from?.email ?? ""}</div>
              //     </div>

              //     <div className="text-xs text-gray-600">
              //       Submitted: {formatDateTime(sub.submitted_at)}
              //     </div>

              //     <button
              //       className="text-sm font-medium text-gray-800 underline underline-offset-4 w-fit"
              //       onClick={() =>
              //         setOpen((prev) => ({
              //           ...prev,
              //           [sub.submission_id]: !prev[sub.submission_id],
              //         }))
              //       }
              //     >
              //       {isOpen ? "Hide details" : "View details"}
              //     </button>
              //   </div>

              //   {isOpen && (
              //     <div className="mt-5 rounded-2xl border bg-gray-50 p-5">
              //       <div className="text-sm font-semibold text-gray-900 mb-4">
              //         Teammate feedback
              //       </div>

              //       <div className="space-y-4">
              //         {members.map((mate: any) => {
              //           if (mate.user_id === sub.from_student_id) return null;

              //           const r = ratingsByTo.get(mate.user_id) ?? [];
              //           const c = commentsByTo.get(mate.user_id) ?? [];
              //           const p = praisesByTo.get(mate.user_id) ?? [];

              //           if (r.length === 0 && c.length === 0 && p.length === 0) return null;

              //           const mateName =
              //             `${mate.first_name ?? ""} ${mate.last_name ?? ""}`.trim() || "Student";

              //           return (
              //             <div key={mate.user_id} className="rounded-2xl border bg-white p-4">
              //               <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              //                 <div className="font-semibold text-gray-900">
              //                   About: {mateName}{" "}
              //                   <span className="text-xs font-normal text-gray-500">
              //                     ({mate.email ?? ""})
              //                   </span>
              //                 </div>
              //               </div>

              //               {/* Ratings */}
              //               {r.length > 0 && (
              //                 <div className="mt-4">
              //                   <div className="text-xs font-semibold text-gray-600 mb-2">
              //                     Ratings
              //                   </div>
              //                   <div className="space-y-2">
              //                     {r.map((x: any) => (
              //                       <div
              //                         key={x.response_id}
              //                         className="flex items-start justify-between gap-4 rounded-xl border bg-gray-50 px-3 py-2"
              //                       >
              //                         <div className="text-sm text-gray-900">
              //                           <span className="text-gray-500">Q:</span>{" "}
              //                           {questionLabel(x)}
              //                         </div>
              //                         <div className="shrink-0 rounded-full bg-white border px-2 py-0.5 text-sm font-semibold text-gray-900">
              //                           {x.rating ?? "—"}
              //                         </div>
              //                       </div>
              //                     ))}
              //                   </div>
              //                 </div>
              //               )}

              //               {/* Comments */}
              //               {c.length > 0 && (
              //                 <div className="mt-4">
              //                   <div className="text-xs font-semibold text-gray-600 mb-2">
              //                     Comments
              //                   </div>
              //                   <div className="space-y-2">
              //                     {c.map((x: any) => (
              //                       <div
              //                         key={x.comment_id}
              //                         className="rounded-xl border bg-gray-50 px-3 py-2"
              //                       >
              //                         <div className="text-xs text-gray-500">
              //                           Q: {questionLabel(x)}
              //                         </div>
              //                         <div className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
              //                           {x.comment_text ?? ""}
              //                         </div>
              //                       </div>
              //                     ))}
              //                   </div>
              //                 </div>
              //               )}

              //               {/* Praise */}
              //               {p.length > 0 && (
              //                 <div className="mt-4">
              //                   <div className="text-xs font-semibold text-gray-600 mb-2">
              //                     Praise
              //                   </div>
              //                   <div className="space-y-2">
              //                     {p.map((x: any) => (
              //                       <div
              //                         key={x.praise_id}
              //                         className="rounded-xl border bg-amber-50 px-3 py-2"
              //                       >
              //                         <div className="text-xs text-gray-600">
              //                           {x.question ? `Q: ${questionLabel(x)}` : "General praise"}
              //                         </div>
              //                         <div className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
              //                           {x.praise_text ?? ""}
              //                         </div>
              //                       </div>
              //                     ))}
              //                   </div>
              //                 </div>
              //               )}
              //             </div>
              //           );
              //         })}
              //       </div>

              //       {/* If none rendered for some reason */}
              //       {members.length > 0 && (
              //         <div className="mt-4 text-xs text-gray-500">
              //           Only teammates with any feedback are shown.
              //         </div>
              //       )}
              //     </div>
              //   )}
              // </div>
              <SubmissionCard
                key={sub.submission_id}
                submission={sub}
                members={members}
                memberById={memberById}
                expectedCount={expectedCount}
                isOpen={isOpen}
                onToggle={() =>
                  setOpen((prev) => ({
                    ...prev,
                    [sub.submission_id]: !(
                      prev[sub.submission_id] ?? autoOpenSingle
                    ),
                  }))
                }
              />
            );
          })}

          {submissions.length === 0 && (
            <div className="rounded-2xl border bg-gray-50 p-6 text-sm text-gray-600">
              No submissions found for this assignment + group yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
