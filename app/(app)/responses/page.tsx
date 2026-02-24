// peerinsights/app/(app)/responses/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getCurrentUser, isLoggedIn } from "@/app/lib/authClient";
import GroupCard from "@/components/responses/GroupCard";

import { useInstructorSummaryLite } from "@/app/lib/queries";
import { GroupCardModel } from "@/app/(app)/responses/types";
import { LiteClass, LiteTeam } from "@/app/lib/zodSchemas";

export default function ResponsesPage() {
  const router = useRouter();

  // Filters
  const [selectedCourseId, setSelectedCourseId] = useState<string>("ALL");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");

  const userEmail = isLoggedIn() ? getCurrentUser()?.email ?? null : null;

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn()) router.push("/login");
  }, [router]);

  // React Query fetch
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useInstructorSummaryLite(userEmail);

  // Flatten groups
  const allGroupCards: GroupCardModel[] = useMemo(() => {
    if (!data?.classes) return [];

    const out: GroupCardModel[] = [];
    data.classes.forEach((cls: LiteClass) => {
      const classId = cls.class_id;
      const className = cls.name ?? "";
      const section = cls.section ?? "";
      const term = cls.term ?? "";
      const year = cls.year ?? 0;

      (cls.teams ?? []).forEach((team: LiteTeam) => {
        out.push({
          classId,
          className,
          section,
          term,
          year,
          teamId: team.team_id,
          teamName: team.team_number,
          members: team.members ?? [],
        });
      });
    });

    return out;
  }, [data]);

  // Filter options
  const courseOptions = useMemo(() => {
    if (!data?.classes) return [];
    return data.classes.map((cls: LiteClass) => ({
      value: cls.class_id,
      label: `${cls.name ?? "Untitled course"} (${cls.term ?? "Unknown term"} ${cls.year ?? ""})`.trim(),
      section: cls.section ?? "",
    }));
  }, [data]);

  // const sectionOptions = useMemo(() => {
  //   if (!data?.classes || selectedCourseId === "ALL") return [];
  //   const cls = data.classes.find((c: any) => c.class_id === selectedCourseId);
  //   if (!cls) return [];
  //   const sec = cls.section ?? "";
  //   return [{ value: sec, label: sec }] : [];
  // }, [data, selectedCourseId]);

  const sectionOptions = useMemo(() => {
  if (!data?.classes || selectedCourseId === "ALL") return [];
  const cls = data.classes.find((c: LiteClass) => c.class_id === selectedCourseId);
  if (!cls) return [];
  const sec = cls.section ?? "";
  if (!sec) return [];
  return [{ value: sec, label: sec }];
}, [data, selectedCourseId]);


  useEffect(() => {
    if (selectedCourseId === "ALL") setSelectedSection("ALL");
  }, [selectedCourseId]);

  // Apply filters
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

  // UI states
  if (loading) {
    return (
      <div className="p-10">
        <h1 className="text-3xl font-semibold mb-4">Responses</h1>
        <p className="text-gray-600">Loading responses…</p>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="p-10">
        <h1 className="text-3xl font-semibold mb-4">Responses</h1>
        <p className="text-red-600">Unable to determine instructor email. Please login again.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10">
        <h1 className="text-3xl font-semibold mb-4">Responses</h1>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button className="px-4 py-2 border rounded-lg" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const effectiveInstructorEmail = data?.instructor?.email ?? userEmail;

  return (
    <div className="p-10">
      <Link href="/" className="button-secondary text-sm inline-flex items-center gap-2">
        <span aria-hidden="true">←</span>
        Back to Dashboard
      </Link>

      <h1 className="flex-1 text-center text-2xl md:text-3xl font-semibold text-primary">
        Responses
      </h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Filters */}
        <aside className="col-span-12 md:col-span-3">
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="font-semibold mb-4">Filters</h2>

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
            <p className="text-gray-500">{filteredGroups.length} result(s)</p>
          </div>

          <div className="space-y-4">
            {filteredGroups.map((g) => (
              <GroupCard
                key={`${g.classId}-${g.teamId}`}
                courseName={g.className}
                section={g.section}
                teamId={g.teamId}
                teamName={g.teamName}
                members={g.members}
                classId={g.classId}
                instructorEmail={effectiveInstructorEmail}
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
