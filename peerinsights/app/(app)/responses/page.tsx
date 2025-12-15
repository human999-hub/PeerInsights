// peerinsights/app/(app)/responses/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, isLoggedIn } from "@/app/lib/authClient";
import Link from "next/link";
import {
  InstructorSummaryResponse,
  ClassItem,
  Team, 
  GroupCardModel,
} from "@/app/(app)/responses/types";

import GroupCard from "@/components/responses/GroupCard";


export default function ResponsesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InstructorSummaryResponse | null>(null);

  // Filters (Option 2)
  const [selectedCourseId, setSelectedCourseId] = useState<string>("ALL");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");

  /* ---------------------- AUTH + FETCH ---------------------- */
  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    const user = getCurrentUser();
    if (!user?.email) {
      setError("Unable to determine instructor email.");
      setLoading(false);
      return;
    }

    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/responses/instructor-summary?instructor_email=${encodeURIComponent(
            user.email
          )}`
        );

        if (!res.ok) throw new Error(`Request failed (${res.status})`);

        const json = (await res.json()) as InstructorSummaryResponse;
        if (!json.ok) throw new Error("API returned ok=false");

        setData(json);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load responses.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [router]);

  /* ---------------------- FLATTEN GROUPS ---------------------- */
  const allGroupCards: GroupCardModel[] = useMemo(() => {
    if (!data) return [];

    const out: GroupCardModel[] = [];

    data.classes.forEach((cls: ClassItem) => {
      cls.teams.forEach((team: Team) => {
        out.push({
          classId: cls.class_id,
          className: cls.name,
          section: cls.section,
          term: cls.term,
          year: cls.year,
          teamId: team.team_id,
          teamName: team.team_number,
          members: team.members,
        });
      });
    });

    return out;
  }, [data]);

  /* ---------------------- FILTER OPTIONS ---------------------- */
  const courseOptions = useMemo(() => {
    if (!data) return [];
    return data.classes.map((cls) => ({
      value: cls.class_id,
      label: `${cls.name} (${cls.term} ${cls.year})`,
      section: cls.section,
    }));
  }, [data]);

  const sectionOptions = useMemo(() => {
    if (!data || selectedCourseId === "ALL") return [];
    const cls = data.classes.find(
      (c) => c.class_id === selectedCourseId
    );
    if (!cls) return [];
    return [{ value: cls.section, label: cls.section }];
  }, [data, selectedCourseId]);

  useEffect(() => {
    if (selectedCourseId === "ALL") {
      setSelectedSection("ALL");
    }
  }, [selectedCourseId]);

  /* ---------------------- APPLY FILTERS ---------------------- */
  const filteredGroups = useMemo(() => {
    let list = allGroupCards;

    if (selectedCourseId !== "ALL") {
      list = list.filter((g) => g.classId === selectedCourseId);
    }

    if (selectedCourseId !== "ALL" && selectedSection !== "ALL") {
      list = list.filter((g) => g.section === selectedSection);
    }

    return list;
  }, [allGroupCards, selectedCourseId, selectedSection]);

  /* ---------------------- UI STATES ---------------------- */
  if (loading) {
    return (
      <div className="p-10">
        <h1 className="text-3xl font-semibold mb-4">Responses</h1>
        <p className="text-gray-600">Loading responses…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10">
        <h1 className="text-3xl font-semibold mb-4">Responses</h1>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          className="px-4 py-2 border rounded-lg"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  /* ---------------------- MAIN UI ---------------------- */
  return (
    <div className="p-10">
      <Link
            href="/"
            className="button-secondary text-sm inline-flex items-center gap-2"
          >
            <span aria-hidden="true">←</span>
            Back to Dashboard
          </Link>
      <h1 className="flex-1 text-center text-2xl md:text-3xl font-semibold text-primary">Responses</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Filters */}
        <aside className="col-span-12 md:col-span-3">
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold mb-4">Filters</h2>

            {/* Course */}
            <label className="block text-sm mb-1">Course</label>
            <select
              className="w-full border rounded-lg px-3 py-2 mb-4"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              <option value="ALL">All</option>
              {courseOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Section */}
            <label className="block text-sm mb-1">Section</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={selectedCourseId === "ALL"}
            >
              <option value="ALL">All</option>
              {sectionOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {selectedCourseId === "ALL" && (
              <p className="text-xs text-gray-500 mt-2">
                Select a course to filter by section.
              </p>
            )}

            <button
              className="w-full mt-4 px-4 py-2 border rounded-lg"
              onClick={() => {
                setSelectedCourseId("ALL");
                setSelectedSection("ALL");
              }}
            >
              Reset
            </button>
          </div>
        </aside>

        {/* Results */}
        <main className="col-span-12 md:col-span-9">
          <div className="flex justify-between items-center m-4">
            <p className="text-gray-500">Viewing responses by group</p>
            <p className="text-gray-500">
              {filteredGroups.length} result(s)
            </p>
          </div>

          <div className="space-y-4">
            {filteredGroups.map((g) => (
              <GroupCard
                key={g.teamId}
                courseName={g.className}
                section={g.section}
                teamId={g.teamId}
                teamName={g.teamName}
                members={g.members}
                classId={g.classId}
                instructorEmail={data?.instructor.email ?? "instructor@example.com"}
              />
            ))}

            {filteredGroups.length === 0 && (
              <div className="bg-white rounded-2xl shadow p-6 text-gray-600">
                No groups found for the selected filters.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
