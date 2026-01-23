// app/api/responses/instructor-summary-lite/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";
import Class from "@/models/Class";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const instructor_email = searchParams.get("instructor_email");
    if (!instructor_email) {
      return NextResponse.json(
        { ok: false, error: "Missing instructor_email" },
        { status: 400 },
      );
    }

    // 1) Find staff user
    const staff = await User.findOne({
      email: instructor_email,
      role: { $in: ["instructor", "ta"] },
    })
      .select({ email: 1, first_name: 1, last_name: 1, role: 1 })
      .lean();

    if (!staff) {
      return NextResponse.json(
        { ok: false, error: "Instructor/TA not found" },
        { status: 404 },
      );
    }

    // 2) Classes
    const classes = await Class.find({ instructor_id: staff._id })
      .select({ name: 1, section: 1, term: 1, year: 1 })
      .sort({ year: -1, term: 1, section: 1 })
      .lean();

    if (!classes.length) {
      return NextResponse.json({
        ok: true,
        instructor: {
          _id: String(staff._id),
          email: staff.email,
          first_name: staff.first_name,
          last_name: staff.last_name,
          role: staff.role,
        },
        classes: [],
      });
    }

    const classIds = classes.map((c) => c._id);

    // 3) Teams
    const teams = await Team.find({ class_id: { $in: classIds } })
      .select({ class_id: 1, team_number: 1 })
      .sort({ team_number: 1 })
      .lean();

    const teamIds = teams.map((t) => t._id);

    // 4) Load team members WITH names
    const teamMembers = await TeamMember.find({ team_id: { $in: teamIds } })
      .populate("student_id", "email first_name last_name role")
      .lean();

    const membersByTeam = new Map<string, any[]>();
    for (const tm of teamMembers as any[]) {
      const key = String(tm.team_id);
      if (!membersByTeam.has(key)) membersByTeam.set(key, []);

      const u = tm.student_id; // populated user
      membersByTeam.get(key)!.push({
        user_id: String(u?._id),
        email: u?.email,
        first_name: u?.first_name,
        last_name: u?.last_name,
        role: u?.role,
      });
    }

    // 5) (Optional) member count from membersByTeam
    const teamsByClass = new Map<string, any[]>();
    for (const t of teams as any[]) {
      const classKey = String(t.class_id);
      if (!teamsByClass.has(classKey)) teamsByClass.set(classKey, []);

      const tid = String(t._id);
      const members = membersByTeam.get(tid) || [];

      teamsByClass.get(classKey)!.push({
        team_id: tid,
        team_number: t.team_number,
        members_count: members.length,
        members, // ✅ names included here
      });
    }

    return NextResponse.json({
      ok: true,
      instructor: {
        _id: String(staff._id),
        email: staff.email,
        first_name: staff.first_name,
        last_name: staff.last_name,
        role: staff.role,
      },
      classes: classes.map((c: any) => ({
        class_id: String(c._id),
        name: c.name,
        section: c.section,
        term: c.term,
        year: c.year,
        teams: teamsByClass.get(String(c._id)) || [],
      })),
    });
  } catch (e: any) {
    console.error("instructor-summary-lite error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
