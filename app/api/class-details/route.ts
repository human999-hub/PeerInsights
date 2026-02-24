// app/api/class-details/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    await connectDB();

    // Extract query params: /api/class-details?instructor_email=...&section=...
    const { searchParams } = new URL(req.url);
    const instructor_email = searchParams.get("instructor_email");
    const section = searchParams.get("section");

    if (!instructor_email || !section) {
      return NextResponse.json(
        { ok: false, error: "Missing instructor_email or section" },
        { status: 400 }
      );
    }

    // Find instructor
    const instructor = await User.findOne({
      email: instructor_email,
      role: { $in: ["instructor", "ta"] }, // CHANGED FOR TA
    });
    if (!instructor)
      return NextResponse.json(
        { ok: false, error: "Instructor not found" },
        { status: 404 }
      );

    // Find class for instructor + section
    const klass = await Class.findOne({
      instructor_id: instructor._id,
      section,
    }).lean();

    if (!klass)
      return NextResponse.json(
        { ok: false, error: "Class not found for this instructor and section" },
        { status: 404 }
      );

    // Find all teams for this class
    const teams = await Team.find({ class_id: klass._id }).lean();

    // For each team, get members
    const fullTeams = [];
    for (const team of teams) {
      const members = await TeamMember.find({ team_id: team._id })
        .populate("student_id")
        .lean();

      const formattedMembers = members.map((m) => ({
        user_id: m.student_id._id,
        email: m.student_id.email,
        first_name: m.student_id.first_name,
        last_name: m.student_id.last_name,
        role: m.student_id.role,
      }));

      fullTeams.push({
        ...team,
        members: formattedMembers,
      });
    }

    return NextResponse.json({
      ok: true,
      class: {
        _id: klass._id,
        name: klass.name,
        section: klass.section,
        term: klass.term,
        year: klass.year,
        instructor: {
          _id: instructor._id,
          email: instructor.email,
          first_name: instructor.first_name,
          last_name: instructor.last_name,
        },
        teams: fullTeams,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
