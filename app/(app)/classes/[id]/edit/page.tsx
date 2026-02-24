"use client";

import * as Papa from "papaparse";
import { useSearchParams, useRouter } from "next/navigation";
import { useClassDetails, useUpdateTeams } from "@/app/lib/queries";
import { useMemo, useRef, useState } from "react";

// ---------- helpers ----------
type Row = Record<string, string>;
type Group = { groupName: string; members: string[] };
type ParsedSummary = {
  className: string | null;
  groups: Group[];
  multiClassWarning?: string;
};

function pickKey(
  obj: Record<string, unknown>,
  candidates: string[],
): string | undefined {
  const keys = Object.keys(obj);
  const lower = keys.map((k) => k.toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase());
    if (i !== -1) return keys[i];
  }
  return undefined;
}

function normalizeName(first: string, last: string) {
  return `${first} ${last}`.trim();
}

function arrToSet(a: string[]) {
  return new Set(a.map((s) => s.trim()).filter(Boolean));
}

// ---------- page ----------
export default function EditClassPage() {
  const router = useRouter();
  // const params = useParams<{ id: string }>();
  // const classId = params?.id ?? null;

  const search = useSearchParams();
  const instructorEmail = search.get("instructor_email");
  const section = search.get("section");

  const {
    data: cls,
    isLoading,
    isError,
    error,
  } = useClassDetails(instructorEmail, section);
  const updateTeamsMutation = useUpdateTeams();

  const [csvSummary, setCsvSummary] = useState<ParsedSummary>({
    className: null,
    groups: [],
  });
  const [parsing, setParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ---------- CSV upload ----------
  function onChooseFile() {
    fileRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = (result.data ?? []).filter(Boolean);
        const sample: Row = rows.find((r) => Object.keys(r).length > 0) ?? {};

        const nameKey =
          pickKey(sample, ["name", "last name, first name", "student_name"]) ??
          Object.keys(sample).find(
            (k) =>
              k.toLowerCase().includes("name") &&
              !k.toLowerCase().includes("group"),
          );

        const classKey = pickKey(sample, [
          "sections",
          "section",
          "class",
          "course",
        ]);
        const groupKey = pickKey(sample, ["group_name", "group", "team"]);

        // class value (best-effort)
        let classValue: string | null = null;
        let multiWarn: string | undefined;
        if (classKey) {
          const values = rows
            .map((r) => String(r[classKey] ?? "").trim())
            .filter(Boolean);
          const uniq = Array.from(new Set(values));
          classValue = uniq[0] ?? null;
          if (uniq.length > 1)
            multiWarn = `CSV has ${uniq.length} distinct class values. Using: ${classValue}`;
        }

        // build groups
        const groupMap = new Map<string, string[]>();
        for (const r of rows) {
          const g = groupKey ? String(r[groupKey] ?? "").trim() : "";
          const n = nameKey ? String(r[nameKey] ?? "").trim() : "";
          if (g && n) {
            const list = groupMap.get(g) ?? [];
            list.push(n);
            groupMap.set(g, list);
          }
        }
        const groups: Group[] = Array.from(groupMap.entries())
          .map(([groupName, members]) => ({ groupName, members }))
          .sort((a, b) =>
            a.groupName.localeCompare(b.groupName, undefined, {
              numeric: true,
            }),
          );

        setCsvSummary({
          className: classValue,
          groups,
          multiClassWarning: multiWarn,
        });
        setParsing(false);
        if (fileRef.current) fileRef.current.value = "";
      },
      error: () => {
        setParsing(false);
        if (fileRef.current) fileRef.current.value = "";
      },
    });
  }

  // ---------- DIFF ----------
  const diff = useMemo(() => {
    if (!cls || csvSummary.groups.length === 0) return null;

    // existing groups -> name => members(full name[])
    const existingMap = new Map<string, string[]>();
    for (const t of cls.teams) {
      const members = t.members.map((m) =>
        normalizeName(m.first_name, m.last_name),
      );
      existingMap.set(t.team_number, members);
    }

    const nextMap = new Map<string, string[]>();
    for (const g of csvSummary.groups) nextMap.set(g.groupName, g.members);

    const removed: { groupName: string; members: string[] }[] = [];
    const added: { groupName: string; members: string[] }[] = [];
    const modified: {
      groupName: string;
      before: string[];
      after: string[];
      addedMembers: string[];
      removedMembers: string[];
    }[] = [];

    // groups present before
    for (const [gName, beforeMembers] of existingMap.entries()) {
      if (!nextMap.has(gName)) {
        removed.push({ groupName: gName, members: beforeMembers });
      } else {
        const afterMembers = nextMap.get(gName)!;
        const beforeSet = arrToSet(beforeMembers);
        const afterSet = arrToSet(afterMembers);
        const addedMembers = [...afterSet].filter((n) => !beforeSet.has(n));
        const removedMembers = [...beforeSet].filter((n) => !afterSet.has(n));
        if (addedMembers.length || removedMembers.length) {
          modified.push({
            groupName: gName,
            before: beforeMembers,
            after: afterMembers,
            addedMembers,
            removedMembers,
          });
        }
      }
    }

    // groups newly added
    for (const [gName, afterMembers] of nextMap.entries()) {
      if (!existingMap.has(gName)) {
        added.push({ groupName: gName, members: afterMembers });
      }
    }

    return { removed, modified, added };
  }, [cls, csvSummary]);

  // ---------- submit ----------
  async function onSubmit() {
    if (!cls) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!csvSummary.groups.length) {
      setErrorMsg("Please upload a CSV with at least one group.");
      return;
    }

    // safer courseName extraction from "Spring_2025_Capstone Project"
    const prefix = `${cls.term}_${cls.year}_`;
    const courseName = cls.name.startsWith(prefix)
      ? cls.name.slice(prefix.length)
      : cls.name;

    const payload = {
      instructor_email: cls.instructor.email,
      instructor_first_name: cls.instructor.first_name,
      instructor_last_name: cls.instructor.last_name,
      courseName,
      term: cls.term,
      year: cls.year, // number
      class: cls.section,
      groups: csvSummary.groups.map((g) => ({
        groupName: g.groupName,
        members: g.members,
      })),
    } as const;

    try {
      const res = await updateTeamsMutation.mutateAsync(payload);
      setSuccessMsg(res.message || "Teams successfully updated");
      // Optionally refresh data or navigate back:
      // router.refresh();
      router.push(`/classes`);
    } catch (e) {
      // catch (e: any) {
      //   setErrorMsg(e?.message || "Failed to update teams.");
      // }
      // We check if 'e' is actually an Error object
      if (e instanceof Error) {
        setErrorMsg(e.message);
      } else {
        setErrorMsg("Failed to update teams.");
      }
    }
  }

  // ---------- UI ----------
  if (!instructorEmail || !section) {
    return (
      <main className="max-w-3xl mx-auto p-6 surface-card rounded-xl">
        <h1 className="text-xl font-semibold mb-2">Edit Class (Groups Only)</h1>
        <p className="text-rose-700">
          Missing required query params: <code>instructor_email</code> and{" "}
          <code>section</code>.
        </p>
        <button className="button-ghost mt-4" onClick={() => router.back()}>
          Go back
        </button>
      </main>
    );
  }

  if (isLoading)
    return (
      <div className="max-w-3xl mx-auto p-6 surface-card rounded-xl">
        Loading…
      </div>
    );
  if (isError) {
    return (
      <div className="max-w-3xl mx-auto p-6 surface-card rounded-xl text-rose-700">
        Error loading class: {error?.message}
      </div>
    );
  }
  if (!cls) return null;

  return (
    <main className="max-w-4xl mx-auto p-6 surface-card rounded-2xl">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold">Edit Class (Groups Only)</h1>
        <p className="text-sm text-black/70 mt-1">
          {cls.name} • {cls.term} {cls.year} •{" "}
          <span className="font-mono">{cls.section}</span>
        </p>
      </header>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-5 text-sm">
        <span className="px-2 py-1 rounded bg-rose-50 border border-rose-200">
          Removed group
        </span>
        <span className="px-2 py-1 rounded bg-amber-50 border border-amber-200">
          Modified members
        </span>
        <span className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200">
          New group
        </span>
      </div>

      {/* Current teams snapshot */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Current Teams</h2>
        <div className="space-y-2">
          {cls.teams.map((t) => (
            <div key={t._id} className="border border-black/10 rounded-lg p-3">
              <div className="font-medium">
                {t.team_number}{" "}
                <span className="text-xs text-black/60">
                  ({t.members.length} members)
                </span>
              </div>
              <div className="text-sm text-black/80">
                {t.members
                  .map((m) => normalizeName(m.first_name, m.last_name))
                  .join(", ")}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upload CSV */}
      <section className="mb-6">
        <button
          className="button-primary"
          onClick={onChooseFile}
          disabled={parsing}
        >
          {parsing ? "Parsing…" : "Upload CSV"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          className="hidden"
        />
        {csvSummary.multiClassWarning && (
          <div className="mt-3 rounded border border-amber-400 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
            {csvSummary.multiClassWarning}
          </div>
        )}
      </section>

      {/* CSV Preview */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">CSV Groups</h2>
        {csvSummary.groups.length ? (
          <div className="space-y-2">
            {csvSummary.groups.map((g) => (
              <div
                key={g.groupName}
                className="border border-black/10 rounded-lg p-3"
              >
                <div className="font-medium">
                  {g.groupName}{" "}
                  <span className="text-xs text-black/60">
                    ({g.members.length} members)
                  </span>
                </div>
                <div className="text-sm text-black/80">
                  {g.members.join(", ")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-black/60">— no CSV uploaded yet —</div>
        )}
      </section>

      {/* Diff */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Changes Preview</h2>

        {csvSummary.groups.length === 0 ? (
          <div className="text-sm text-black/60">
            — upload a CSV to see differences —
          </div>
        ) : !diff ||
          (!diff.removed.length &&
            !diff.modified.length &&
            !diff.added.length) ? (
          <div className="text-sm text-black/60">— no differences yet —</div>
        ) : (
          <div className="space-y-3">
            {diff.removed.map((g) => (
              <div
                key={`removed-${g.groupName}`}
                className="rounded-lg border border-rose-200 bg-rose-50 p-3"
              >
                <div className="font-semibold">Removed: {g.groupName}</div>
                <div className="text-sm">{g.members.join(", ")}</div>
              </div>
            ))}

            {diff.modified.map((g) => (
              <div
                key={`modified-${g.groupName}`}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3"
              >
                <div className="font-semibold">Modified: {g.groupName}</div>
                <div className="text-sm mt-1">
                  <span className="font-medium">Added → </span>
                  {g.addedMembers.length ? g.addedMembers.join(", ") : "—"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Removed → </span>
                  {g.removedMembers.length ? g.removedMembers.join(", ") : "—"}
                </div>
              </div>
            ))}

            {diff.added.map((g) => (
              <div
                key={`added-${g.groupName}`}
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"
              >
                <div className="font-semibold">New: {g.groupName}</div>
                <div className="text-sm">{g.members.join(", ")}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Alerts */}
      {successMsg && (
        <div className="mb-4 rounded-xl border border-emerald-600/50 bg-emerald-100/60 text-emerald-900 px-4 py-3">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 rounded-xl border border-rose-600/50 bg-rose-100/60 text-rose-900 px-4 py-3">
          {errorMsg}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          className="button-primary"
          onClick={onSubmit}
          disabled={updateTeamsMutation.isPending || !csvSummary.groups.length}
        >
          {updateTeamsMutation.isPending ? "Updating…" : "Update Teams"}
        </button>
        <button className="button-ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </main>
  );
}
