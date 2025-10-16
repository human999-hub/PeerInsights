import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import Team from "@/models/Team";
import Assignment from "@/models/Assignment";
import AssignmentTeam from "@/models/AssignmentTeam";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      instructor_email,
      section,
      assignment_name,
      assignment_start_date,
      assignment_end_date,
    } = body;

    // 1️⃣ Validate input
    if (
      !instructor_email ||
      !section ||
      !assignment_name ||
      !assignment_start_date ||
      !assignment_end_date
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 2️⃣ Find instructor
    const instructor = await User.findOne({
      email: instructor_email,
      role: "instructor",
    });
    if (!instructor)
      return NextResponse.json(
        { ok: false, error: "Instructor not found" },
        { status: 404 }
      );

    // 3️⃣ Find class for this instructor and section
    const klass = await Class.findOne({
      instructor_id: instructor._id,
      section,
    });
    if (!klass)
      return NextResponse.json(
        { ok: false, error: "Class not found for this section" },
        { status: 404 }
      );

    // 4️⃣ Create Assignment
    const assignment = await Assignment.create({
      class_id: klass._id,
      title: assignment_name,
      start_date: new Date(assignment_start_date),
      due_date: new Date(assignment_end_date),
      created_by: instructor._id,
      version: 1,
      active: "Y",
    });

    // 5️⃣ Fetch all current teams in this class
    const teams = await Team.find({ class_id: klass._id });
    if (teams.length === 0)
      console.warn(`No teams found for class ${klass.name}`);

    // 6️⃣ Link each team to the assignment in AssignmentTeam
    for (const team of teams) {
      await AssignmentTeam.create({
        assignment_id: assignment._id,
        team_id: team._id,
      });
    }

    // 7️⃣ Populate teams for response
    const assignmentTeams = await AssignmentTeam.find({
      assignment_id: assignment._id,
    })
      .populate({
        path: "team_id",
        populate: {
          path: "class_id",
          model: "Class",
        },
      })
      .lean();

    // 8️⃣ Prepare response payload
    const formattedTeams = assignmentTeams.map((at: any) => ({
      team_id: at.team_id._id,
      team_number: at.team_id.team_number,
      class_section: at.team_id.class_id.section,
    }));

    return NextResponse.json({
      ok: true,
      message: "Assignment created successfully",
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        start_date: assignment.start_date,
        due_date: assignment.due_date,
        class_id: klass._id,
        section: klass.section,
        instructor_email: instructor.email,
        teams: formattedTeams,
      },
    });
  } catch (e: any) {
    console.error("Error creating assignment:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
