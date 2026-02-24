// app/api/assignments/create/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import Team from "@/models/Team";
import Assignment from "@/models/Assignment";
import AssignmentTeam from "@/models/AssignmentTeam";
import User from "@/models/User";

// Ensure model registration (optional but fine)
import "@/models/Submission";
import "@/models/Response";
import "@/models/Comment";
import "@/models/Praise";

type CreateAssignmentBody = {
  instructor_email: string;
  section: string;
  assignment_name: string;
  assignment_start_date: string; // ISO string expected
  assignment_end_date: string; // ISO string expected
};

type PopulatedAssignmentTeamLean = {
  team_id: {
    _id: unknown;
    team_number: string;
    class_id: {
      section: string;
    };
  };
};

function isValidDate(d: Date) {
  return !Number.isNaN(d.getTime());
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body: unknown = await req.json();

    // Validate shape
    const b = body as Partial<CreateAssignmentBody>;

    const instructor_email = b.instructor_email;
    const section = b.section;
    const assignment_name = b.assignment_name;
    const assignment_start_date = b.assignment_start_date;
    const assignment_end_date = b.assignment_end_date;

    if (
      !isNonEmptyString(instructor_email) ||
      !isNonEmptyString(section) ||
      !isNonEmptyString(assignment_name) ||
      !isNonEmptyString(assignment_start_date) ||
      !isNonEmptyString(assignment_end_date)
    ) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const startDate = new Date(assignment_start_date);
    const endDate = new Date(assignment_end_date);

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid assignment_start_date or assignment_end_date",
        },
        { status: 400 },
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        {
          ok: false,
          error: "assignment_end_date must be after assignment_start_date",
        },
        { status: 400 },
      );
    }

    // 2️⃣ Find instructor/TA
    const instructor = await User.findOne({
      email: instructor_email,
      role: { $in: ["instructor", "ta"] },
    }).lean<{ _id: unknown; email: string }>();

    if (!instructor) {
      return NextResponse.json(
        { ok: false, error: "Instructor not found" },
        { status: 404 },
      );
    }

    // 3️⃣ Find class for this instructor and section
    const klass = await Class.findOne({
      instructor_id: instructor._id,
      section,
    }).lean<{ _id: unknown; name: string; section: string }>();

    if (!klass) {
      return NextResponse.json(
        { ok: false, error: "Class not found for this section" },
        { status: 404 },
      );
    }

    // 4️⃣ Create Assignment
    const assignment = await Assignment.create({
      class_id: klass._id,
      title: assignment_name,
      start_date: startDate,
      due_date: endDate,
      created_by: instructor._id,
      version: 1,
      active: "Y",
    });

    // 5️⃣ Fetch all teams in this class
    const teams = await Team.find({ class_id: klass._id }).lean<{
      _id: unknown;
    }>();

    if (teams.length === 0) {
      console.warn(`No teams found for class ${klass.name}`);
    }

    // 6️⃣ Link each team to the assignment
    // (Can be parallelized)
    await Promise.all(
      teams.map((t) =>
        AssignmentTeam.create({
          assignment_id: assignment._id,
          team_id: t._id,
        }),
      ),
    );

    // 7️⃣ Populate teams for response
    const assignmentTeams = await AssignmentTeam.find({
      assignment_id: assignment._id,
    })
      .populate({
        path: "team_id",
        populate: {
          path: "class_id",
          model: "Class",
          select: "section",
        },
        select: "team_number class_id",
      })
      .lean<PopulatedAssignmentTeamLean[]>();

    // 8️⃣ Prepare response payload
    const formattedTeams = assignmentTeams
      .filter((at) => at.team_id && at.team_id.class_id)
      .map((at) => ({
        team_id: String(at.team_id._id),
        team_number: at.team_id.team_number,
        class_section: at.team_id.class_id.section,
      }));

    return NextResponse.json({
      ok: true,
      message: "Assignment created successfully",
      assignment: {
        _id: String(assignment._id),
        title: assignment.title,
        start_date: assignment.start_date,
        due_date: assignment.due_date,
        class_id: String(klass._id),
        section: klass.section,
        instructor_email: instructor.email,
        teams: formattedTeams,
      },
    });
  } catch (e: unknown) {
    console.error("Error creating assignment:", e);
    const message = e instanceof Error ? e.message : "Internal server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
