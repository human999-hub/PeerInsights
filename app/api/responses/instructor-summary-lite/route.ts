import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Types } from "mongoose";

import User from "@/models/User";
import Class from "@/models/Class";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";

type UserRole = "student" | "instructor" | "ta";

type StaffLean = {
  _id: Types.ObjectId;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
};

type ClassLean = {
  _id: Types.ObjectId;
  name?: string;
  section?: string;
  term?: string;
  year?: string | number;
};

type TeamLean = {
  _id: Types.ObjectId;
  class_id: Types.ObjectId;
  team_number?: string;
};

type PopulatedStudent = {
  _id: Types.ObjectId;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
};

type TeamMemberPopulated = {
  team_id: Types.ObjectId;
  student_id?: PopulatedStudent | null;
};

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

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

    const staff = (await User.findOne({
      email: instructor_email,
      role: { $in: ["instructor", "ta"] },
    })
      .select({ email: 1, first_name: 1, last_name: 1, role: 1 })
      .lean()) as unknown as StaffLean | null;

    if (!staff) {
      return NextResponse.json(
        { ok: false, error: "Instructor/TA not found" },
        { status: 404 },
      );
    }

    const classes = (await Class.find({ instructor_id: staff._id })
      .select({ name: 1, section: 1, term: 1, year: 1 })
      .sort({ year: -1, term: 1, section: 1 })
      .lean()) as unknown as ClassLean[];

    if (!classes.length) {
      return NextResponse.json({
        ok: true,
        instructor: {
          _id: String(staff._id),
          email: staff.email,
          first_name: staff.first_name ?? null,
          last_name: staff.last_name ?? null,
          role: staff.role,
        },
        classes: [],
      });
    }

    const classIds = classes.map((c) => c._id);

    const teams = (await Team.find({ class_id: { $in: classIds } })
      .select({ class_id: 1, team_number: 1 })
      .sort({ team_number: 1 })
      .lean()) as unknown as TeamLean[];

    const teamIds = teams.map((t) => t._id);

    const teamMembers = (await TeamMember.find({ team_id: { $in: teamIds } })
      .populate("student_id", "email first_name last_name role")
      .lean()) as unknown as TeamMemberPopulated[];

    const membersByTeam = new Map<
      string,
      Array<{
        user_id: string | null;
        email: string | null;
        first_name: string | null;
        last_name: string | null;
        role: UserRole | null;
      }>
    >();

    for (const tm of teamMembers) {
      const key = String(tm.team_id);
      if (!membersByTeam.has(key)) membersByTeam.set(key, []);

      const u = tm.student_id;
      membersByTeam.get(key)!.push({
        user_id: u?._id ? String(u._id) : null,
        email: u?.email ?? null,
        first_name: u?.first_name ?? null,
        last_name: u?.last_name ?? null,
        role: u?.role ?? null,
      });
    }

    const teamsByClass = new Map<
      string,
      Array<{
        team_id: string;
        team_number: string | null;
        members_count: number;
        members: ReturnType<(typeof membersByTeam)["get"]> extends infer R
          ? NonNullable<R>
          : never;
      }>
    >();

    for (const t of teams) {
      const classKey = String(t.class_id);
      if (!teamsByClass.has(classKey)) teamsByClass.set(classKey, []);

      const tid = String(t._id);
      const members = membersByTeam.get(tid) || [];

      teamsByClass.get(classKey)!.push({
        team_id: tid,
        team_number: t.team_number ?? null,
        members_count: members.length,
        members,
      });
    }

    return NextResponse.json({
      ok: true,
      instructor: {
        _id: String(staff._id),
        email: staff.email,
        first_name: staff.first_name ?? null,
        last_name: staff.last_name ?? null,
        role: staff.role,
      },
      classes: classes.map((c) => ({
        class_id: String(c._id),
        name: c.name ?? null,
        section: c.section ?? null,
        term: c.term ?? null,
        year: c.year ?? null,
        teams: teamsByClass.get(String(c._id)) || [],
      })),
    });
  } catch (e: unknown) {
    console.error("instructor-summary-lite error:", e);
    return NextResponse.json(
      { ok: false, error: errorMessage(e) },
      { status: 500 },
    );
  }
}
