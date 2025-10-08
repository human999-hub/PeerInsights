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

// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/mongodb";
// import { Types } from "mongoose";
// import { submitReview } from "@/services/submitReview";
// import Assignment from "@/models/Assignment";
// import Team from "@/models/Team";
// import User from "@/models/User";
// import Question from "@/models/Question";
// import { resolveId } from "@/lib/resolveId";

// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const body = await req.json();

//     const payload = { ...body };

//     // Accept ObjectId or human code
//     payload.assignment_id = await resolveId(
//       Assignment as any,
//       payload.assignment_id,
//       "code"
//     );
//     payload.team_id = await resolveId(Team as any, payload.team_id, "code");
//     payload.from_student_id = await resolveId(
//       User as any,
//       payload.from_student_id,
//       "code"
//     );

//     payload.ratings = (payload.ratings || []).map(async (r: any) => ({
//       ...r,
//       to_student_id: await resolveId(User as any, r.to_student_id, "code"),
//       question_id: await resolveId(Question as any, r.question_id, "qid"),
//     }));
//     payload.comments = (payload.comments || []).map(async (c: any) => ({
//       ...c,
//       to_student_id: await resolveId(User as any, c.to_student_id, "code"),
//       question_id: await resolveId(Question as any, c.question_id, "qid"),
//     }));
//     payload.praises = (payload.praises || []).map(async (p: any) => ({
//       ...p,
//       to_student_id: await resolveId(User as any, p.to_student_id, "code"),
//       question_id: p.question_id
//         ? await resolveId(Question as any, p.question_id, "qid")
//         : undefined,
//     }));

//     // wait for all async maps
//     payload.ratings = await Promise.all(payload.ratings);
//     payload.comments = await Promise.all(payload.comments);
//     payload.praises = await Promise.all(payload.praises);

//     const result = await submitReview(payload);
//     return NextResponse.json(result);
//   } catch (e: any) {
//     return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
//   }
// }
