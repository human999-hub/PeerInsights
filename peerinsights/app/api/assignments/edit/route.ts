// peerinsights/app/api/assignments/edit/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import Assignment from "@/models/Assignment";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      instructor_email,
      section,
      assignment_name,
      assignment_start_date,
      assignment_end_date,
    } = body;

    // 1️⃣ Validate input
    if (
      !instructor_email ||
      !section ||
      !assignment_name ||
      !assignment_start_date ||
      !assignment_end_date
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 2️⃣ Find instructor
    const instructor = await User.findOne({
      email: instructor_email,
      role: "instructor",
    });
    if (!instructor)
      return NextResponse.json(
        { ok: false, error: "Instructor not found" },
        { status: 404 }
      );

    // 3️⃣ Find class
    const klass = await Class.findOne({
      instructor_id: instructor._id,
      section,
    });
    if (!klass)
      return NextResponse.json(
        { ok: false, error: "Class not found for this instructor" },
        { status: 404 }
      );

    // 4️⃣ Find assignment
    const assignment = await Assignment.findOne({
      class_id: klass._id,
      title: assignment_name,
    });
    if (!assignment)
      return NextResponse.json(
        { ok: false, error: "Assignment not found" },
        { status: 404 }
      );

    // 5️⃣ Prevent editing if due date already passed
    const now = new Date();
    if (assignment.due_date < now) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Assignment deadline has passed. Editing is no longer allowed.",
        },
        { status: 403 }
      );
    }

    // 6️⃣ Update start and end date
    assignment.start_date = new Date(assignment_start_date);
    assignment.due_date = new Date(assignment_end_date);
    await assignment.save();

    // 7️⃣ Return updated info
    return NextResponse.json({
      ok: true,
      message: "Assignment updated successfully",
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        class_id: klass._id,
        section: klass.section,
        start_date: assignment.start_date,
        due_date: assignment.due_date,
        instructor_email: instructor.email,
      },
    });
  } catch (e: any) {
    console.error("Error editing assignment:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
