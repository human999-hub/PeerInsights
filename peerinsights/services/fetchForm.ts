// services/fetchForm.ts
import User from "@/models/User";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import AssignmentTeam from "@/models/AssignmentTeam";
import Assignment from "@/models/Assignment";
import Class from "@/models/Class";
import Question from "@/models/Question";

export async function fetchForm({
  student_email,
  team_number,
}: {
  student_email: string;
  team_number: string;
}) {
  const student = await User.findOne({ email: student_email });
  if (!student) throw new Error("Student not found");

  // Teams for this student with that team_number
  const memberships = await TeamMember.aggregate([
    { $match: { student_id: student._id } },
    {
      $lookup: {
        from: "teams",
        localField: "team_id",
        foreignField: "_id",
        as: "team",
      },
    },
    { $unwind: "$team" },
    { $match: { "team.team_number": team_number } },
    { $project: { team_id: 1, class_id: "$team.class_id" } },
  ]);
  if (!memberships.length)
    throw new Error("Team not found for this student & number");

  const teamIds = memberships.map((m) => m.team_id);
  const now = new Date();

  // Latest open assignment linked to those teams
  const atLinks = await AssignmentTeam.aggregate([
    { $match: { team_id: { $in: teamIds } } },
    {
      $lookup: {
        from: "assignments",
        localField: "assignment_id",
        foreignField: "_id",
        as: "a",
      },
    },
    { $unwind: "$a" },
    { $match: { "a.start_date": { $lte: now }, "a.due_date": { $gte: now } } },
    { $sort: { "a.start_date": -1, "a._id": -1 } },
    { $limit: 1 },
  ]);
  if (!atLinks.length) {
    return { is_active: false, message: "No open assignment right now." };
  }

  const { assignment_id, team_id } = atLinks[0];
  const assignment = atLinks[0].a;
  const klass = await Class.findById(assignment.class_id);

  const tMembers = await TeamMember.find({ team_id }).populate({
    path: "student_id",
    select: "first_name last_name email",
  });

  const questions = await Question.find({}).sort({ _id: 1 });

  return {
    ok: true,
    is_active: true,
    student: {
      user_id: String(student._id),
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
    },
    class: {
      class_id: String(klass._id),
      name: klass.name,
      term: klass.term,
      year: klass.year,
    },
    assignment: {
      assignment_id: String(assignment_id),
      title: assignment.title,
      start_date: assignment.start_date,
      due_date: assignment.due_date,
    },
    team: {
      team_id: String(team_id),
      team_number,
      members: tMembers.map((tm) => ({
        user_id: String(tm.student_id._id),
        first_name: tm.student_id.first_name,
        last_name: tm.student_id.last_name,
        email: tm.student_id.email,
      })),
    },
    questions: questions.map((q) => ({
      question_id: String(q._id),
      qid: q.qid ?? null, // 👈 added (Q1..Q19)
      title: q.title,
      question_type: q.question_type,
      scale_min: q.scale_min,
      scale_max: q.scale_max,
      scale_labels: q.scale_labels,
      placeholder_template: q.placeholder_template,
    })),
  };
}
