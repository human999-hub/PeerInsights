// peerinsights/components/responses/GroupCard.tsx
"use client";

import { useRouter } from "next/navigation";
import { GroupCardProps } from "@/app/(app)/responses/types";


export default function GroupCard({
  courseName,
  section,
  teamId,
  teamName,
  members,
  classId, 
}: GroupCardProps) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl shadow p-5 flex items-center justify-between gap-6">
      {/* Left content */}
      <div className="space-y-2">
        <div className="text-sm text-gray-500">
          {courseName} • {section}
        </div>

        <div className="text-lg font-semibold text-gray-900">
          {teamName}
        </div>

        <div className="text-sm text-gray-700">
          <span className="font-medium font-semibold">Members:</span>{" "}
          {members.map((m) => (
            <div key={m.user_id}>
              {m.first_name} {m.last_name}
              <span className="text-gray-400 text-xs ml-1">
                ({m.email})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
          onClick={() => router.push(`/responses/group/${teamId}?classId=${encodeURIComponent(classId)}`)}
        className="button-primary shrink-0 px-4 py-2 rounded-full text-white text-sm cursor-pointer transition"
      >
        See Assignment Responses
      </button>
    </div>
  );
}
