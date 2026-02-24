"use client";

import { AssignmentDetailCommentItem, AssignmentDetailPraiseItem, AssignmentDetailResponseItem, AssignmentDetailSubmission } from "@/app/lib/zodSchemas";
import { useMemo } from "react";

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

function formatDateTime(v: unknown) {
  if (!v) return "—";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function questionLabel(x: AssignmentDetailResponseItem | AssignmentDetailCommentItem | AssignmentDetailPraiseItem) {
  return (
    x?.question?.title ??
    x?.question?.qid ??
    x?.question?.question_id ??
    x?.question_id ??
    "Unknown question"
  );
}

// Subtle rating chip color (optional upgrade)
function ratingChipClass(rating: unknown) {
  const n = typeof rating === "number" ? rating : Number(rating);
  if (!Number.isFinite(n)) return "bg-white border text-gray-900";
  if (n >= 4) return "bg-green-50 border-green-200 text-green-800";
  if (n === 3) return "bg-amber-50 border-amber-200 text-amber-800";
  return "bg-red-50 border-red-200 text-red-800";
}

type Member = {
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

type SubmissionCardProps = {
  submission: AssignmentDetailSubmission; // AssignmentDetailSubmission, but we want to be flexible for now
  members: Member[];
  memberById: Map<string, Member>;
  expectedCount: number;

  isOpen: boolean;
  onToggle: () => void;
};

export default function SubmissionCard({
  submission: sub,
  members,
  memberById,
  expectedCount,
  isOpen,
  onToggle,
}: SubmissionCardProps) {
  const from = memberById.get(sub.from_student_id);
  const fromName =
    from ? `${from.first_name ?? ""} ${from.last_name ?? ""}`.trim() : sub.from_student_id;

  // Group items by recipient (teammate)
  const { ratingsByTo, commentsByTo, praisesByTo } = useMemo(() => {
    return {
      ratingsByTo: groupBy(sub.responses ?? [], (r: AssignmentDetailResponseItem) => r.to_student_id),
      commentsByTo: groupBy(sub.comments ?? [], (c: AssignmentDetailCommentItem) => c.to_student_id),
      praisesByTo: groupBy(sub.praises ?? [], (p: AssignmentDetailPraiseItem) => p.to_student_id),
    };
  }, [sub]);

  // Teammates that actually have any feedback in this submission (reduces noise)
  const teammatesWithFeedback = useMemo(() => {
    const ids = new Set<string>();
    for (const m of members) {
      if (m.user_id === sub.from_student_id) continue;
      const r = ratingsByTo.get(m.user_id) ?? [];
      const c = commentsByTo.get(m.user_id) ?? [];
      const p = praisesByTo.get(m.user_id) ?? [];
      if (r.length || c.length || p.length) ids.add(m.user_id);
    }
    return members.filter((m) => ids.has(m.user_id));
  }, [members, sub.from_student_id, ratingsByTo, commentsByTo, praisesByTo]);

  return (
    <div className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition">
      {/* HEADER (left accent + “who evaluated whom” + date + toggle) */}
      <div className="p-5">
        <div className="border-l-4 border-primary pl-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {fromName} <span className="text-gray-400 font-normal">→</span>{" "}
                <span className="text-gray-700 font-medium">Peer Evaluation</span>
              </div>
              <div className="text-xs text-gray-600 truncate">{from?.email ?? ""}</div>
            </div>

            <div className="text-xs text-gray-600">
              <span className="text-gray-500">Submitted:</span>{" "}
              {formatDateTime(sub.submitted_at)}
            </div>

            <button
              onClick={onToggle}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary w-fit"
              aria-expanded={isOpen}
            >
              {/* Chevron (pure CSS) */}
              <span
                className={[
                  "inline-block h-2 w-2 border-r-2 border-b-2 border-current",
                  "transform transition-transform duration-200",
                  isOpen ? "-rotate-135" : "rotate-45",
                ].join(" ")}
                aria-hidden="true"
              />
              {isOpen ? "Hide details" : "View details"}
            </button>
          </div>

          {/* Small meta line (optional) */}
          <div className="mt-3 text-xs text-gray-500">
            Showing feedback for{" "}
            <span className="font-medium text-gray-700">
              {teammatesWithFeedback.length}
            </span>{" "}
            teammate(s) out of{" "}
            <span className="font-medium text-gray-700">
              {Math.max(expectedCount - 1, 0)}
            </span>
            .
          </div>
        </div>
      </div>

      {/* DETAILS (reduced visual nesting: separators + bg-gray-50, no inner cards) */}
      <div
        className={[
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-[2400px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="bg-gray-50 px-5 pb-5">
          <div className="pt-4 border-t border-gray-200">
            {teammatesWithFeedback.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-white p-4 text-sm text-gray-600">
                No ratings, comments, or praise were provided in this submission.
              </div>
            ) : (
              <div className="space-y-6">
                {teammatesWithFeedback.map((mate) => {
                  const mateName =
                    `${mate.first_name ?? ""} ${mate.last_name ?? ""}`.trim() || "Student";
                  const r = ratingsByTo.get(mate.user_id) ?? [];
                  const c = commentsByTo.get(mate.user_id) ?? [];
                  const p = praisesByTo.get(mate.user_id) ?? [];

                  return (
                    <div key={mate.user_id} className="pt-4 border-t first:border-t-0 first:pt-0">
                      {/* Teammate header */}
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-semibold text-gray-900">
                          Feedback for {mateName}{" "}
                          <span className="text-xs font-normal text-gray-500">
                            ({mate.email ?? ""})
                          </span>
                        </div>
                      </div>

                      {/* Ratings in 2-col grid */}
                      {r.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-semibold text-gray-600 mb-2">
                            Ratings
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            {r.map((x: AssignmentDetailResponseItem) => (
                              <div
                                key={x.response_id}
                                className="flex items-center justify-between gap-3 rounded-xl bg-white border px-3 py-2"
                              >
                                <div className="text-gray-700 truncate">
                                  {questionLabel(x)}
                                </div>
                                <div
                                  className={[
                                    "shrink-0 rounded-full border px-2 py-0.5 text-sm font-semibold",
                                    ratingChipClass(x.rating),
                                  ].join(" ")}
                                  title="Rating"
                                >
                                  {x.rating ?? "—"}
                                  <span className="text-xs font-normal text-gray-500"> / 5</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comments */}
                      {c.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs font-semibold text-gray-600 mb-2">
                            Comments
                          </div>
                          <div className="space-y-2">
                            {c.map((x: AssignmentDetailCommentItem) => (
                              <div key={x.comment_id} className="bg-gray-100 rounded-lg p-3">
                                <div className="text-xs text-gray-500 mb-1">
                                  {questionLabel(x)}
                                </div>
                                <div className="text-sm italic text-gray-800 whitespace-pre-wrap">
                                  “{x.comment_text ?? ""}”
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Praise */}
                      {p.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs font-semibold text-gray-600 mb-2">
                            Praise
                          </div>
                          <div className="space-y-2">
                            {p.map((x: AssignmentDetailPraiseItem) => (
                              <div
                                key={x.praise_id}
                                className="bg-green-50 border-l-4 border-green-400 rounded-lg p-3"
                              >
                                <div className="text-xs text-gray-600 mb-1">
                                  {/* optional icon */}
                                  <span aria-hidden="true" className="mr-1">★</span>
                                  {x.question ? questionLabel(x) : "General praise"}
                                </div>
                                <div className="text-sm text-gray-900 whitespace-pre-wrap">
                                  {x.praise_text ?? ""}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* If a teammate only had one of the sections */}
                      {r.length === 0 && c.length === 0 && p.length === 0 && (
                        <div className="mt-3 text-sm text-gray-600">
                          No feedback provided.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
