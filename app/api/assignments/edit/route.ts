// app/api/assignments/edit/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import Assignment from "@/models/Assignment";
import User from "@/models/User";

type EditAssignmentBody = {
  instructor_email: string;
  section: string;
  assignment_name: string;
  assignment_start_date: string;
  assignment_end_date: string;
};

function isValidDate(d: Date) {
  return !Number.isNaN(d.getTime());
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

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

    const startDate = new Date(assignment_start_date);
    const endDate = new Date(assignment_end_date);

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid assignment_start_date or assignment_end_date",
        },
        { status: 400 },
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        {
          ok: false,
          error: "assignment_end_date must be after assignment_start_date",
        },
        { status: 400 },
      );
    }

    // 2️⃣ Find instructor/TA
    const instructor = await User.findOne({
      email: instructor_email,
      role: { $in: ["instructor", "ta"] },
    }).lean<{ _id: unknown; email: string }>();

    if (!instructor) {
      return NextResponse.json(
        { ok: false, error: "Instructor not found" },
        { status: 404 },
      );
    }

    // 3️⃣ Find class
    const klass = await Class.findOne({
      instructor_id: instructor._id,
      section,
    }).lean<{ _id: unknown; section: string }>();

    if (!klass) {
      return NextResponse.json(
        { ok: false, error: "Class not found for this instructor" },
        { status: 404 },
      );
    }

    // 4️⃣ Find assignment
    const assignment = await Assignment.findOne({
      class_id: klass._id,
      title: assignment_name,
    });

    if (!assignment) {
      return NextResponse.json(
        { ok: false, error: "Assignment not found" },
        { status: 404 },
      );
    }

    // 5️⃣ Prevent editing if due date already passed
    const now = new Date();
    if (assignment.due_date < now) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Assignment deadline has passed. Editing is no longer allowed.",
        },
        { status: 403 },
      );
    }

    // 6️⃣ Update dates
    assignment.start_date = startDate;
    assignment.due_date = endDate;
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
