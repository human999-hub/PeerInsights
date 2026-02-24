// app/api/responses/assignment-detail/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";

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

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");
    const teamId = searchParams.get("teamId");

    if (!assignmentId || !teamId) {
      return NextResponse.json(
        { ok: false, error: "Missing assignmentId or teamId" },
        { status: 400 }
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
        { status: 404 }
      );
    }
    if (!team) {
      return NextResponse.json(
        { ok: false, error: "Team not found" },
        { status: 404 }
      );
    }

    // (optional strict check)
    // if (String(team.class_id) !== String(assignment.class_id)) ...

    // 2) Members (for UI labels)
    const members = await TeamMember.find({ team_id: teamObjectId })
      .populate("student_id", "email first_name last_name")
      .lean();

    // 3) Submissions for this assignment + team
    const Submission = mongoose.model("Submission");
    const submissions = await Submission.find({
      assignment_id: assignmentObjectId,
      team_id: teamObjectId,
    }).lean();

    const submissionIds = submissions.map((s: any) => s._id);

    // 4) Load responses/comments/praises for those submissions
    const Response = mongoose.model("Response");
    const Comment = mongoose.model("Comment");
    const Praise = mongoose.model("Praise");

    const [responses, comments, praises, questions] = await Promise.all([
      submissionIds.length
        ? Response.find({ submission_id: { $in: submissionIds } }).lean()
        : [],
      submissionIds.length
        ? Comment.find({ submission_id: { $in: submissionIds } }).lean()
        : [],
      submissionIds.length
        ? Praise.find({ submission_id: { $in: submissionIds } }).lean()
        : [],
      Question.find({}).select({ qid: 1, title: 1, description: 1 }).lean(),
    ]);

    // 5) question map (ONLY 4 fields)
    const questionMap = new Map<string, QuestionInfo>();
    for (const q of questions as any[]) {
      const qId = String(q._id);
      questionMap.set(qId, {
        question_id: qId,
        qid: q.qid ?? null,
        title: q.title ?? null,
        description: q.description ?? null,
      });
    }

    const qInfo = (qid: any): QuestionInfo => {
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
    const responsesBySub = new Map<string, any[]>();
    for (const r of responses as any[]) {
      const k = String(r.submission_id);
      if (!responsesBySub.has(k)) responsesBySub.set(k, []);
      responsesBySub.get(k)!.push(r);
    }

    const commentsBySub = new Map<string, any[]>();
    for (const c of comments as any[]) {
      const k = String(c.submission_id);
      if (!commentsBySub.has(k)) commentsBySub.set(k, []);
      commentsBySub.get(k)!.push(c);
    }

    const praisesBySub = new Map<string, any[]>();
    for (const p of praises as any[]) {
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
        members: members.map((m: any) => ({
          user_id: String(m.student_id?._id),
          email: m.student_id?.email,
          first_name: m.student_id?.first_name,
          last_name: m.student_id?.last_name,
        })),
      },
      submissions: submissions.map((s: any) => {
        const sid = String(s._id);
        return {
          submission_id: sid,
          from_student_id: String(s.student_id),
          submitted_at: s.submitted_at,
          single_lock: s.single_lock,

          responses: (responsesBySub.get(sid) || []).map((r: any) => ({
            response_id: String(r._id),
            from_student_id: String(r.from_student_id),
            to_student_id: String(r.to_student_id),
            question_id: String(r.question_id),
            question: qInfo(r.question_id), // ✅ only 4 fields
            rating: r.rating,
          })),

          comments: (commentsBySub.get(sid) || []).map((c: any) => ({
            comment_id: String(c._id),
            from_student_id: String(c.from_student_id),
            to_student_id: String(c.to_student_id),
            question_id: String(c.question_id),
            question: qInfo(c.question_id), // ✅ only 4 fields
            comment_text: c.comment_text,
          })),

          praises: (praisesBySub.get(sid) || []).map((p: any) => ({
            praise_id: String(p._id),
            from_student_id: String(p.from_student_id),
            to_student_id: String(p.to_student_id),
            question_id: p.question_id ? String(p.question_id) : null,
            question: p.question_id ? qInfo(p.question_id) : null, // ✅ only 4 fields
            praise_text: p.praise_text,
          })),
        };
      }),
    });
  } catch (e: any) {
    console.error("assignment-detail error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
