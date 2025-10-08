// components/classes/CreateClass.tsx
"use client";

import * as React from "react";
import * as Papa from "papaparse";
import { useCreateClass } from "@/app/lib/queries";
import { CreateClassRequest } from "@/app/lib/zodSchemas";

type Row = Record<string, string>;

type Group = { groupName: string; members: string[] };
type ParsedSummary = {
  className: string | null;
  groups: Group[];
  multiClassWarning?: string;
};

function pickKey(
  obj: Record<string, unknown>,
  candidates: string[]
): string | undefined {
  const keys = Object.keys(obj);
  const lower = keys.map((k) => k.toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase());
    if (i !== -1) return keys[i];
  }
  return undefined;
}

export default function CreateClass() {
  const [courseName, setCourseName] = React.useState("");
  const [term, setTerm] = React.useState("");
  const [year, setYear] = React.useState("");
  const [csvSummary, setCsvSummary] = React.useState<ParsedSummary>({
    className: null,
    groups: [],
  });
  const [parsing, setParsing] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const instructor_email = "instructor@example.com"; // Placeholder email
  const instructor_first_name = "Instructor"; // Placeholder first name
  const instructor_last_name = "Example"; // Placeholder last name
  const fileRef = React.useRef<HTMLInputElement>(null);
  // const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const createClassMutation =  useCreateClass();

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
      complete: (result: Papa.ParseResult<Row>) => {
        const rows = (result.data ?? []).filter(Boolean);

        const sample: Row = rows.find((r) => Object.keys(r).length > 0) ?? {};

        const nameKey =
          pickKey(sample, ["name", "last name, first name", "student_name"]) ??
          Object.keys(sample).find(
            (k) =>
              k.toLowerCase().includes("name") &&
              !k.toLowerCase().includes("group")
          );

        const classKey = pickKey(sample, [
          "sections",
          "section",
          "class",
          "course",
        ]);
        const groupKey = pickKey(sample, ["group_name", "group", "team"]);

        // ---- Class: enforce single value ----
        let classValue: string | null = null;
        let multiWarn: string | undefined;

        if (classKey) {
          const values = rows
            .map((r) => String(r[classKey] ?? "").trim())
            .filter(Boolean);
          const uniq = Array.from(new Set(values));
          classValue = uniq[0] ?? null;
          if (uniq.length > 1) {
            multiWarn = `CSV has ${uniq.length} distinct class values. Using: ${classValue}`;
          }
        }

        // ---- Groups: group_name -> members[] ----
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
            a.groupName.localeCompare(b.groupName, undefined, { numeric: true })
          );

        setCsvSummary({
          className: classValue,
          groups,
          multiClassWarning: multiWarn,
        });
        setParsing(false);

        // reset file input so same file can be reselected later
        if (fileRef.current) fileRef.current.value = "";
      },
      error: () => {
        setParsing(false);
        if (fileRef.current) fileRef.current.value = "";
      },
    });
  }
 function resetForm() {
    setCourseName("");
    setTerm("");
    setYear("");
    setCsvSummary({ className: null, groups: [] });
    if (fileRef.current) fileRef.current.value = "";
  }
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
      setErrorMsg(null);
    setSuccessMsg(null);
   if (!csvSummary.className || csvSummary.groups.length === 0) {
      setErrorMsg("Please upload a CSV with a class value and at least one group.");
      return;
    }
    const payload: CreateClassRequest = {
      instructor_email: instructor_email.trim(),
      instructor_first_name: instructor_first_name.trim(),
      instructor_last_name: instructor_last_name.trim(),
      courseName: courseName.trim(),
      term: term.trim(),
      year: Number(year),
      class: csvSummary.className, // single class from CSV
      groups: csvSummary.groups.map(g => ({groupName: g.groupName, members: g.members})), // [{ groupName, members: [...] }]
    };
    // // console.log("Submit payload:", payload);
    // // alert("Submitted! (See console for payload)");
    //  console.log("Submit payload:", payload);

    // // Show success + clear the form
    // setSuccessMsg("Class submitted successfully.");
    // resetForm();

    // // Auto-hide after 3s (optional)
    // window.setTimeout(() => setSuccessMsg(null), 3000);
    //  try {
    //   const res = await createClassMutation.mutateAsync(payload);
    //   setSuccessMsg(`Class created: ${res.class.name} (${res.class.section})`);
    //   resetForm();
    //   window.setTimeout(() => setSuccessMsg(null), 4000);
    // } catch (err: any) {
    //   setErrorMsg(err?.message || "Failed to create class.");
    // }
   createClassMutation
    .mutateAsync(payload)
    .then((res) => {
      setSuccessMsg(`Class created: ${res.class.name} (${res.class.section})`);
      resetForm();
      window.setTimeout(() => setSuccessMsg(null), 4000);
    })
    .catch((err: any) => setErrorMsg(err?.message || "Failed to create class."));
  }

  return (
    <div className="max-w-3xl mx-auto p-6 surface-card">
      <h2 className="text-2xl font-semibold mb-4">Create a New Class</h2>
  {/* Success banner */}
      {/* {successMsg && (
        <div
          className="mb-4 rounded-xl border border-secondary/70 bg-secondary/30 text-primary px-4 py-3"
          role="status"
          aria-live="polite"
        >
          {successMsg}
        </div>
      )} */}
        {successMsg && <div className="mb-4 rounded-xl border border-emerald-600/50 bg-emerald-100/60 text-emerald-900 px-4 py-3">{successMsg}</div>}
      {errorMsg && <div className="mb-4 rounded-xl border border-rose-600/50 bg-rose-100/60 text-rose-900 px-4 py-3">{errorMsg}</div>}

      {/* ===== Upload CSV ===== */}
      <div className="mb-6">
        <button
          className="button-primary"
          onClick={onChooseFile}
          disabled={parsing}
        >
          {parsing ? "Parsing..." : "Upload CSV"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onFile}
          className="hidden"
        />
      </div>

      {/* ===== Manual inputs ===== */}
      <form className="space-y-4" onSubmit={onSubmit}>
        <p className="font-medium">Please enter class details:</p>

        <p className="text-sm text-muted-foreground">All fields required.</p>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="courseName"
          >
            Course Name
          </label>
          <input
            id="courseName"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Capstone_Project"
            required
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="term">
              Term
            </label>
            <input
              id="term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Fall"
              required
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="year">
              Year
            </label>
            <input
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2025"
              required
              className="input-field"
            />
          </div>
        </div>

        {/* ===== CSV-derived (single class) ===== */}
        {/* <div className="mt-6 info-panel">
          <div className="mb-4">
            <p className="font-medium mb-2">Details from uploaded CSV:</p>
            <span className="font-semibold">Class:</span>{" "}
            {csvSummary.className ? (
              csvSummary.className
            ) : (
              <em className="text-muted-foreground">— upload CSV —</em>
            )}
            {csvSummary.multiClassWarning && (
              <div className="mt-2 text-sm text-amber-600">{csvSummary.multiClassWarning}</div>
            )}
          </div>

          <div>
            <div className="font-semibold mb-2">Groups:</div>
            {csvSummary.groups.length ? (
              <div className="space-y-2">
                {csvSummary.groups.map((g) => (
                  <div key={g.groupName} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <div className="md:col-span-3 font-medium">{g.groupName}</div>
                    <div className="md:col-span-9">{g.members.join(", ")}</div>
                  </div>
                ))}
              </div>
            ) : (
              <em className="text-muted-foreground">— no groups yet —</em>
            )}
          </div>
        </div> */}
        <div className="mt-6 info-panel">
          <p className="font-medium mb-2">Details from uploaded CSV:</p>

          <div className="mb-3">
            <span className="font-semibold">Class:</span>{" "}
            {csvSummary.className ?? (
              <em className="text-subtle-maroon/80">— upload CSV —</em>
            )}
          </div>

          <div className="dotted-divider my-3"></div>

          <div>
            <div className="font-semibold mb-2">Groups:</div>
            {csvSummary.groups.length ? (
              <div className="space-y-2">
                {csvSummary.groups.map((g) => (
                  <div
                    key={g.groupName}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2"
                  >
                    <div className="md:col-span-3">
                      <span className="group-chip">{g.groupName}</span>
                    </div>
                    <div className="md:col-span-9">{g.members.join(", ")}</div>
                  </div>
                ))}
              </div>
            ) : (
              <em className="text-subtle-maroon/80">— no groups yet —</em>
            )}
          </div>
        </div>

        {/* ===== Submit ===== */}
        <div className="pt-4">
          <button className="button-primary" type="submit" disabled={createClassMutation.isPending}>
            {createClassMutation.isPending ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
