// peerinsights/app/(app)/responses/group/[teamid]/page.tsx
"use client";

import { useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { useGroupAssignments } from "@/app/lib/queries";

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

export default function GroupAssignmentsPage() {
  const router = useRouter();
  const params = useParams<{ teamId: string }>();
  const searchParams = useSearchParams();

  const teamId = params.teamId ?? null;
  const classId = searchParams.get("classId");

  // React Query fetch (Zod-validated inside responsesApi)
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGroupAssignments(classId, teamId);

  // Extract selected group info
  const selected = useMemo(() => {
    if (!data?.ok) return null;
    return {
      cls: data.class,
      team: data.team,
      assignments: data.assignments ?? [],
    };
  }, [data]);


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
            Couldn&apos;t find this group. Try going back and re-opening it.
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

  const { cls, team, assignments } = selected;
  const expectedCount = team.members?.length ?? 0;

  // Aggregate progress across assignments (optional but nice)
  const totalReceived = assignments.reduce((sum, a) => sum + (a.submissionsCount ?? 0), 0);
  const totalExpected = expectedCount * Math.max(assignments.length, 1);
  const overallPct = totalExpected > 0 ? clampPct((totalReceived / totalExpected) * 100) : 0;
return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      {/* Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/responses")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white text-sm"
        >
          ← Back to Responses
        </button>
      </div>

      {/* Summary strip */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="text-sm text-gray-500">Course</div>
            <div className="text-lg font-semibold text-gray-900">
              {cls.name ?? "Untitled Course"}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Section:</span> {cls.section ?? "—"}
              <span className="mx-2 text-gray-300">•</span>
              <span className="font-medium">Group:</span> {team.team_number}
            </div>
          </div>

          {/* <div className="w-full md:max-w-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Responses received</span>
              <span className="font-medium text-gray-900">{overallPct.toFixed(0)}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${overallPct}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-gray-500">
              This is an aggregate across assignments (received / expected).
            </div>
          </div> */}
        </div>

        {/* Members as pills */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Members <span className="text-gray-400">({expectedCount})</span>
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(team.members ?? []).map((m) => {
              const name = `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "Student";
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

      {/* Assignments */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Assignments</h2>
            <p className="text-sm text-gray-600">
              Open an assignment to view submissions and feedback by teammate.
            </p>
          </div>
          <div className="text-sm text-gray-500">{assignments.length} result(s)</div>
        </div>

        {assignments.length === 0 ? (
          <div className="mt-6 rounded-xl border bg-gray-50 p-6 text-sm text-gray-600">
            No assignments found for this group.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignments.map((a) => {
              const received = a.submissionsCount ?? 0;
              const pct = expectedCount > 0 ? clampPct((received / expectedCount) * 100) : 0;

              return (
                <div
                  key={a.assignment_id}
                  className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {a.title ?? "Untitled assignment"}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {formatDate(a.start_date)} – {formatDate(a.due_date)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {received}/{expectedCount}
                    </span>
                  </div>

                  {/* mini progress */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Responses received</span>
                      <span className="font-medium text-gray-900">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    className="mt-5 w-full px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-95 transition"
                    onClick={() =>
                      router.push(`/responses/group/${team.team_id}/assignment/${a.assignment_id}`)
                    }
                  >
                    Open responses
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Optional placeholder */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI analysis</h3>
            <p className="text-sm text-gray-600">
              Generate a summary once enough responses are collected.
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
            onClick={() => alert("to do: AI analysis")}
          >
            Analyze
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
          AI RESULTS SECTION (placeholder)
        </div>
      </div>
    </div>
  );
}