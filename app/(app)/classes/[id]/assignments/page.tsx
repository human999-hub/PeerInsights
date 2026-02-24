// app/classes/[id]/assignments/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  if (!d) return "";
  return d.slice(0, 10);
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // const params = useParams<{ id: string }>();
  // const classId = params?.id ?? null;

  const search = useSearchParams();
  const instructorEmail = search.get("instructor_email");
  const section = search.get("section");

  const {
    data: cls,
    isLoading: classLoading,
    isError: classError,
    error: classErr,
  } = useClassDetails(instructorEmail, section);

  const {
    data: assignments,
    isLoading: aLoading,
    isError: aError,
    error: aErr,
    refetch: refetchAssignments,
  } = useAssignments(instructorEmail, section);

  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    start: "",
    end: "",
  });
  const [createMsg, setCreateMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      setTimeout(() => setCreateMsg(null), 3000);
    } catch (e) {
      // We check if 'e' is actually an Error object
      if (e instanceof Error) {
        setErrorMsg(e.message);
      } else {
        setErrorMsg("An unexpected error occurred");
      }
      setTimeout(() => setErrorMsg(null), 5000);
    }
    //  catch (e: any) {
    //   setErrorMsg(e?.message || "Failed to create assignment");
    //   setTimeout(() => setErrorMsg(null), 5000);
    // }
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
    } catch (e) {
      // catch (e: any) {
      //   setErrorMsg(e?.message || "Failed to update assignment");
      // }
      // We check if 'e' is actually an Error object
      if (e instanceof Error) {
        setErrorMsg(e.message);
      } else {
        setErrorMsg("Failed to update assignment");
      }
    }
  }

  // ---------- UI ----------
  if (!instructorEmail || !section) {
    return (
      <main className="min-h-screen bg-[#fff7f0] font-figtree">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 px-6 py-6">
            <h1 className="text-xl font-semibold mb-2 text-primary">
              Assignments
            </h1>
            <p className="text-rose-700 text-sm">
              Missing required query params: <code>instructor_email</code> and{" "}
              <code>section</code>.
            </p>
            <button
              className="button-secondary mt-4"
              onClick={() => router.back()}
            >
              Go back
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (classLoading)
    return (
      <main className="min-h-screen bg-[#fff7f0] font-figtree">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 px-6 py-6">
            Loading…
          </div>
        </div>
      </main>
    );

  if (classError)
    return (
      <main className="min-h-screen bg-[#fff7f0] font-figtree">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 px-6 py-6 text-rose-700">
            Error loading class: {String(classErr)}
          </div>
        </div>
      </main>
    );

  if (!cls) return null;

  return (
    <main className="min-h-screen bg-[#fff7f0] font-figtree">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 px-6 py-6">
          {/* Header */}
          <header className="mb-6 text-center">
            <h1 className="text-2xl md:text-3xl font-semibold text-primary mb-2">
              Assignments
            </h1>
            <p className="text-sm text-black/70">
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

          {/* Create CTA + summary row */}
          <section className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <button
              className="button-primary self-start"
              onClick={openCreate}
              disabled={createAssignment.isPending}
            >
              Create Assignment
            </button>

            {assignments && assignments.length > 0 && (
              <p className="text-xs text-black/60">
                {assignments.length} assignment
                {assignments.length > 1 ? "s" : ""} for this class
              </p>
            )}
          </section>

          {/* Create Form */}
          {showCreate && (
            <section className="mb-6 rounded-xl border border-orange-100 bg-[#faf7f5] px-4 py-4">
              <h2 className="text-base font-semibold mb-3 text-primary">
                New Assignment
              </h2>
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
                    placeholder="e.g., Phase 1 – Peer Evaluation"
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
                  className="button-secondary"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          {/* Assignment list */}
          <section>
            <h2 className="text-lg font-semibold mb-3 text-primary">
              Assignments for this class
            </h2>
            {aLoading ? (
              <div className="text-sm text-black/60">Loading assignments…</div>
            ) : aError ? (
              <div className="text-rose-700 text-sm">
                Error loading assignments: {String(aErr)}
              </div>
            ) : !assignments || assignments.length === 0 ? (
              <div className="text-sm text-black/60">
                — no assignments yet — create one to get started.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-orange-50 bg-[#fdf9f7]/70">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left bg-[#d09fa8]/30 border-[#d09fa8]-100">
                      <th className="py-2 px-4">Assignment Name</th>
                      <th className="py-2 px-4">Start Date</th>
                      <th className="py-2 px-4">End Date</th>
                      <th className="py-2 px-4 text-right">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {assignments.map((a: Assignment) => (
                      <tr
                        key={a._id}
                        className="border-b border-orange-50 last:border-b-0"
                      >
                        <td className="py-2 px-4 align-top">
                          {editingId === a._id ? (
                            <input
                              className="input-field w-full"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  name: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <span className="font-medium">{a.name}</span>
                          )}
                        </td>
                        <td className="py-2 px-4 align-top">
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
                        <td className="py-2 px-4 align-top">
                          {editingId === a._id ? (
                            <input
                              type="date"
                              className="input-field"
                              value={editForm.end}
                              onChange={(e) =>
                                setEditForm((f) => ({
                                  ...f,
                                  end: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            iso(a.end_date)
                          )}
                        </td>
                        <td className="py-2 px-4 align-top whitespace-nowrap">
                          {editingId === a._id ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                className="button-primary"
                                onClick={() => saveEdit(a)}
                                disabled={updateAssignment.isPending}
                              >
                                {updateAssignment.isPending
                                  ? "Updating…"
                                  : "Update"}
                              </button>
                              <button
                                className="button-secondary"
                                onClick={cancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <button
                                className="text-sm text-primary underline hover:no-underline"
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
        </div>
      </div>
    </main>
  );
}
