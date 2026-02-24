import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { fetchForm } from "@/services/fetchForm";

type FormBody = {
  student_email?: string;
  team_number?: string;
};

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = (await req.json()) as FormBody;
    const student_email = body.student_email;
    const team_number = body.team_number;

    if (!student_email || !team_number) {
      return NextResponse.json(
        { ok: false, error: "Missing student_email or team_number" },
        { status: 400 },
      );
    }

    const data = await fetchForm({ student_email, team_number });
    return NextResponse.json({ ok: true, ...data });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(e) },
      { status: 400 },
    );
  }
}
