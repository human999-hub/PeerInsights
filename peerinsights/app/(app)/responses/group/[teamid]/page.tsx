// app/(app)/responses/group/[teamId]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";
import { getCurrentUser } from "@/app/lib/authClient";

type ApiResponse = any; // for demo: keep loose; tighten later

export default function GroupAssignmentsPage() {
  const router = useRouter();
  const params = useParams<{ teamId: string }>();
  const searchParams = useSearchParams();
  const teamId = params.teamId;
  const classId = searchParams.get("classId");
const instructorEmailFromQuery = searchParams.get("instructorEmail");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    const email =  instructorEmailFromQuery ?? user?.email ?? "instructor@example.com";

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/responses/instructor-summary?instructor_email=${encodeURIComponent(
            email
          )}`
        );

        const json = await res.json();
        if (!json?.ok) throw new Error("API returned ok=false");

        setData(json);
      } catch (e: any) {
        setError(e?.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [instructorEmailFromQuery]);

  const selected = useMemo(() => {
    if (!data?.classes || !teamId || !classId) return null;

    const cls = data.classes.find((c: any) => c.class_id === classId);
    if (!cls) return null;

    const team = cls.teams?.find((t: any) => t.team_id === teamId);
    if (!team) return null;

    const assignments = (cls.assignments ?? []).filter((a: any) =>
      (a.linked_team_ids ?? []).includes(teamId)
    );

    return { cls, team, assignments };
  }, [data, teamId, classId]);

  if (loading) {
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
        <p className="text-sm text-gray-700 mt-1">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 rounded-xl border border-gray-300 text-sm"
        >
          Go back
        </button>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="bg-white/90 rounded-2xl border border-orange-100 p-6">
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
    );
  }

  const { cls, team, assignments } = selected;
  const expectedCount = team.members?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/responses")}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 bg-white/80 text-sm"
      >
        ← Back to Responses
      </button>

      {/* Context header */}
      <div className="bg-white/90 rounded-2xl border border-orange-100 shadow-md p-6">
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Course</p>
            <p className="font-medium text-gray-900">{cls.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Section</p>
            <p className="font-medium text-gray-900">{cls.section}</p>
          </div>
          <div>
            <p className="text-gray-500">Group</p>
            <p className="font-medium text-gray-900">{team.team_number}</p>
            <p className="text-xs text-gray-600 mt-1">
              {expectedCount} student(s)
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-gray-500 text-sm mb-1">Members</p>
          <ul className="text-sm text-gray-900 space-y-1">
            {(team.members ?? []).map((m: any) => (
              <li key={m.email}>
                {m.first_name} {m.last_name}{" "}
                <span className="text-xs text-gray-500">({m.email})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Assignments */}
      <div className="bg-white/90 rounded-2xl border border-orange-100 shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">
            Assignment Responses till date
          </h2>
          <p className="text-sm text-gray-500">{assignments.length} result(s)</p>
        </div>

        {assignments.length === 0 ? (
          <p className="text-sm text-gray-600">No assignments found for this group.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {assignments.map((a: any) => {
              const submissionsForTeam =
                (a.submissions ?? []).filter((s: any) => s.team_id === teamId)
                  .length ?? 0;

              return (
                <div
                  key={a.assignment_id}
                  className="rounded-2xl border border-orange-100 bg-white shadow-sm p-4 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-600 font-medium">
                      {submissionsForTeam}/{expectedCount} responded
                    </p>
                  </div>

                  <div className="mt-3 text-xs text-gray-600 space-y-1">
                    <p>
                      <span className="text-gray-500">Start:</span>{" "}
                      {new Date(a.start_date).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="text-gray-500">Due:</span>{" "}
                      {new Date(a.due_date).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    className="mt-4 w-fit px-4 py-2 rounded-full bg-primary text-white text-sm font-medium"
                    onClick={() =>
                      alert("to do: assignment detail page")
                    }
                  >
                    View Responses
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Optional placeholder for demo */}
      <div className="bg-white/90 rounded-2xl border border-orange-100 shadow-md p-6">
        <button
          className="px-4 py-2 rounded-full bg-black text-white text-sm font-medium"
          onClick={() => alert("to do: AI analysis")}
        >
          Analyze with AI
        </button>

        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
          AI RESULTS SECTION (placeholder)
        </div>
      </div>
    </div>
  );
}
