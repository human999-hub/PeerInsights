import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { fetchForm } from "@/services/fetchForm";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { student_email, team_number } = await req.json();
    const data = await fetchForm({ student_email, team_number });
    return NextResponse.json({ ok: true, ...data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
