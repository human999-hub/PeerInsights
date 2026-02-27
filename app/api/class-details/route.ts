import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import User from "@/models/User";
import type { Types } from "mongoose";

type UserRole = "student" | "instructor" | "ta";

type InstructorLean = {
  _id: Types.ObjectId;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
};

type ClassLean = {
  _id: Types.ObjectId;
  name: string;
  section: string;
  term?: string;
  year?: number;
  instructor_id: Types.ObjectId;
};

type TeamLean = {
  _id: Types.ObjectId;
  class_id: Types.ObjectId;
  team_number: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type PopulatedStudent = {
  _id: Types.ObjectId;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
};

type TeamMemberPopulatedLean = {
  student_id: PopulatedStudent | null;
};

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

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

    // 1) Find instructor (instructor or TA)
    const instructor = await User.findOne({
      email: instructor_email,
      role: { $in: ["instructor", "ta"] },
    })
      .select({ email: 1, first_name: 1, last_name: 1, role: 1 })
      .lean<InstructorLean | null>();

    if (!instructor) {
      return NextResponse.json(
        { ok: false, error: "Instructor not found" },
        { status: 404 },
      );
    }

    // 2) Find class for instructor + section
    const klass = await Class.findOne({
      instructor_id: instructor._id,
      section,
    })
      .select({ name: 1, section: 1, term: 1, year: 1, instructor_id: 1 })
      .lean<ClassLean | null>();

    if (!klass) {
      return NextResponse.json(
        { ok: false, error: "Class not found for this instructor and section" },
        { status: 404 },
      );
    }

    // 3) Teams
    const teams = await Team.find({ class_id: klass._id })
      .select({ class_id: 1, team_number: 1, createdAt: 1, updatedAt: 1 })
      .lean<TeamLean[]>();

    // 4) Members per team
    const fullTeams = await Promise.all(
      teams.map(async (team) => {
        const members = await TeamMember.find({ team_id: team._id })
          .populate({
            path: "student_id",
            select: "email first_name last_name role",
          })
          .lean<TeamMemberPopulatedLean[]>();

        const formattedMembers = members
          .filter((m) => m.student_id !== null)
          .map((m) => ({
            user_id: m.student_id!._id.toString(),
            email: m.student_id!.email,
            first_name: m.student_id!.first_name ?? null,
            last_name: m.student_id!.last_name ?? null,
            role: m.student_id!.role,
          }));

        return {
          _id: team._id.toString(),
          class_id: team.class_id.toString(),
          team_number: team.team_number,
          createdAt: team.createdAt ?? null,
          updatedAt: team.updatedAt ?? null,
          members: formattedMembers,
        };
      }),
    );

    return NextResponse.json({
      ok: true,
      class: {
        _id: klass._id.toString(),
        name: klass.name,
        section: klass.section,
        term: klass.term ?? null,
        year: klass.year ?? null,
        instructor: {
          _id: instructor._id.toString(),
          email: instructor.email,
          first_name: instructor.first_name ?? null,
          last_name: instructor.last_name ?? null,
          role: instructor.role,
        },
        teams: fullTeams,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(e) },
      { status: 500 },
    );
  }
}
