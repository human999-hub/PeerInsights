// components/classes/ClassesList.tsx
"use client";
import Link from "next/link";
import React from "react";
import { useClassesByInstructor } from "@/app/lib/queries";
import ClassDetailsModal from "./ClassDetailsModal";
import type { CreatedClass } from "@/app/lib/zodSchemas";

export default function ClassesList({
  instructorEmail,
}: {
  instructorEmail: string;
}) {
  const { data, isLoading, isError, error } =
    useClassesByInstructor(instructorEmail);
  const [selected, setSelected] = React.useState<CreatedClass | null>(null);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 surface-card rounded-xl">
        Loading classes…
      </div>
    );
  }
  if (isError) {
    return (
      <div className="max-w-5xl mx-auto p-6 surface-card rounded-xl">
        <p className="text-red-700 font-medium">
          Couldn’t load classes: {error?.message}
        </p>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6 surface-card rounded-xl">
        <p>No classes available. Please create a class.</p>
      </div>
    );
  }

  return (
    <>
     <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
               <tr className="bg-[#d09fa8]/30">
                <th className="px-5 py-3 text-left font-semibold">Class</th>
                <th className="px-5 py-3 text-left font-semibold">Term</th>
                <th className="px-5 py-3 text-left font-semibold">Year</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((cls) => (
                <tr
                  key={cls._id}
                  className="border-t border-black/10 hover:bg-white/40"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium">{cls.name}</div>
                    <div className="text-xs text-black/60">{cls.section}</div>
                  </td>
                  <td className="px-5 py-3">{cls.term}</td>
                  <td className="px-5 py-3">{cls.year}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3 justify-end">
                      <button
                        type="button"
                        onClick={() => setSelected(cls)}
                        className="underline hover:no-underline"
                      >
                        View
                      </button>
                      <Link
                        className="underline hover:no-underline"
                        href={`/classes/${
                          cls._id
                        }/edit?instructor_email=${encodeURIComponent(
                          cls.instructor.email
                        )}&section=${encodeURIComponent(cls.section)}`}
                      >
                        Edit
                      </Link>

                      <Link
                        className="underline hover:no-underline"
                        href={`/classes/${
                          cls._id
                        }/assignments?instructor_email=${encodeURIComponent(
                          cls.instructor.email
                        )}&section=${encodeURIComponent(cls.section)}`}
                      >
                        Assignments
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ClassDetailsModal
          cls={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
