import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose, { Types } from "mongoose";

import User from "@/models/User";
import Class from "@/models/Class";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import Assignment from "@/models/Assignment";
import AssignmentTeam from "@/models/AssignmentTeam";
import Question from "@/models/Question";

// Ensure these models are registered
import "@/models/Submission";
import "@/models/Response";
import "@/models/Comment";
import "@/models/Praise";

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

type AssignmentLean = {
  _id: Types.ObjectId;
  class_id: Types.ObjectId;
  title?: string;
  start_date?: Date;
  due_date?: Date;
  allow_multiple_submissions?: boolean;
  active?: string | boolean;
};

type AssignmentTeamLean = {
  assignment_id: Types.ObjectId;
  team_id: Types.ObjectId;
};

type SubmissionLean = {
  _id: Types.ObjectId;
  assignment_id: Types.ObjectId;
  team_id: Types.ObjectId;
  student_id: Types.ObjectId;
  submitted_at?: Date;
  single_lock?: boolean;
};

type ResponseLean = {
  _id: Types.ObjectId;
  submission_id: Types.ObjectId;
  from_student_id: Types.ObjectId;
  to_student_id: Types.ObjectId;
  question_id?: Types.ObjectId | null;
  rating?: number;
};

type CommentLean = {
  _id: Types.ObjectId;
  submission_id: Types.ObjectId;
  from_student_id: Types.ObjectId;
  to_student_id: Types.ObjectId;
  question_id?: Types.ObjectId | null;
  comment_text?: string;
};

type PraiseLean = {
  _id: Types.ObjectId;
  submission_id: Types.ObjectId;
  from_student_id: Types.ObjectId;
  to_student_id: Types.ObjectId;
  question_id?: Types.ObjectId | null;
  praise_text?: string;
};

type QuestionInfo = {
  question_id: string | null;
  qid: string | null;
  title: string | null;
  description: string | null;
};

type QuestionLean = {
  _id: Types.ObjectId;
  qid?: string;
  title?: string;
  description?: string;
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
    }).lean()) as unknown as StaffLean | null;

    if (!staff) {
      return NextResponse.json(
        { ok: false, error: "Instructor/TA not found" },
        { status: 404 },
      );
    }

    const classes = (await Class.find({ instructor_id: staff._id })
      .sort({ year: -1, term: 1, section: 1 })
      .lean()) as unknown as ClassLean[];

    if (!classes.length) {
      return NextResponse.json({
        ok: true,
        instructor: staff,
        classes: [],
        note:
          staff.role === "ta"
            ? "No classes found. Current schema only links classes to instructor_id. Add a ClassStaff mapping to support TA visibility."
            : "No classes found for this instructor.",
      });
    }

    const classIds = classes.map((c) => c._id);

    const teams = (await Team.find({
      class_id: { $in: classIds },
    }).lean()) as unknown as TeamLean[];
    const teamIds = teams.map((t) => t._id);

    const teamMembers = (await TeamMember.find({ team_id: { $in: teamIds } })
      .populate("student_id", "email first_name last_name role")
      .lean()) as unknown as TeamMemberPopulated[];

    const assignments = (await Assignment.find({ class_id: { $in: classIds } })
      .sort({ start_date: -1, _id: -1 })
      .lean()) as unknown as AssignmentLean[];
    const assignmentIds = assignments.map((a) => a._id);

    const assignmentTeams = assignmentIds.length
      ? ((await AssignmentTeam.find({
          assignment_id: { $in: assignmentIds },
        }).lean()) as unknown as AssignmentTeamLean[])
      : ([] as AssignmentTeamLean[]);

    const SubmissionModel = mongoose.model("Submission");
    const submissions = assignmentIds.length
      ? ((await SubmissionModel.find({
          assignment_id: { $in: assignmentIds },
        }).lean()) as unknown as SubmissionLean[])
      : ([] as SubmissionLean[]);
    const submissionIds = submissions.map((s) => s._id);

    const ResponseModel = mongoose.model("Response");
    const CommentModel = mongoose.model("Comment");
    const PraiseModel = mongoose.model("Praise");

    const [responses, comments, praises] = await Promise.all([
      submissionIds.length
        ? (ResponseModel.find({
            submission_id: { $in: submissionIds },
          }).lean() as unknown as Promise<ResponseLean[]>)
        : Promise.resolve([] as ResponseLean[]),
      submissionIds.length
        ? (CommentModel.find({
            submission_id: { $in: submissionIds },
          }).lean() as unknown as Promise<CommentLean[]>)
        : Promise.resolve([] as CommentLean[]),
      submissionIds.length
        ? (PraiseModel.find({
            submission_id: { $in: submissionIds },
          }).lean() as unknown as Promise<PraiseLean[]>)
        : Promise.resolve([] as PraiseLean[]),
    ]);

    const questions = (await Question.find({})
      .select({ qid: 1, title: 1, description: 1 })
      .lean()) as unknown as QuestionLean[];

    const questionMap = new Map<string, QuestionInfo>();
    for (const q of questions) {
      const qId = String(q._id);
      questionMap.set(qId, {
        question_id: qId,
        qid: q.qid ?? null,
        title: q.title ?? null,
        description: q.description ?? null,
      });
    }

    const qInfo = (qid: Types.ObjectId | null | undefined): QuestionInfo => {
      const key = qid ? String(qid) : "";
      return (
        questionMap.get(key) || {
          question_id: key || null,
          qid: null,
          title: null,
          description: null,
        }
      );
    };

    // lookup maps
    const teamsByClass = new Map<string, TeamLean[]>();
    for (const t of teams) {
      const key = String(t.class_id);
      if (!teamsByClass.has(key)) teamsByClass.set(key, []);
      teamsByClass.get(key)!.push(t);
    }

    const membersByTeam = new Map<string, TeamMemberPopulated[]>();
    for (const tm of teamMembers) {
      const key = String(tm.team_id);
      if (!membersByTeam.has(key)) membersByTeam.set(key, []);
      membersByTeam.get(key)!.push(tm);
    }

    const assignmentsByClass = new Map<string, AssignmentLean[]>();
    for (const a of assignments) {
      const key = String(a.class_id);
      if (!assignmentsByClass.has(key)) assignmentsByClass.set(key, []);
      assignmentsByClass.get(key)!.push(a);
    }

    const assignmentTeamsByAssignment = new Map<string, string[]>();
    for (const at of assignmentTeams) {
      const key = String(at.assignment_id);
      if (!assignmentTeamsByAssignment.has(key))
        assignmentTeamsByAssignment.set(key, []);
      assignmentTeamsByAssignment.get(key)!.push(String(at.team_id));
    }

    const submissionsByAssignment = new Map<string, SubmissionLean[]>();
    for (const s of submissions) {
      const key = String(s.assignment_id);
      if (!submissionsByAssignment.has(key))
        submissionsByAssignment.set(key, []);
      submissionsByAssignment.get(key)!.push(s);
    }

    const responsesBySubmission = new Map<string, ResponseLean[]>();
    for (const r of responses) {
      const key = String(r.submission_id);
      if (!responsesBySubmission.has(key)) responsesBySubmission.set(key, []);
      responsesBySubmission.get(key)!.push(r);
    }

    const commentsBySubmission = new Map<string, CommentLean[]>();
    for (const c of comments) {
      const key = String(c.submission_id);
      if (!commentsBySubmission.has(key)) commentsBySubmission.set(key, []);
      commentsBySubmission.get(key)!.push(c);
    }

    const praisesBySubmission = new Map<string, PraiseLean[]>();
    for (const p of praises) {
      const key = String(p.submission_id);
      if (!praisesBySubmission.has(key)) praisesBySubmission.set(key, []);
      praisesBySubmission.get(key)!.push(p);
    }

    const result = classes.map((klass) => {
      const classId = String(klass._id);

      const classTeams = (teamsByClass.get(classId) || []).map((t) => {
        const teamId = String(t._id);
        const members = (membersByTeam.get(teamId) || []).map((tm) => {
          const u = tm.student_id;
          return {
            user_id: u?._id ? String(u._id) : null,
            email: u?.email ?? null,
            first_name: u?.first_name ?? null,
            last_name: u?.last_name ?? null,
            role: u?.role ?? null,
          };
        });

        return { team_id: teamId, team_number: t.team_number ?? null, members };
      });

      const classAssignments = (assignmentsByClass.get(classId) || []).map(
        (a) => {
          const assignmentId = String(a._id);
          const linkedTeamIds =
            assignmentTeamsByAssignment.get(assignmentId) || [];

          const assignmentSubmissions = (
            submissionsByAssignment.get(assignmentId) || []
          ).map((s) => {
            const submissionId = String(s._id);

            return {
              submission_id: submissionId,
              assignment_id: String(s.assignment_id),
              team_id: String(s.team_id),
              from_student_id: String(s.student_id),
              submitted_at: s.submitted_at ?? null,
              single_lock: s.single_lock ?? null,

              responses: (responsesBySubmission.get(submissionId) || []).map(
                (r) => ({
                  response_id: String(r._id),
                  from_student_id: String(r.from_student_id),
                  to_student_id: String(r.to_student_id),
                  question: qInfo(r.question_id ?? null),
                  rating: r.rating ?? null,
                }),
              ),

              comments: (commentsBySubmission.get(submissionId) || []).map(
                (c) => ({
                  comment_id: String(c._id),
                  from_student_id: String(c.from_student_id),
                  to_student_id: String(c.to_student_id),
                  question: qInfo(c.question_id ?? null),
                  comment_text: c.comment_text ?? null,
                }),
              ),

              praises: (praisesBySubmission.get(submissionId) || []).map(
                (p) => ({
                  praise_id: String(p._id),
                  from_student_id: String(p.from_student_id),
                  to_student_id: String(p.to_student_id),
                  question: p.question_id ? qInfo(p.question_id) : null,
                  praise_text: p.praise_text ?? null,
                }),
              ),
            };
          });

          return {
            assignment_id: assignmentId,
            title: a.title ?? null,
            start_date: a.start_date ?? null,
            due_date: a.due_date ?? null,
            allow_multiple_submissions: a.allow_multiple_submissions ?? null,
            active: a.active ?? null,
            linked_team_ids: linkedTeamIds,
            submissions: assignmentSubmissions,
          };
        },
      );

      return {
        class_id: classId,
        name: klass.name ?? null,
        section: klass.section ?? null,
        term: klass.term ?? null,
        year: klass.year ?? null,
        teams: classTeams,
        assignments: classAssignments,
      };
    });

    return NextResponse.json({
      ok: true,
      instructor: {
        _id: String(staff._id),
        email: staff.email,
        first_name: staff.first_name ?? null,
        last_name: staff.last_name ?? null,
        role: staff.role,
      },
      classes: result,
    });
  } catch (e: unknown) {
    console.error("instructor-summary error:", e);
    return NextResponse.json(
      { ok: false, error: errorMessage(e) },
      { status: 500 },
    );
  }
}
