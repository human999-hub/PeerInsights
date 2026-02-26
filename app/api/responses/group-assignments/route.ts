import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose, { Types } from "mongoose";
import Class from "@/models/Class";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import Assignment from "@/models/Assignment";
import AssignmentTeam from "@/models/AssignmentTeam";

// ensure model registered
import "@/models/Submission";

type PopulatedStudent = {
  _id: Types.ObjectId;
  email?: string;
  first_name?: string;
  last_name?: string;
};

type TeamMemberPopulated = {
  student_id?: PopulatedStudent | null;
};

type AssignmentLean = {
  _id: Types.ObjectId;
  title?: string;
  start_date?: Date;
  due_date?: Date;
  active?: string | boolean;
  allow_multiple_submissions?: boolean;
};

type AssignmentTeamLean = {
  assignment_id: Types.ObjectId;
};

type SubmissionCountAgg = {
  _id: Types.ObjectId;
  count: number;
};

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const teamId = searchParams.get("teamId");

    if (!classId || !teamId) {
      return NextResponse.json(
        { ok: false, error: "Missing classId or teamId" },
        { status: 400 },
      );
    }

    const classObjectId = new mongoose.Types.ObjectId(classId);
    const teamObjectId = new mongoose.Types.ObjectId(teamId);

    // 1) Validate class + team
    const [klass, team] = await Promise.all([
      Class.findById(classObjectId)
        .select({ name: 1, section: 1, term: 1, year: 1 })
        .lean(),
      Team.findOne({ _id: teamObjectId, class_id: classObjectId })
        .select({ team_number: 1, class_id: 1 })
        .lean(),
    ]);

    if (!klass) {
      return NextResponse.json(
        { ok: false, error: "Class not found" },
        { status: 404 },
      );
    }
    if (!team) {
      return NextResponse.json(
        { ok: false, error: "Team not found for class" },
        { status: 404 },
      );
    }

    // 2) team members
    const members = (await TeamMember.find({ team_id: teamObjectId })
      .populate("student_id", "email first_name last_name")
      .lean()) as unknown as TeamMemberPopulated[];

    // 3) assignments linked to this team via AssignmentTeam
    const links = (await AssignmentTeam.find({ team_id: teamObjectId })
      .select({ assignment_id: 1 })
      .lean()) as unknown as AssignmentTeamLean[];

    const assignmentIds = links.map((l) => l.assignment_id);

    if (!assignmentIds.length) {
      return NextResponse.json({
        ok: true,
        class: {
          class_id: classId,
          name: klass.name,
          section: klass.section,
          term: klass.term,
          year: klass.year,
        },
        team: {
          team_id: teamId,
          team_number: team.team_number,
          members: members.map((m) => ({
            user_id: m.student_id?._id ? String(m.student_id._id) : null,
            email: m.student_id?.email ?? null,
            first_name: m.student_id?.first_name ?? null,
            last_name: m.student_id?.last_name ?? null,
          })),
        },
        assignments: [],
      });
    }

    const assignments = (await Assignment.find({ _id: { $in: assignmentIds } })
      .select({
        title: 1,
        start_date: 1,
        due_date: 1,
        active: 1,
        allow_multiple_submissions: 1,
      })
      .sort({ start_date: -1, _id: -1 })
      .lean()) as unknown as AssignmentLean[];

    // 4) submissionsCount per assignment (for THIS team)
    const SubmissionModel = mongoose.model("Submission");

    const counts = (await SubmissionModel.aggregate([
      {
        $match: {
          assignment_id: { $in: assignmentIds },
          team_id: teamObjectId,
        },
      },
      { $group: { _id: "$assignment_id", count: { $sum: 1 } } },
    ])) as SubmissionCountAgg[];

    const countMap = new Map<string, number>(
      counts.map((c) => [String(c._id), c.count]),
    );

    return NextResponse.json({
      ok: true,
      class: {
        class_id: classId,
        name: klass.name,
        section: klass.section,
        term: klass.term,
        year: klass.year,
      },
      team: {
        team_id: teamId,
        team_number: team.team_number,
        members: members.map((m) => ({
          user_id: m.student_id?._id ? String(m.student_id._id) : null,
          email: m.student_id?.email ?? null,
          first_name: m.student_id?.first_name ?? null,
          last_name: m.student_id?.last_name ?? null,
        })),
      },
      assignments: assignments.map((a) => ({
        assignment_id: String(a._id),
        title: a.title ?? null,
        start_date: a.start_date ?? null,
        due_date: a.due_date ?? null,
        active: a.active ?? null,
        allow_multiple_submissions: a.allow_multiple_submissions ?? null,
        submissionsCount: countMap.get(String(a._id)) ?? 0,
      })),
    });
  } catch (e: unknown) {
    console.error("group-assignments error:", e);
    return NextResponse.json(
      { ok: false, error: errorMessage(e) },
      { status: 500 },
    );
  }
}
