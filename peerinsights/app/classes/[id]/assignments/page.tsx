// app/classes/[id]/assignments/page.tsx
"use client";

import { useEffect, useState} from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  useClassDetails,
  useAssignments,
  useCreateAssignment,
  useUpdateAssignment,
} from "@/app/lib/queries";
import { isLoggedIn } from "@/app/lib/authClient";
import Spinner from "@/components/Spinner";

// ---------- types ----------
type Assignment = {
  _id: string;
  name: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
};

// util
function iso(d: string) {
  // keep just YYYY-MM-DD for input[type=date]
  if (!d) return "";
  return d.slice(0, 10);
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // route params (if you later mount this at /classes/[id]/assignments)
  const params = useParams<{ id: string }>();
  const classId = params?.id ?? null;

  // query params (we'll follow your existing pattern)
  const search = useSearchParams();
  const instructorEmail = search.get("instructor_email");
  const section = search.get("section");

  // fetch class
  const {
    data: cls,
    isLoading: classLoading,
    isError: classError,
    error: classErr,
  } = useClassDetails(instructorEmail, section);

  // fetch assignments
  const {
    data: assignments,
    isLoading: aLoading,
    isError: aError,
    error: aErr,
    refetch: refetchAssignments,
  } = useAssignments(instructorEmail, section);

  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();

  // UI state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    start: "",
    end: "",
  });
  const [createMsg, setCreateMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inline edit state per row
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    start: "",
    end: "",
  });

  useEffect(() => {
    const authenticated = isLoggedIn();

    if (!authenticated) {
      router.replace("/login");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  // ---------- handlers ----------
  function openCreate() {
    setErrorMsg(null);
    setCreateMsg(null);
    setShowCreate(true);
    setCreateForm({ name: "", start: "", end: "" });
  }

  function validateDates(start: string, end: string) {
    if (!start || !end) return "Start and End dates are required";
    if (new Date(start) > new Date(end))
      return "End date must be after start date";
    return null;
  }

  async function onCreateSubmit() {
    if (!cls || !instructorEmail || !section) return;
    setErrorMsg(null);
    setCreateMsg(null);

    const required = [] as string[];
    if (!createForm.name.trim()) required.push("Assignment name");
    if (!createForm.start) required.push("Start date");
    if (!createForm.end) required.push("End date");
    if (required.length) {
      setErrorMsg(`Please fill: ${required.join(", ")}.`);
      return;
    }
    const dErr = validateDates(createForm.start, createForm.end);
    if (dErr) {
      setErrorMsg(dErr);
      return;
    }

    try {
      await createAssignment.mutateAsync({
        instructor_email: instructorEmail,
        section: section!,
        assignment_name: createForm.name.trim(),
        assignment_start_date: createForm.start,
        assignment_end_date: createForm.end,
      });
      setCreateMsg("Assignment created successfully");
      setCreateForm({ name: "", start: "", end: "" });
      setShowCreate(false);
      await refetchAssignments();
      // show for 3 seconds, then refresh
      setTimeout(() => setCreateMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to create assignment");
      // Auto-hide error after 5s (optional)
      setTimeout(() => setErrorMsg(null), 5000);
    }
  }

  function startEdit(a: Assignment) {
    setEditingId(a._id);
    setEditForm({
      name: a.name,
      start: iso(a.start_date),
      end: iso(a.end_date),
    });
    setErrorMsg(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: "", start: "", end: "" });
  }

  async function saveEdit(a: Assignment) {
    if (!instructorEmail || !section) return;

    const required = [] as string[];
    if (!editForm.name.trim()) required.push("Assignment name");
    if (!editForm.start) required.push("Start date");
    if (!editForm.end) required.push("End date");
    if (required.length) {
      setErrorMsg(`Please fill: ${required.join(", ")}.`);
      return;
    }
    const dErr = validateDates(editForm.start, editForm.end);
    if (dErr) {
      setErrorMsg(dErr);
      return;
    }

    try {
      await updateAssignment.mutateAsync({
        instructor_email: instructorEmail,
        section,
        assignment_id: a._id,
        assignment_name: editForm.name.trim(),
        assignment_start_date: editForm.start,
        assignment_end_date: editForm.end,
      });
      setEditingId(null);
      await refetchAssignments();
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to update assignment");
    }
  }

  // ---------- UI ----------
  if (!instructorEmail || !section) {
    return (
      <main className="max-w-3xl mx-auto p-6 surface-card rounded-xl">
        <h1 className="text-xl font-semibold mb-2">Assignments</h1>
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

  if (classLoading)
    return (
      <div className="max-w-3xl mx-auto p-6 surface-card rounded-xl">
        Loading…
      </div>
    );
  if (classError)
    return (
      <div className="max-w-3xl mx-auto p-6 surface-card rounded-xl text-rose-700">
        Error loading class: {String(classErr)}
      </div>
    );
  if (!cls) return null;

  return (
    <main className="max-w-4xl mx-auto p-6 surface-card rounded-2xl">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold mb-6 text-primary text-center">
          Assignments
        </h1>
        <p className="text-sm text-black/70 mt-1 text-center">
          {cls.name} • {cls.term} {cls.year} •{" "}
          <span className="font-mono">{cls.section}</span>
        </p>
      </header>
      {/* Global alerts */}
      {createMsg && (
        <div className="mb-4 rounded-xl border border-emerald-600/50 bg-emerald-100/60 text-emerald-900 px-4 py-3">
          {createMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 rounded-xl border border-rose-600/50 bg-rose-100/60 text-rose-900 px-4 py-3">
          {errorMsg}
        </div>
      )}

      {/* Create CTA */}
      <section className="mb-6">
        <button
          className="button-primary"
          onClick={openCreate}
          disabled={createAssignment.isPending}
        >
          Create Assignment
        </button>
      </section>

      {/* Create Form */}
      {showCreate && (
        <section className="mb-6 border border-black/10 rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-3">New Assignment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">
                Assignment name<span className="text-rose-700"> *</span>
              </label>
              <input
                className="input-field"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g., Milestone 1"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">
                Start date<span className="text-rose-700"> *</span>
              </label>
              <input
                type="date"
                className="input-field"
                value={createForm.start}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, start: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm mb-1">
                End date<span className="text-rose-700"> *</span>
              </label>
              <input
                type="date"
                className="input-field"
                value={createForm.end}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, end: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              className="button-primary"
              onClick={onCreateSubmit}
              disabled={createAssignment.isPending}
            >
              {createAssignment.isPending ? "Creating…" : "Submit"}
            </button>
            <button
              className="button-ghost"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* Assignment list */}
      <section>
        <h2 className="text-lg font-semibold mb-2">
          Assignments for this class
        </h2>
        {aLoading ? (
          <div className="text-sm text-black/60">Loading assignments…</div>
        ) : aError ? (
          <div className="text-rose-700">
            Error loading assignments: {String(aErr)}
          </div>
        ) : !assignments || assignments.length === 0 ? (
          <div className="text-sm text-black/60">— no assignments yet —</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-black/10">
                  <th className="py-2 pr-3">Assignment Name</th>
                  <th className="py-2 pr-3">Start Date</th>
                  <th className="py-2 pr-3">End Date</th>
                  <th className="py-2 pr-3">Edit</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a: Assignment) => (
                  <tr key={a._id} className="border-b border-black/5">
                    <td className="py-2 pr-3 align-top">
                      {editingId === a._id ? (
                        <input
                          className="input-field w-full"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, name: e.target.value }))
                          }
                        />
                      ) : (
                        <span className="font-medium">{a.name}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 align-top">
                      {editingId === a._id ? (
                        <input
                          type="date"
                          className="input-field"
                          value={editForm.start}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              start: e.target.value,
                            }))
                          }
                        />
                      ) : (
                        iso(a.start_date)
                      )}
                    </td>
                    <td className="py-2 pr-3 align-top">
                      {editingId === a._id ? (
                        <input
                          type="date"
                          className="input-field"
                          value={editForm.end}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, end: e.target.value }))
                          }
                        />
                      ) : (
                        iso(a.end_date)
                      )}
                    </td>
                    <td className="py-2 pr-3 align-top whitespace-nowrap">
                      {editingId === a._id ? (
                        <div className="flex gap-2">
                          <button
                            className="button-primary cursor-pointer"
                            onClick={() => saveEdit(a)}
                            disabled={updateAssignment.isPending}
                          >
                            {updateAssignment.isPending
                              ? "Updating…"
                              : "Update"}
                          </button>
                          <button className="button-secondary" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            className="button underline hover:no-underline cursor-pointer p-0"
                            onClick={() => startEdit(a)}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer actions */}
      <div className="flex items-center gap-3 mt-6">
        <button className="button-secondary" onClick={() => router.back()}>
          Back
        </button>
      </div>
    </main>
  );
}
