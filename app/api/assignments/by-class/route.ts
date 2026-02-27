// app/api/assignments/by-class/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Class from "@/models/Class";
import Assignment from "@/models/Assignment";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const instructor_email = searchParams.get("instructor_email");
    const section = searchParams.get("section");

    if (!instructor_email || !section) {
      return NextResponse.json(
        { ok: false, error: "Missing instructor_email or section" },
        { status: 400 },
      );
    }

    // ✅ allow TA too (matches your other APIs)
    const instructor = await User.findOne({
      email: instructor_email,
      role: { $in: ["instructor", "ta"] },
    }).lean<{ _id: unknown; email: string }>();

    if (!instructor) {
      return NextResponse.json(
        { ok: false, error: "Instructor/TA not found" },
        { status: 404 },
      );
    }

    const klass = await Class.findOne({
      instructor_id: instructor._id,
      section,
    }).lean<{ _id: unknown; name: string; section: string }>();

    if (!klass) {
      return NextResponse.json(
        { ok: false, error: "Class not found for this instructor and section" },
        { status: 404 },
      );
    }

    const assignments = await Assignment.find({ class_id: klass._id })
      .sort({ start_date: 1 })
      .lean<
        { _id: unknown; title: string; start_date: Date; due_date: Date }[]
      >();

    const formattedAssignments = assignments.map((a) => ({
      assignment_id: String(a._id),
      assignment_name: a.title,
      start_date: a.start_date,
      end_date: a.due_date,
    }));

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
  } catch (e: unknown) {
    console.error("Error fetching assignments:", e);
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
