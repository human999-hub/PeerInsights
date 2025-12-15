// peerinsights/app/api/assignments/by-class/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Class from "@/models/Class";
import Assignment from "@/models/Assignment";

export async function GET(req: Request) {
  try {
    await connectDB();

    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const instructor_email = searchParams.get("instructor_email");
    const section = searchParams.get("section");

    if (!instructor_email || !section) {
      return NextResponse.json(
        { ok: false, error: "Missing instructor_email or section" },
        { status: 400 }
      );
    }

    // 1️⃣ Find instructor
    const instructor = await User.findOne({
      email: instructor_email,
      role: "instructor",
    });
    if (!instructor) {
      return NextResponse.json(
        { ok: false, error: "Instructor not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Find class by section + instructor
    const klass = await Class.findOne({
      instructor_id: instructor._id,
      section,
    });
    if (!klass) {
      return NextResponse.json(
        { ok: false, error: "Class not found for this instructor and section" },
        { status: 404 }
      );
    }

    // 3️⃣ Get all assignments for this class
    const assignments = await Assignment.find({ class_id: klass._id })
      .sort({ start_date: 1 }) // optional sorting
      .lean();

    if (assignments.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No assignments found for this class.",
        assignments: [],
      });
    }

    // 4️⃣ Prepare clean response
    const formattedAssignments = assignments.map((a) => ({
      assignment_id: a._id,
      assignment_name: a.title,
      start_date: a.start_date,
      end_date: a.due_date,
    }));

    // 5️⃣ Send success response
    return NextResponse.json({
      ok: true,
      class: {
        class_id: klass._id,
        name: klass.name,
        section: klass.section,
        instructor_email: instructor.email,
      },
      assignments: formattedAssignments,
    });
  } catch (e: any) {
    console.error("Error fetching assignments:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
