// app/api/initIndexes.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

import Team from "@/models/Team";
import AssignmentTeam from "@/models/AssignmentTeam";
import TeamMember from "@/models/TeamMember";
import Submission from "@/models/Submission";

export async function POST() {
  try {
    await connectDB();
    // Build the schema-defined indexes if they don't exist yet
    await Promise.all([
      Team.init(),
      AssignmentTeam.init(),
      TeamMember.init(),
      Submission.init(),
    ]);
    return NextResponse.json({ ok: true, message: "Indexes ensured" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
