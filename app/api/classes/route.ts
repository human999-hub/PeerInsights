import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import User from "@/models/User";
import type { Types } from "mongoose";

type UserRole = "student" | "instructor" | "ta";

type CreateClassBody = {
  instructor_email?: string;
  instructor_first_name?: string;
  instructor_last_name?: string;
  courseName?: string;
  term?: string;
  year?: string | number;
  class?: string; // section
  groups?: Array<{
    groupName: string | number;
    members: string[];
  }>;
};

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

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = (await req.json()) as CreateClassBody;

    const {
      instructor_email,
      instructor_first_name,
      instructor_last_name,
      courseName,
      term,
      year,
      class: section,
      groups = [],
    } = body;

    if (!instructor_email || !courseName || !term || !year || !section) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1️⃣ Ensure instructor
    let instructor = await User.findOne({ email: instructor_email });
    if (!instructor) {
      instructor = await User.create({
        email: instructor_email,
        first_name: instructor_first_name ?? "",
        last_name: instructor_last_name ?? "",
        role: "instructor",
      });
    }

    // 2️⃣ Create/find class
    const className = `${term}_${year}_${courseName}`;
    let klass = await Class.findOne({ name: className, section });
    if (!klass) {
      klass = await Class.create({
        name: className,
        section,
        term,
        year,
        instructor_id: instructor._id,
      });
    }

    // 3️⃣ Create teams and members
    for (const group of groups) {
      let team = await Team.findOne({
        class_id: klass._id,
        team_number: group.groupName,
      });

      if (!team) {
        team = await Team.create({
          class_id: klass._id,
          team_number: group.groupName,
        });
      }

      for (const memberName of group.members) {
        const [first_name, ...rest] = memberName.split(" ");
        const last_name = rest.join(" ") || "";
        const email =
          memberName.toLowerCase().replace(/\s+/g, "") + "@example.com";

        let student = await User.findOne({ email });
        if (!student) {
          student = await User.create({
            email,
            first_name,
            last_name,
            role: "student",
          });
        }

        const exists = await TeamMember.findOne({
          team_id: team._id,
          student_id: student._id,
        });

        if (!exists) {
          await TeamMember.create({
            team_id: team._id,
            student_id: student._id,
          });
        }
      }
    }

    // 4️⃣ Build return payload (teams with members)
    const teamsRaw = await Team.find({ class_id: klass._id }).lean();

    const teams = await Promise.all(
      teamsRaw.map(async (team) => {
        const members = (await TeamMember.find({ team_id: team._id })
          .populate("student_id")
          .lean()) as unknown as TeamMemberPopulated[];

        return {
          ...team,
          members: members.map((m) => ({
            user_id: m.student_id._id,
            email: m.student_id.email,
            first_name: m.student_id.first_name,
            last_name: m.student_id.last_name,
            role: m.student_id.role,
          })),
        };
      }),
    );

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
        teams,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(e) },
      { status: 500 },
    );
  }
}
