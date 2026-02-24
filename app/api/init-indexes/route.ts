import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

import Team from "@/models/Team";
import AssignmentTeam from "@/models/AssignmentTeam";
import TeamMember from "@/models/TeamMember";
import Submission from "@/models/Submission";

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export async function POST() {
  try {
    await connectDB();

    await Promise.all([
      Team.init(),
      AssignmentTeam.init(),
      TeamMember.init(),
      Submission.init(),
    ]);

    return NextResponse.json({ ok: true, message: "Indexes ensured" });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(e) },
      { status: 500 },
    );
  }
}
