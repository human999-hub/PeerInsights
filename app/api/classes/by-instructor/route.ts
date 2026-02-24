// peerinsights/app/api/classes/by-instructor/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    await connectDB();

    // Extract email from query string: /api/classes/by-instructor?email=...
    const { searchParams } = new URL(req.url);
    const instructor_email = searchParams.get("email");

    if (!instructor_email) {
      return NextResponse.json(
        { ok: false, error: "Missing instructor_email" },
        { status: 400 }
      );
    }

    // Find instructor
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

    // Find classes taught by this instructor
    const classes = await Class.find({ instructor_id: instructor._id });

    // For each class, fetch its teams and members
    const results = [];
    for (const klass of classes) {
      const teams = await Team.find({ class_id: klass._id });

      const teamData = [];
      for (const team of teams) {
        const members = await TeamMember.find({ team_id: team._id }).populate(
          "student_id"
        );

        teamData.push({
          _id: team._id,
          class_id: team.class_id,
          team_number: team.team_number,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
          members: members.map((m: any) => ({
            user_id: m.student_id._id,
            email: m.student_id.email,
            first_name: m.student_id.first_name,
            last_name: m.student_id.last_name,
            role: m.student_id.role,
          })),
        });
      }

      results.push({
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
        teams: teamData,
      });
    }

    return NextResponse.json({ ok: true, classes: results });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
