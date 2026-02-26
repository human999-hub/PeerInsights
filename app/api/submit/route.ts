import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Types } from "mongoose";
import { submitReview } from "@/services/submitReview";

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

function toObjectId(v: unknown, fieldName: string): Types.ObjectId {
  if (v instanceof Types.ObjectId) return v;
  if (typeof v === "string" && Types.ObjectId.isValid(v))
    return new Types.ObjectId(v);
  throw new Error(`Invalid ObjectId for ${fieldName}`);
}

type RatingIn = {
  to_student_id: string;
  question_id: string;
  rating: number;
};

type CommentIn = {
  to_student_id: string;
  question_id: string;
  comment_text: string;
};

type PraiseIn = {
  to_student_id: string;
  question_id?: string;
  praise_text: string;
};

type SubmitBody = {
  assignment_id: string;
  team_id: string;
  from_student_id: string;
  ratings?: RatingIn[];
  comments?: CommentIn[];
  praises?: PraiseIn[];
};

type RatingOut = Omit<RatingIn, "to_student_id" | "question_id"> & {
  to_student_id: Types.ObjectId;
  question_id: Types.ObjectId;
};

type CommentOut = Omit<CommentIn, "to_student_id" | "question_id"> & {
  to_student_id: Types.ObjectId;
  question_id: Types.ObjectId;
};

type PraiseOut = Omit<PraiseIn, "to_student_id" | "question_id"> & {
  to_student_id: Types.ObjectId;
  question_id?: Types.ObjectId;
};

type SubmitPayload = {
  assignment_id: Types.ObjectId;
  team_id: Types.ObjectId;
  from_student_id: Types.ObjectId;
  ratings: RatingOut[];
  comments: CommentOut[];
  praises: PraiseOut[];
};

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = (await req.json()) as SubmitBody;

    const payload: SubmitPayload = {
      assignment_id: toObjectId(body.assignment_id, "assignment_id"),
      team_id: toObjectId(body.team_id, "team_id"),
      from_student_id: toObjectId(body.from_student_id, "from_student_id"),

      ratings: (body.ratings ?? []).map((r) => ({
        ...r,
        to_student_id: toObjectId(r.to_student_id, "ratings.to_student_id"),
        question_id: toObjectId(r.question_id, "ratings.question_id"),
      })),

      comments: (body.comments ?? []).map((c) => ({
        ...c,
        to_student_id: toObjectId(c.to_student_id, "comments.to_student_id"),
        question_id: toObjectId(c.question_id, "comments.question_id"),
      })),

      praises: (body.praises ?? []).map((p) => ({
        ...p,
        to_student_id: toObjectId(p.to_student_id, "praises.to_student_id"),
        question_id: p.question_id
          ? toObjectId(p.question_id, "praises.question_id")
          : undefined,
      })),
    };

    const result = await submitReview(payload);
    return NextResponse.json(result);
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(e) },
      { status: 400 },
    );
  }
}
