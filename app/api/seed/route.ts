import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import User from "@/models/User";
import Class from "@/models/Class";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import Assignment from "@/models/Assignment";
import AssignmentTeam from "@/models/AssignmentTeam";

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export async function POST() {
  try {
    await connectDB();

    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    const ensureUser = async (
      email: string,
      first: string,
      last: string,
      role: "student" | "instructor",
    ) => {
      let u = await User.findOne({ email });
      if (!u) {
        u = await User.create({
          email,
          first_name: first,
          last_name: last,
          role,
        });
      }
      return u;
    };

    const instructor = await ensureUser(
      "instructor@example.com",
      "Instructor",
      "One",
      "instructor",
    );
    const haritha = await ensureUser(
      "haritha@example.com",
      "Haritha",
      "Injam",
      "student",
    );
    const sushma = await ensureUser(
      "sushma@example.com",
      "Sushma",
      "Nukala",
      "student",
    );
    const aparanji = await ensureUser(
      "aparanji@example.com",
      "Aparanji",
      "Nemmani",
      "student",
    );
    const shutonu = await ensureUser(
      "shutonu@example.com",
      "Shutonu",
      "Mitra",
      "student",
    );

    let klass = await Class.findOne({
      name: "Fall_2025_Capstone_Project",
      term: "Fall",
      year: 2025,
    });
    if (!klass) {
      klass = await Class.create({
        name: "Fall_2025_Capstone_Project",
        instructor_id: instructor._id,
        term: "Fall",
        year: 2025,
      });
    }

    let team = await Team.findOne({
      class_id: klass._id,
      team_number: "Group_1",
    });
    if (!team) {
      team = await Team.create({ class_id: klass._id, team_number: "Group_1" });
    }

    const ensureMember = async (studentId: mongoose.Types.ObjectId) => {
      const exists = await TeamMember.exists({
        team_id: team._id,
        student_id: studentId,
      });
      if (!exists) {
        await TeamMember.create({ team_id: team._id, student_id: studentId });
      }
    };

    await Promise.all(
      [haritha, sushma, aparanji, shutonu].map((u) => ensureMember(u._id)),
    );

    let assignment = await Assignment.findOne({
      class_id: klass._id,
      title: "Peer_Evaluation",
    });
    if (!assignment) {
      assignment = await Assignment.create({
        class_id: klass._id,
        title: "Peer_Evaluation",
        start_date: new Date(now.getTime() - day), // yesterday
        due_date: new Date(now.getTime() + 7 * day), // +7 days
        allow_multiple_submissions: "N",
        created_by: instructor._id,
        active: "Y",
      });
    }

    const link = await AssignmentTeam.exists({
      assignment_id: assignment._id,
      team_id: team._id,
    });
    if (!link) {
      await AssignmentTeam.create({
        assignment_id: assignment._id,
        team_id: team._id,
      });
    }

    return NextResponse.json({
      ok: true,
      class_id: String(klass._id),
      team_id: String(team._id),
      assignment_id: String(assignment._id),
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(e) },
      { status: 500 },
    );
  }
}
