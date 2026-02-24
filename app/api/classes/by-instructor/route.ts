import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import User from "@/models/User";
import type { Types } from "mongoose";

type UserRole = "student" | "instructor" | "ta";

type PopulatedStudent = {
  _id: Types.ObjectId;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
};

type TeamMemberPopulated = {
  student_id: PopulatedStudent;
};

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export async function GET(req: Request) {
  try {
    await connectDB();

    // /api/classes/by-instructor?email=...
    const { searchParams } = new URL(req.url);
    const instructor_email = searchParams.get("email");

    if (!instructor_email) {
      return NextResponse.json(
        { ok: false, error: "Missing instructor_email" },
        { status: 400 },
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
        { status: 404 },
      );
    }

    // Find classes taught by this instructor
    const classes = await Class.find({ instructor_id: instructor._id });

    const results: Array<{
      _id: Types.ObjectId;
      name: string;
      section: string;
      term: string;
      year: string | number;
      instructor: {
        _id: Types.ObjectId;
        email: string;
        first_name?: string;
        last_name?: string;
      };
      teams: Array<{
        _id: Types.ObjectId;
        class_id: Types.ObjectId;
        team_number: string | number;
        createdAt?: Date;
        updatedAt?: Date;
        members: Array<{
          user_id: Types.ObjectId;
          email: string;
          first_name?: string;
          last_name?: string;
          role: UserRole;
        }>;
      }>;
    }> = [];

    for (const klass of classes) {
      const teams = await Team.find({ class_id: klass._id });

      const teamData: Array<{
        _id: Types.ObjectId;
        class_id: Types.ObjectId;
        team_number: string | number;
        createdAt?: Date;
        updatedAt?: Date;
        members: Array<{
          user_id: Types.ObjectId;
          email: string;
          first_name?: string;
          last_name?: string;
          role: UserRole;
        }>;
      }> = [];

      for (const team of teams) {
        const members = (await TeamMember.find({ team_id: team._id })
          .populate("student_id")
          .lean()) as unknown as TeamMemberPopulated[];

        teamData.push({
          _id: team._id,
          class_id: team.class_id,
          team_number: team.team_number,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
          members: members.map((m) => ({
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
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(e) },
      { status: 500 },
    );
  }
}
