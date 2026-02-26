import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose, { Types } from "mongoose";

import Assignment from "@/models/Assignment";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import Question from "@/models/Question";

// ensure models registered
import "@/models/Submission";
import "@/models/Response";
import "@/models/Comment";
import "@/models/Praise";

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

type SubmissionLean = {
  _id: Types.ObjectId;
  student_id: Types.ObjectId;
  submitted_at?: Date;
  single_lock?: boolean;
};

type ResponseLean = {
  _id: Types.ObjectId;
  submission_id: Types.ObjectId;
  from_student_id: Types.ObjectId;
  to_student_id: Types.ObjectId;
  question_id: Types.ObjectId;
  rating?: number;
};

type CommentLean = {
  _id: Types.ObjectId;
  submission_id: Types.ObjectId;
  from_student_id: Types.ObjectId;
  to_student_id: Types.ObjectId;
  question_id: Types.ObjectId;
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

type PopulatedStudent = {
  _id: Types.ObjectId;
  email?: string;
  first_name?: string;
  last_name?: string;
};

type TeamMemberPopulated = {
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
    const assignmentId = searchParams.get("assignmentId");
    const teamId = searchParams.get("teamId");

    if (!assignmentId || !teamId) {
      return NextResponse.json(
        { ok: false, error: "Missing assignmentId or teamId" },
        { status: 400 },
      );
    }

    const assignmentObjectId = new mongoose.Types.ObjectId(assignmentId);
    const teamObjectId = new mongoose.Types.ObjectId(teamId);

    // 1) Load assignment + team
    const [assignment, team] = await Promise.all([
      Assignment.findById(assignmentObjectId)
        .select({
          class_id: 1,
          title: 1,
          start_date: 1,
          due_date: 1,
          active: 1,
          allow_multiple_submissions: 1,
        })
        .lean(),
      Team.findById(teamObjectId)
        .select({ class_id: 1, team_number: 1 })
        .lean(),
    ]);

    if (!assignment) {
      return NextResponse.json(
        { ok: false, error: "Assignment not found" },
        { status: 404 },
      );
    }
    if (!team) {
      return NextResponse.json(
        { ok: false, error: "Team not found" },
        { status: 404 },
      );
    }

    // 2) Members (for UI labels)
    const members = (await TeamMember.find({ team_id: teamObjectId })
      .populate("student_id", "email first_name last_name")
      .lean()) as unknown as TeamMemberPopulated[];

    // 3) Submissions for this assignment + team
    const SubmissionModel = mongoose.model("Submission");
    const submissions = (await SubmissionModel.find({
      assignment_id: assignmentObjectId,
      team_id: teamObjectId,
    }).lean()) as unknown as SubmissionLean[];

    const submissionIds = submissions.map((s) => s._id);

    // 4) Load responses/comments/praises for those submissions
    const ResponseModel = mongoose.model("Response");
    const CommentModel = mongoose.model("Comment");
    const PraiseModel = mongoose.model("Praise");

    const [responses, comments, praises, questions] = await Promise.all([
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
      Question.find({})
        .select({ qid: 1, title: 1, description: 1 })
        .lean() as unknown as Promise<QuestionLean[]>,
    ]);

    // 5) question map (ONLY 4 fields)
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

    // 6) group by submission
    const responsesBySub = new Map<string, ResponseLean[]>();
    for (const r of responses) {
      const k = String(r.submission_id);
      if (!responsesBySub.has(k)) responsesBySub.set(k, []);
      responsesBySub.get(k)!.push(r);
    }

    const commentsBySub = new Map<string, CommentLean[]>();
    for (const c of comments) {
      const k = String(c.submission_id);
      if (!commentsBySub.has(k)) commentsBySub.set(k, []);
      commentsBySub.get(k)!.push(c);
    }

    const praisesBySub = new Map<string, PraiseLean[]>();
    for (const p of praises) {
      const k = String(p.submission_id);
      if (!praisesBySub.has(k)) praisesBySub.set(k, []);
      praisesBySub.get(k)!.push(p);
    }

    // 7) final payload
    return NextResponse.json({
      ok: true,
      assignment: {
        assignment_id: assignmentId,
        title: assignment.title,
        start_date: assignment.start_date,
        due_date: assignment.due_date,
        active: assignment.active,
        allow_multiple_submissions: assignment.allow_multiple_submissions,
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
      submissions: submissions.map((s) => {
        const sid = String(s._id);
        return {
          submission_id: sid,
          from_student_id: String(s.student_id),
          submitted_at: s.submitted_at ?? null,
          single_lock: s.single_lock ?? null,

          responses: (responsesBySub.get(sid) || []).map((r) => ({
            response_id: String(r._id),
            from_student_id: String(r.from_student_id),
            to_student_id: String(r.to_student_id),
            question_id: String(r.question_id),
            question: qInfo(r.question_id),
            rating: r.rating ?? null,
          })),

          comments: (commentsBySub.get(sid) || []).map((c) => ({
            comment_id: String(c._id),
            from_student_id: String(c.from_student_id),
            to_student_id: String(c.to_student_id),
            question_id: String(c.question_id),
            question: qInfo(c.question_id),
            comment_text: c.comment_text ?? null,
          })),

          praises: (praisesBySub.get(sid) || []).map((p) => ({
            praise_id: String(p._id),
            from_student_id: String(p.from_student_id),
            to_student_id: String(p.to_student_id),
            question_id: p.question_id ? String(p.question_id) : null,
            question: p.question_id ? qInfo(p.question_id) : null,
            praise_text: p.praise_text ?? null,
          })),
        };
      }),
    });
  } catch (e: unknown) {
    console.error("assignment-detail error:", e);
    return NextResponse.json(
      { ok: false, error: errorMessage(e) },
      { status: 500 },
    );
  }
}
