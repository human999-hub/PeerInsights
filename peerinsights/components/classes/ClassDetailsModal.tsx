// components/classes/ClassDetailsModal.tsx
"use client";
import React from "react";
import Link from "next/link";
import Modal from "@/components/ui/modal";
import { CreatedClass, CreatedTeam } from "@/app/lib/zodSchemas";

export default function ClassDetailsModal({
  cls,
  open,
  onClose,
}: {
  cls: CreatedClass;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${cls.name} • ${cls.term} ${cls.year}`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/classes/${
                          cls._id
                        }/assignments?instructor_email=${encodeURIComponent(
                          cls.instructor.email
                        )}&section=${encodeURIComponent(cls.section)}`}
            className="button-ghost"
          >
            Go to Assignments
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/classes/${
                cls._id
              }/edit?instructor_email=${encodeURIComponent(
                cls.instructor.email
              )}&section=${encodeURIComponent(cls.section)}`}
              className="button-primary"
            >
              Edit Groups (CSV)
            </Link>

            <button onClick={onClose} className="button-ghost">
              Close
            </button>
          </div>
        </div>
      }
    >
      {/* Class meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Info label="Section" value={cls.section} />
        <Info
          label="Instructor"
          value={`${cls.instructor.first_name} ${cls.instructor.last_name} (${cls.instructor.email})`}
        />
        <Info label="Teams" value={String(cls.teams.length)} />
      </div>

      {/* Teams */}
      <h3 className="text-lg font-semibold mb-2">Teams</h3>
      <div className="space-y-3">
        {cls.teams.map((t) => (
          <TeamPanel key={t._id} team={t} />
        ))}
      </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-black/10 p-3">
      <div className="text-xs uppercase tracking-wide text-black/60">
        {label}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function TeamPanel({ team }: { team: CreatedTeam }) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  return (
    <div className="border border-black/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-rose-50/60 hover:bg-rose-50 text-left transition-colors"
        aria-expanded={open}
        aria-controls={`${id}-content`}
      >
        <span className="font-medium">{team.team_number}</span>

        <span className="flex items-center gap-3 text-sm text-black/60">
          {team.members.length} members
          {/* Chevron that flips up/down */}
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={`h-5 w-5 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          >
            {/* chevron-down path */}
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.25 8.27a.75.75 0 0 1-.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      <div id={`${id}-content`} className={open ? "px-4 py-3" : "hidden"}>
        <ul className="divide-y divide-black/10">
          {team.members.map((m) => (
            <li
              key={m.user_id}
              className="py-2 flex items-center justify-between"
            >
              <span className="font-medium">
                {m.first_name} {m.last_name}
              </span>
              <span className="text-sm text-black/60">{m.email}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
