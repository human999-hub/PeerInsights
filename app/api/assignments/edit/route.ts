// app/api/assignments/edit/route.ts
// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/mongodb";
// import Class from "@/models/Class";
// import Assignment from "@/models/Assignment";
// import User from "@/models/User";

// type EditAssignmentBody = {
//   instructor_email: string;
//   section: string;
//   assignment_name: string;
//   assignment_start_date: string; // ISO or parseable date string
//   assignment_end_date: string; // ISO or parseable date string
// };

// function isValidDate(d: Date) {
//   return !Number.isNaN(d.getTime());
// }

// function isNonEmptyString(v: unknown): v is string {
//   return typeof v === "string" && v.trim().length > 0;
// }

// export async function POST(req: Request) {
//   try {
//     await connectDB();

//     const body: unknown = await req.json();
//     const b = body as Partial<EditAssignmentBody>;

//     const instructor_email = b.instructor_email;
//     const section = b.section;
//     const assignment_name = b.assignment_name;
//     const assignment_start_date = b.assignment_start_date;
//     const assignment_end_date = b.assignment_end_date;

//     if (
//       !isNonEmptyString(instructor_email) ||
//       !isNonEmptyString(section) ||
//       !isNonEmptyString(assignment_name) ||
//       !isNonEmptyString(assignment_start_date) ||
//       !isNonEmptyString(assignment_end_date)
//     ) {
//       return NextResponse.json(
//         { ok: false, error: "Missing required fields" },
//         { status: 400 },
//       );
//     }

//     const startDate = new Date(assignment_start_date);
//     const endDate = new Date(assignment_end_date);

//     if (!isValidDate(startDate) || !isValidDate(endDate)) {
//       return NextResponse.json(
//         {
//           ok: false,
//           error: "Invalid assignment_start_date or assignment_end_date",
//         },
//         { status: 400 },
//       );
//     }

//     if (endDate < startDate) {
//       return NextResponse.json(
//         {
//           ok: false,
//           error: "assignment_end_date must be after assignment_start_date",
//         },
//         { status: 400 },
//       );
//     }

//     const instructor = await User.findOne({
//       email: instructor_email,
//       role: { $in: ["instructor", "ta"] },
//     }).lean<{ _id: unknown; email: string }>();

//     if (!instructor) {
//       return NextResponse.json(
//         { ok: false, error: "Instructor not found" },
//         { status: 404 },
//       );
//     }

//     const klass = await Class.findOne({
//       instructor_id: instructor._id,
//       section,
//     }).lean<{ _id: unknown; section: string }>();

//     if (!klass) {
//       return NextResponse.json(
//         { ok: false, error: "Class not found for this instructor" },
//         { status: 404 },
//       );
//     }

//     const assignment = await Assignment.findOne({
//       class_id: klass._id,
//       title: assignment_name,
//     });

//     if (!assignment) {
//       return NextResponse.json(
//         { ok: false, error: "Assignment not found" },
//         { status: 404 },
//       );
//     }

//     // ✅ NEW RULE:
//     // If assignment is already expired, allow editing ONLY if you are extending the due date to the future.
//     const now = new Date();
//     const wasExpired = assignment.due_date < now;
//     const newDueIsInPast = endDate < now;

//     if (wasExpired && newDueIsInPast) {
//       return NextResponse.json(
//         {
//           ok: false,
//           error:
//             "Assignment deadline has passed. You can only edit if you extend the due date to a future time.",
//         },
//         { status: 403 },
//       );
//     }

//     assignment.start_date = startDate;
//     assignment.due_date = endDate;
//     await assignment.save();

//     return NextResponse.json({
//       ok: true,
//       message: "Assignment updated successfully",
//       assignment: {
//         _id: String(assignment._id),
//         title: assignment.title,
//         class_id: String(klass._id),
//         section: klass.section,
//         start_date: assignment.start_date,
//         due_date: assignment.due_date,
//         instructor_email: instructor.email,
//       },
//     });
//   } catch (e: unknown) {
//     console.error("Error editing assignment:", e);
//     const message = e instanceof Error ? e.message : "Internal server error";
//     return NextResponse.json({ ok: false, error: message }, { status: 500 });
//   }
// }

// app/api/assignments/edit/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import Assignment from "@/models/Assignment";
import User from "@/models/User";
import mongoose from "mongoose";

// Ensure model registered (needed for Submission.exists)
import "@/models/Submission";

type EditAssignmentBody = {
  instructor_email: string;
  section: string;

  // IMPORTANT: since frontend doesn't store IDs, we locate by title (normalized)
  assignment_name: string;

  // Proposed new dates
  assignment_start_date: string; // ISO
  assignment_end_date: string; // ISO
};

function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeTitle(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}

function cleanTitle(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

type AssignmentLeanForMatch = {
  _id: unknown;
  title: string;
  start_date: Date;
  due_date: Date;
};

export async function POST(req: Request) {
  try {
    await connectDB();

    const body: unknown = await req.json();
    const b = body as Partial<EditAssignmentBody>;

    const instructor_email = b.instructor_email;
    const section = b.section;
    const assignment_name = b.assignment_name;
    const assignment_start_date = b.assignment_start_date;
    const assignment_end_date = b.assignment_end_date;

    if (
      !isNonEmptyString(instructor_email) ||
      !isNonEmptyString(section) ||
      !isNonEmptyString(assignment_name) ||
      !isNonEmptyString(assignment_start_date) ||
      !isNonEmptyString(assignment_end_date)
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const proposedStart = new Date(assignment_start_date);
    const proposedEnd = new Date(assignment_end_date);

    if (!isValidDate(proposedStart) || !isValidDate(proposedEnd)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid assignment_start_date or assignment_end_date",
        },
        { status: 400 },
      );
    }

    if (proposedEnd <= proposedStart) {
      return NextResponse.json(
        { ok: false, error: "End date must be > start date" },
        { status: 400 },
      );
    }

    // 1) Find instructor/TA
    const instructor = await User.findOne({
      email: instructor_email,
      role: { $in: ["instructor", "ta"] },
    })
      .select({ _id: 1, email: 1 })
      .lean<{ _id: unknown; email: string } | null>();

    if (!instructor) {
      return NextResponse.json(
        { ok: false, error: "Instructor not found" },
        { status: 404 },
      );
    }

    // 2) Find class
    const klass = await Class.findOne({
      instructor_id: instructor._id,
      section,
    })
      .select({ _id: 1, section: 1 })
      .lean<{ _id: unknown; section: string } | null>();

    if (!klass) {
      return NextResponse.json(
        { ok: false, error: "Class not found for this instructor" },
        { status: 404 },
      );
    }

    // 3) Find assignment by normalized title match (since schema can’t be changed)
    const norm = normalizeTitle(assignment_name);

    const candidates = await Assignment.find({ class_id: klass._id })
      .select({ title: 1, start_date: 1, due_date: 1 })
      .lean<AssignmentLeanForMatch[]>();

    const match = candidates.find((a) => normalizeTitle(a.title) === norm);

    if (!match) {
      return NextResponse.json(
        { ok: false, error: "Assignment not found" },
        { status: 404 },
      );
    }

    const assignment = await Assignment.findById(match._id);
    if (!assignment) {
      return NextResponse.json(
        { ok: false, error: "Assignment not found" },
        { status: 404 },
      );
    }

    // -----------------------------
    // EDIT POLICY (middle ground)
    // -----------------------------
    const now = new Date();
    const hasStarted = assignment.start_date <= now;

    // extra safety: if submissions exist, treat it as "started/locked"
    const SubmissionModel = mongoose.model("Submission");
    const hasSubmissions = await SubmissionModel.exists({
      assignment_id: assignment._id,
    });

    // 1) Start date rules
    // - If started OR submissions exist => cannot change start_date
    // - If not started and no submissions => can change start_date (but must still be >= now)
    if (hasStarted || hasSubmissions) {
      // lock start_date: ignore proposedStart, keep existing
      if (proposedStart.getTime() !== assignment.start_date.getTime()) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Start date cannot be changed after the assignment has started (or submissions exist).",
          },
          { status: 403 },
        );
      }
    } else {
      // allowed to change start date, but must be >= now
      if (proposedStart < now) {
        return NextResponse.json(
          { ok: false, error: "Start date must be >= current time." },
          { status: 400 },
        );
      }
    }

    // 2) Due date rules
    // - If started => do not allow shortening, only extension
    // - If expired => allow editing only if extending into future (reopen)
    const wasExpired = assignment.due_date < now;

    if (hasStarted) {
      // cannot shorten once started
      if (proposedEnd < assignment.due_date) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Due date cannot be shortened after the assignment has started. Only extension is allowed.",
          },
          { status: 403 },
        );
      }
    }

    if (wasExpired && proposedEnd < now) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Assignment deadline has passed. You can only edit if you extend the due date to a future time.",
        },
        { status: 403 },
      );
    }

    // Always ensure due > (effective) start
    const effectiveStart = assignment.start_date;
    const nextStart =
      hasStarted || hasSubmissions ? effectiveStart : proposedStart;
    if (proposedEnd <= nextStart) {
      return NextResponse.json(
        { ok: false, error: "End date must be > start date" },
        { status: 400 },
      );
    }

    // 3) Prevent overlap with other assignments in same class (recommended)
    // If they extend due date, it might collide with future scheduled assignment.
    const overlap = await Assignment.exists({
      _id: { $ne: assignment._id },
      class_id: klass._id,
      start_date: { $lte: proposedEnd },
      due_date: { $gte: nextStart },
    });
    if (overlap) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This update would overlap with another assignment window in this class.",
        },
        { status: 409 },
      );
    }

    // 4) Apply changes
    assignment.start_date = nextStart; // either unchanged or proposed
    assignment.due_date = proposedEnd;

    // Rule: assignment name locked — we DO NOT modify title
    // (Optional: also clean title at save time if you want, but that would be "editing name" technically)
    // assignment.title = assignment.title;

    await assignment.save();

    return NextResponse.json({
      ok: true,
      message: "Assignment updated successfully",
      assignment: {
        _id: String(assignment._id),
        title: assignment.title,
        class_id: String(klass._id),
        section: klass.section,
        start_date: assignment.start_date,
        due_date: assignment.due_date,
        instructor_email: instructor.email,
      },
    });
  } catch (e: unknown) {
    console.error("Error editing assignment:", e);
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
