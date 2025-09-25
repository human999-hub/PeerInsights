// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/mongodb";
// import { Types } from "mongoose";
// import { submitReview } from "@/services/submitReview";

// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const body = await req.json();

//     const toId = (v: any) => new Types.ObjectId(v);

//     const payload = body;
//     payload.assignment_id = toId(payload.assignment_id);
//     payload.team_id = toId(payload.team_id);
//     payload.from_student_id = toId(payload.from_student_id);

//     payload.ratings = (payload.ratings || []).map((r: any) => ({
//       ...r,
//       to_student_id: toId(r.to_student_id),
//       question_id: toId(r.question_id),
//     }));
//     payload.comments = (payload.comments || []).map((c: any) => ({
//       ...c,
//       to_student_id: toId(c.to_student_id),
//       question_id: toId(c.question_id),
//     }));
//     payload.praises = (payload.praises || []).map((p: any) => ({
//       ...p,
//       to_student_id: toId(p.to_student_id),
//       question_id: p.question_id ? toId(p.question_id) : undefined,
//     }));

//     const result = await submitReview(payload);
//     return NextResponse.json(result);
//   } catch (e: any) {
//     return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
//   }
// }
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Types } from "mongoose";
import { submitReview } from "@/services/submitReview";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const toId = (v: any) => new Types.ObjectId(v);

    const payload = body;
    payload.assignment_id = toId(payload.assignment_id);
    payload.team_id = toId(payload.team_id);
    payload.from_student_id = toId(payload.from_student_id);

    payload.ratings = (payload.ratings || []).map((r: any) => ({
      ...r,
      to_student_id: toId(r.to_student_id),
      question_id: toId(r.question_id),
    }));
    payload.comments = (payload.comments || []).map((c: any) => ({
      ...c,
      to_student_id: toId(c.to_student_id),
      question_id: toId(c.question_id),
    }));
    payload.praises = (payload.praises || []).map((p: any) => ({
      ...p,
      to_student_id: toId(p.to_student_id),
      question_id: p.question_id ? toId(p.question_id) : undefined,
    }));

    const result = await submitReview(payload);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
