// services/submitReview.ts
import mongoose, { Types } from "mongoose";
import Assignment from "@/models/Assignment";
import AssignmentTeam from "@/models/AssignmentTeam";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import Question from "@/models/Question";
import Submission from "@/models/Submission";
import Response from "@/models/Response";
import Comment from "@/models/Comment";
import Praise from "@/models/Praise";
import User from "@/models/User";
import { assertExists } from "@/lib/fk";

type OID = Types.ObjectId | string;

type RatingInput = {
  to_student_id: OID;
  question_id: OID;
  rating: number;
};

type CommentInput = {
  to_student_id: OID;
  question_id: OID;
  comment_text?: string;
};

type PraiseInput = {
  to_student_id: OID;
  question_id?: OID;
  praise_text?: string;
};

export type SubmitReviewPayload = {
  assignment_id: Types.ObjectId;
  team_id: Types.ObjectId;
  from_student_id: Types.ObjectId;
  submitted_at?: Date;
  ratings?: RatingInput[];
  comments?: CommentInput[];
  praises?: PraiseInput[];
};

type QuestionDoc = {
  _id: Types.ObjectId;
  question_type: "scale" | "text" | "praise";
  title: string;
  scale_min?: number;
  scale_max?: number;
};

const toStr = (id: OID | undefined | null) => (id ? String(id) : "");

export async function submitReview(payload: SubmitReviewPayload) {
  const {
    assignment_id,
    team_id,
    from_student_id,
    submitted_at,
    ratings = [],
    comments = [],
    praises = [],
  } = payload;

  const session = await mongoose.startSession();
  session.startTransaction({
    readConcern: { level: "majority" },
    writeConcern: { w: "majority" },
  });

  try {
    // 1) FK existence
    await assertExists(
      Assignment as any,
      assignment_id,
      "Assignment not found",
      session
    );
    await assertExists(Team as any, team_id, "Team not found", session);
    await assertExists(
      User as any,
      from_student_id,
      "Student not found",
      session
    );

    // 2) Active by dates
    const assignment = await Assignment.findById(assignment_id).session(
      session
    );
    if (!assignment) throw new Error("Assignment not found");
    const now = new Date();
    if (
      !(
        now >= (assignment.start_date as Date) &&
        now <= (assignment.due_date as Date)
      )
    ) {
      throw new Error("Assignment is not currently active");
    }

    // 3) Team linked to assignment
    const linkExists = await AssignmentTeam.exists({
      assignment_id,
      team_id,
    }).session(session);
    if (!linkExists) throw new Error("Team is not linked to this assignment");

    // 4) Submitter is team member
    const isMember = await TeamMember.exists({
      team_id,
      student_id: from_student_id,
    }).session(session);
    if (!isMember) throw new Error("You are not a member of this team");

    // 5) Ensure all recipients are in same team
    const teamMembers = await TeamMember.find({ team_id })
      .session(session)
      .select("student_id");
    const memberSet = new Set(
      teamMembers.map((m) => toStr(m.student_id as any))
    );

    const allRecipientIds = [
      ...ratings.map((r) => r?.to_student_id).filter(Boolean),
      ...comments.map((c) => c?.to_student_id).filter(Boolean),
      ...praises.map((p) => p?.to_student_id).filter(Boolean),
    ].map(toStr);

    for (const rid of allRecipientIds) {
      if (!memberSet.has(rid))
        throw new Error("One or more recipients are not members of this team");
    }

    // 6) One-submission rule (index-assisted)
    const single_lock =
      assignment.allow_multiple_submissions === "N" ? "S" : undefined;

    // 7) Create submission
    const [submission] = await Submission.create(
      [
        {
          assignment_id,
          student_id: from_student_id,
          team_id,
          single_lock,
          submitted_at: submitted_at || new Date(),
        },
      ],
      { session }
    );
    const submission_id = submission._id as Types.ObjectId;

    // 8) Load questions referenced by ratings/comments
    const qIds = [
      ...new Set([
        ...ratings.map((r) => toStr(r.question_id)),
        ...comments.map((c) => toStr(c.question_id)),
      ]),
    ]
      .filter(Boolean)
      .map((id) => new Types.ObjectId(id));

    const qDocs = qIds.length
      ? await Question.find({ _id: { $in: qIds } }).session(session)
      : [];

    const qMap = new Map<string, QuestionDoc>(
      qDocs.map((q: any) => [
        toStr(q._id),
        {
          _id: q._id,
          question_type: q.question_type,
          title: q.title,
          scale_min: q.scale_min,
          scale_max: q.scale_max,
        },
      ])
    );

    // 9) Insert ratings (validate)
    if (ratings.length) {
      const rows = ratings.map((r) => {
        const q = qMap.get(toStr(r.question_id));
        if (!q)
          throw new Error(
            `Question not found for rating: ${toStr(r.question_id)}`
          );
        if (q.question_type !== "scale")
          throw new Error(`Question is not a scale question: ${q.title}`);
        const min = q.scale_min ?? 1;
        const max = q.scale_max ?? 5;
        if (typeof r.rating !== "number" || r.rating < min || r.rating > max) {
          throw new Error(
            `Rating out of bounds for ${q.title} (${min}-${max})`
          );
        }
        return {
          submission_id,
          from_student_id,
          to_student_id: r.to_student_id,
          question_id: r.question_id,
          rating: r.rating,
        };
      });
      if (rows.length) await Response.insertMany(rows, { session });
    }

    // 10) Insert comments (must reference scale questions they explain)
    if (comments.length) {
      const rows = comments.map((c) => {
        const q = qMap.get(toStr(c.question_id));
        if (!q)
          throw new Error(
            `Question not found for comment: ${toStr(c.question_id)}`
          );
        if (q.question_type !== "scale")
          throw new Error(
            `Comments must reference a scale question. Offending question: ${q.title}`
          );
        return {
          submission_id,
          from_student_id,
          to_student_id: c.to_student_id,
          question_id: c.question_id,
          comment_text: c.comment_text || "",
        };
      });
      if (rows.length) await Comment.insertMany(rows, { session });
    }

    // 11) Insert praises (no self praise)
    if (praises.length) {
      for (const p of praises) {
        if (toStr(p.to_student_id) === toStr(from_student_id)) {
          throw new Error("Cannot praise yourself");
        }
      }
      const rows = praises.map((p) => ({
        submission_id,
        from_student_id,
        to_student_id: p.to_student_id,
        question_id: p.question_id,
        praise_text: p.praise_text || "",
      }));
      if (rows.length) await Praise.insertMany(rows, { session });
    }

    await session.commitTransaction();
    session.endSession();

    return { ok: true, submission_id: toStr(submission_id) };
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}
