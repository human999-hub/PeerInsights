import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import mongoose, { Types } from "mongoose";

import User from "@/models/User";
import Class from "@/models/Class";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import Assignment from "@/models/Assignment";
import AssignmentTeam from "@/models/AssignmentTeam";

// Ensure these models are registered
import "@/models/Submission";
import "@/models/Response";
import "@/models/Comment";
import "@/models/Praise";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const instructor_email = searchParams.get("instructor_email");

    if (!instructor_email) {
      return NextResponse.json(
        { ok: false, error: "Missing instructor_email" },
        { status: 400 }
      );
    }

    // 1) Find staff user
    const staff = await User.findOne({
      email: instructor_email,
      role: { $in: ["instructor", "ta"] },
    }).lean();

    if (!staff) {
      return NextResponse.json(
        { ok: false, error: "Instructor/TA not found" },
        { status: 404 }
      );
    }

    // 2) Find classes owned by this instructor_id
    // NOTE: With your current schema, classes are tied to instructor_id only.
    // If you want TAs to see classes too, you need a ClassStaff mapping table.
    const classes = await Class.find({ instructor_id: staff._id })
      .sort({ year: -1, term: 1, section: 1 })
      .lean();

    if (!classes.length) {
      return NextResponse.json({
        ok: true,
        instructor: staff,
        classes: [],
        note:
          staff.role === "ta"
            ? "No classes found. Current schema only links classes to instructor_id. Add a ClassStaff mapping to support TA visibility."
            : "No classes found for this instructor.",
      });
    }

    const classIds = classes.map((c) => c._id);

    // 3) Load teams for all classes
    const teams = await Team.find({ class_id: { $in: classIds } }).lean();
    const teamIds = teams.map((t) => t._id);

    // 4) Load team members for all teams
    const teamMembers = await TeamMember.find({ team_id: { $in: teamIds } })
      .populate("student_id", "email first_name last_name role")
      .lean();

    // 5) Load assignments for all classes
    const assignments = await Assignment.find({ class_id: { $in: classIds } })
      .sort({ start_date: -1, _id: -1 })
      .lean();
    const assignmentIds = assignments.map((a) => a._id);

    // 6) AssignmentTeam links
    const assignmentTeams = assignmentIds.length
      ? await AssignmentTeam.find({
          assignment_id: { $in: assignmentIds },
        }).lean()
      : [];

    // 7) Submissions for these assignments
    const Submission = mongoose.model("Submission");
    const submissions = assignmentIds.length
      ? await Submission.find({ assignment_id: { $in: assignmentIds } }).lean()
      : [];
    const submissionIds = submissions.map((s: any) => s._id);

    // 8) Responses / Comments / Praises for these submissions
    const Response = mongoose.model("Response");
    const Comment = mongoose.model("Comment");
    const Praise = mongoose.model("Praise");

    const [responses, comments, praises] = await Promise.all([
      submissionIds.length
        ? Response.find({ submission_id: { $in: submissionIds } }).lean()
        : [],
      submissionIds.length
        ? Comment.find({ submission_id: { $in: submissionIds } }).lean()
        : [],
      submissionIds.length
        ? Praise.find({ submission_id: { $in: submissionIds } }).lean()
        : [],
    ]);

    // ----------------------------
    // Build fast lookup maps
    // ----------------------------
    const teamsByClass = new Map<string, any[]>();
    for (const t of teams) {
      const key = String(t.class_id);
      if (!teamsByClass.has(key)) teamsByClass.set(key, []);
      teamsByClass.get(key)!.push(t);
    }

    const membersByTeam = new Map<string, any[]>();
    for (const tm of teamMembers) {
      const key = String(tm.team_id);
      if (!membersByTeam.has(key)) membersByTeam.set(key, []);
      membersByTeam.get(key)!.push(tm);
    }

    const assignmentsByClass = new Map<string, any[]>();
    for (const a of assignments) {
      const key = String(a.class_id);
      if (!assignmentsByClass.has(key)) assignmentsByClass.set(key, []);
      assignmentsByClass.get(key)!.push(a);
    }

    const assignmentTeamsByAssignment = new Map<string, string[]>();
    for (const at of assignmentTeams) {
      const key = String(at.assignment_id);
      if (!assignmentTeamsByAssignment.has(key))
        assignmentTeamsByAssignment.set(key, []);
      assignmentTeamsByAssignment.get(key)!.push(String(at.team_id));
    }

    const submissionsByAssignment = new Map<string, any[]>();
    for (const s of submissions) {
      const key = String(s.assignment_id);
      if (!submissionsByAssignment.has(key))
        submissionsByAssignment.set(key, []);
      submissionsByAssignment.get(key)!.push(s);
    }

    const responsesBySubmission = new Map<string, any[]>();
    for (const r of responses) {
      const key = String(r.submission_id);
      if (!responsesBySubmission.has(key)) responsesBySubmission.set(key, []);
      responsesBySubmission.get(key)!.push(r);
    }

    const commentsBySubmission = new Map<string, any[]>();
    for (const c of comments) {
      const key = String(c.submission_id);
      if (!commentsBySubmission.has(key)) commentsBySubmission.set(key, []);
      commentsBySubmission.get(key)!.push(c);
    }

    const praisesBySubmission = new Map<string, any[]>();
    for (const p of praises) {
      const key = String(p.submission_id);
      if (!praisesBySubmission.has(key)) praisesBySubmission.set(key, []);
      praisesBySubmission.get(key)!.push(p);
    }

    // ----------------------------
    // Final response shape
    // ----------------------------
    const result = classes.map((klass) => {
      const classId = String(klass._id);

      const classTeams = (teamsByClass.get(classId) || []).map((t) => {
        const teamId = String(t._id);
        const members = (membersByTeam.get(teamId) || []).map((tm) => {
          const u: any = tm.student_id;
          return {
            user_id: String(u?._id),
            email: u?.email,
            first_name: u?.first_name,
            last_name: u?.last_name,
            role: u?.role,
          };
        });

        return {
          team_id: teamId,
          team_number: t.team_number,
          members,
        };
      });

      const classAssignments = (assignmentsByClass.get(classId) || []).map(
        (a) => {
          const assignmentId = String(a._id);
          const linkedTeamIds =
            assignmentTeamsByAssignment.get(assignmentId) || [];

          const assignmentSubmissions = (
            submissionsByAssignment.get(assignmentId) || []
          ).map((s: any) => {
            const submissionId = String(s._id);
            return {
              submission_id: submissionId,
              assignment_id: String(s.assignment_id),
              team_id: String(s.team_id),
              from_student_id: String(s.student_id),
              submitted_at: s.submitted_at,
              single_lock: s.single_lock,

              responses: (responsesBySubmission.get(submissionId) || []).map(
                (r: any) => ({
                  response_id: String(r._id),
                  from_student_id: String(r.from_student_id),
                  to_student_id: String(r.to_student_id),
                  question_id: String(r.question_id),
                  rating: r.rating,
                })
              ),

              comments: (commentsBySubmission.get(submissionId) || []).map(
                (c: any) => ({
                  comment_id: String(c._id),
                  from_student_id: String(c.from_student_id),
                  to_student_id: String(c.to_student_id),
                  question_id: String(c.question_id),
                  comment_text: c.comment_text,
                })
              ),

              praises: (praisesBySubmission.get(submissionId) || []).map(
                (p: any) => ({
                  praise_id: String(p._id),
                  from_student_id: String(p.from_student_id),
                  to_student_id: String(p.to_student_id),
                  question_id: p.question_id ? String(p.question_id) : null,
                  praise_text: p.praise_text,
                })
              ),
            };
          });

          return {
            assignment_id: assignmentId,
            title: a.title,
            start_date: a.start_date,
            due_date: a.due_date,
            allow_multiple_submissions: a.allow_multiple_submissions,
            active: a.active,
            linked_team_ids: linkedTeamIds,
            submissions: assignmentSubmissions,
          };
        }
      );

      return {
        class_id: classId,
        name: klass.name,
        section: klass.section,
        term: klass.term,
        year: klass.year,

        teams: classTeams,
        assignments: classAssignments,
      };
    });

    return NextResponse.json({
      ok: true,
      instructor: {
        _id: String(staff._id),
        email: staff.email,
        first_name: staff.first_name,
        last_name: staff.last_name,
        role: staff.role,
      },
      classes: result,
    });
  } catch (e: any) {
    console.error("instructor-summary error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
