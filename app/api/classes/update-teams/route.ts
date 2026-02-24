// app/api/classes/update-teams/route.ts
// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/mongodb";
// import Class from "@/models/Class";
// import Team from "@/models/Team";
// import TeamMember from "@/models/TeamMember";
// import User from "@/models/User";

// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const body = await req.json();

//     const {
//       instructor_email,
//       instructor_first_name,
//       instructor_last_name,
//       courseName,
//       term,
//       year,
//       class: section,
//       groups = [],
//     } = body;

//     // 1️⃣ Ensure instructor exists
//     let instructor = await User.findOne({ email: instructor_email });
//     if (!instructor) {
//       instructor = await User.create({
//         email: instructor_email,
//         first_name: instructor_first_name,
//         last_name: instructor_last_name,
//         role: "instructor",
//       });
//     }

//     // 2️⃣ Find existing class
//     const className = `${term}_${year}_${courseName}`;
//     const klass = await Class.findOne({ name: className, section });
//     if (!klass) throw new Error("Class not found. Please create it first.");

//     // 3️⃣ Load existing teams for this class
//     const existingTeams = await Team.find({ class_id: klass._id });
//     const existingTeamNames = existingTeams.map((t) => t.team_number);

//     // 4️⃣ Handle removals (teams omitted in payload)
//     const incomingGroupNames = groups.map((g) => g.groupName);
//     const teamsToRemove = existingTeams.filter(
//       (t) => !incomingGroupNames.includes(t.team_number)
//     );
//     for (const team of teamsToRemove) {
//       await TeamMember.deleteMany({ team_id: team._id });
//       await Team.deleteOne({ _id: team._id });
//     }

//     // 5️⃣ Add or update teams
//     for (const group of groups) {
//       let team = await Team.findOne({
//         class_id: klass._id,
//         team_number: group.groupName,
//       });

//       // Create team if not exist
//       if (!team) {
//         team = await Team.create({
//           class_id: klass._id,
//           team_number: group.groupName,
//         });
//       }

//       // Handle team members
//       const existingMembers = await TeamMember.find({ team_id: team._id });
//       const existingMemberIds = new Set(
//         existingMembers.map((tm) => String(tm.student_id))
//       );

//       // Build a new set from payload
//       const newMemberIds: string[] = [];

//       for (const memberName of group.members) {
//         const [first_name, ...rest] = memberName.split(" ");
//         const last_name = rest.join(" ") || "";
//         const email =
//           memberName.toLowerCase().replace(/\s+/g, "") + "@example.com";

//         let student = await User.findOne({ email });
//         if (!student) {
//           student = await User.create({
//             email,
//             first_name,
//             last_name,
//             role: "student",
//           });
//         }
//         newMemberIds.push(String(student._id));

//         // Add missing member
//         if (!existingMemberIds.has(String(student._id))) {
//           await TeamMember.create({
//             team_id: team._id,
//             student_id: student._id,
//           });
//         }
//       }

//       // Remove members who are no longer in the group
//       for (const member of existingMembers) {
//         if (!newMemberIds.includes(String(member.student_id))) {
//           await TeamMember.deleteOne({ _id: member._id });
//         }
//       }
//     }

//     // 6️⃣ Return full updated data
//     const updatedTeams = await Team.find({ class_id: klass._id }).lean();
//     for (const team of updatedTeams) {
//       const members = await TeamMember.find({ team_id: team._id })
//         .populate("student_id")
//         .lean();

//       team.members = members.map((m) => ({
//         user_id: m.student_id._id,
//         email: m.student_id.email,
//         first_name: m.student_id.first_name,
//         last_name: m.student_id.last_name,
//         role: m.student_id.role,
//       }));
//     }

//     return NextResponse.json({
//       ok: true,
//       message: "Teams successfully updated",
//       class: {
//         _id: klass._id,
//         name: klass.name,
//         section: klass.section,
//         term: klass.term,
//         year: klass.year,
//         instructor: {
//           _id: instructor._id,
//           email: instructor.email,
//           first_name: instructor.first_name,
//           last_name: instructor.last_name,
//         },
//         teams: updatedTeams,
//       },
//     });
//   } catch (e: any) {
//     return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
//   }
// }

//OLD Code

// import { NextResponse } from "next/server";
// import { connectDB } from "@/lib/mongodb";
// import Class from "@/models/Class";
// import Team from "@/models/Team";
// import TeamMember from "@/models/TeamMember";
// import User from "@/models/User";

// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const body = await req.json();

//     const {
//       instructor_email,
//       instructor_first_name,
//       instructor_last_name,
//       courseName,
//       term,
//       year,
//       class: section,
//       groups = [],
//     } = body;

//     // 1️⃣ Ensure instructor
//     let instructor = await User.findOne({ email: instructor_email });
//     if (!instructor) {
//       instructor = await User.create({
//         email: instructor_email,
//         first_name: instructor_first_name,
//         last_name: instructor_last_name,
//         role: "instructor",
//       });
//     }

//     // 2️⃣ Find class
//     const className = `${term}_${year}_${courseName}`;
//     const klass = await Class.findOne({ name: className, section });
//     if (!klass) throw new Error("Class not found. Please create it first.");

//     // 3️⃣ Get existing teams
//     const existingTeams = await Team.find({ class_id: klass._id });
//     const incomingGroupNames = groups.map((g) => g.groupName);

//     // 4️⃣ Remove missing teams
//     const teamsToRemove = existingTeams.filter(
//       (t) => !incomingGroupNames.includes(t.team_number)
//     );
//     for (const team of teamsToRemove) {
//       await TeamMember.deleteMany({ team_id: team._id });
//       await Team.deleteOne({ _id: team._id });
//     }

//     // 5️⃣ Add / update teams
//     for (const group of groups) {
//       let team = await Team.findOne({
//         class_id: klass._id,
//         team_number: group.groupName,
//       });
//       if (!team)
//         team = await Team.create({
//           class_id: klass._id,
//           team_number: group.groupName,
//         });

//       const existingMembers = await TeamMember.find({ team_id: team._id });
//       const existingMemberIds = new Set(
//         existingMembers.map((tm) => String(tm.student_id))
//       );
//       const newMemberIds: string[] = [];

//       for (const memberName of group.members) {
//         const [first_name, ...rest] = memberName.split(" ");
//         const last_name = rest.join(" ") || "";
//         const email =
//           memberName.toLowerCase().replace(/\s+/g, "") + "@example.com";

//         let student = await User.findOne({ email });
//         if (!student) {
//           student = await User.create({
//             email,
//             first_name,
//             last_name,
//             role: "student",
//           });
//         }
//         newMemberIds.push(String(student._id));

//         if (!existingMemberIds.has(String(student._id))) {
//           await TeamMember.create({
//             team_id: team._id,
//             student_id: student._id,
//           });
//         }
//       }

//       // remove those not in payload
//       for (const member of existingMembers) {
//         if (!newMemberIds.includes(String(member.student_id))) {
//           await TeamMember.deleteOne({ _id: member._id });
//         }
//       }
//     }

//     // 6️⃣ Clean orphaned users (students not in any TeamMember)
//     const allStudentIds = (await User.find({ role: "student" })).map((u) =>
//       String(u._id)
//     );
//     const activeIds = (await TeamMember.find({})).map((tm) =>
//       String(tm.student_id)
//     );
//     const orphanIds = allStudentIds.filter((id) => !activeIds.includes(id));
//     if (orphanIds.length > 0)
//       await User.deleteMany({ _id: { $in: orphanIds } });

//     // 7️⃣ Response
//     const updatedTeams = await Team.find({ class_id: klass._id }).lean();
//     for (const team of updatedTeams) {
//       const members = await TeamMember.find({ team_id: team._id })
//         .populate("student_id")
//         .lean();
//       team.members = members.map((m) => ({
//         user_id: m.student_id._id,
//         email: m.student_id.email,
//         first_name: m.student_id.first_name,
//         last_name: m.student_id.last_name,
//         role: m.student_id.role,
//       }));
//     }

//     return NextResponse.json({
//       ok: true,
//       message: "Teams successfully updated.",
//       class: {
//         _id: klass._id,
//         name: klass.name,
//         section: klass.section,
//         term: klass.term,
//         year: klass.year,
//         instructor: {
//           _id: instructor._id,
//           email: instructor.email,
//           first_name: instructor.first_name,
//           last_name: instructor.last_name,
//         },
//         teams: updatedTeams,
//       },
//     });
//   } catch (e: any) {
//     return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
//   }
// }

// OLD CODE 2

// app/api/classes/update-teams/route.ts
// import { NextResponse } from "next/server";
// import mongoose from "mongoose";
// import { connectDB } from "@/lib/mongodb";
// import Class from "@/models/Class";
// import Team from "@/models/Team";
// import TeamMember from "@/models/TeamMember";
// import Assignment from "@/models/Assignment";
// import AssignmentTeam from "@/models/AssignmentTeam";
// import User from "@/models/User";
// import { splitName } from "@/lib/names";
// import "@/models/Submission";
// import "@/models/Response";
// import "@/models/Comment";
// import "@/models/Praise";

// /**
//  * Helper: get active assignments for a class (start <= now <= due)
//  */
// async function getActiveAssignments(
//   classId: mongoose.Types.ObjectId,
//   session: mongoose.ClientSession
// ) {
//   const now = new Date();
//   return Assignment.find({
//     class_id: classId,
//     start_date: { $lte: now },
//     due_date: { $gte: now },
//   }).session(session);
// }

// /**
//  * Helper: fetch submissions _ids for a set of assignments
//  */

// async function getSubmissionIdsForAssignments(
//   assignmentIds: mongoose.Types.ObjectId[],
//   session: mongoose.ClientSession
// ) {
//   const subs = await mongoose
//     .model("Submission")
//     .find({ assignment_id: { $in: assignmentIds } }, { _id: 1 })
//     .session(session);
//   return subs.map((s) => s._id as mongoose.Types.ObjectId);
// }

// export async function POST(req: Request) {
//   await connectDB();
//   console.log("Registered models:", Object.keys(mongoose.models));

//   const session = await mongoose.startSession();
//   try {
//     const body = await req.json();
//     const {
//       instructor_email,
//       instructor_first_name,
//       instructor_last_name,
//       courseName,
//       term,
//       year,
//       class: section,
//       groups = [],
//     } = body;

//     // Validate minimal input
//     if (!instructor_email || !courseName || !term || !year || !section) {
//       return NextResponse.json(
//         { ok: false, error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     await session.withTransaction(async () => {
//       // 1) Ensure instructor
//       let instructor = await User.findOne({ email: instructor_email }).session(
//         session
//       );
//       if (!instructor) {
//         instructor = await User.create(
//           [
//             {
//               email: instructor_email,
//               first_name: instructor_first_name || "Instructor",
//               last_name: instructor_last_name || "",
//               role: "instructor",
//             },
//           ],
//           { session }
//         ).then((d) => d[0]);
//       } else if (instructor.role !== "instructor") {
//         instructor.role = "instructor";
//         await instructor.save({ session });
//       }

//       // 2) Find class
//       const className = `${term}_${year}_${courseName}`;
//       const klass = await Class.findOne({
//         name: className,
//         section,
//         instructor_id: instructor._id,
//       }).session(session);

//       if (!klass) throw new Error("Class not found. Please create it first.");

//       // 3) Load existing teams and members for this class
//       const existingTeams = await Team.find({ class_id: klass._id }).session(
//         session
//       );
//       const existingByName = new Map(
//         existingTeams.map((t) => [t.team_number, t])
//       );
//       const incomingGroupNames: string[] = groups.map((g: any) => g.groupName);

//       // Build membership map: teamId -> Set<studentId>
//       const teamMemberDocs = await TeamMember.find({
//         team_id: { $in: existingTeams.map((t) => t._id) },
//       }).session(session);

//       const membersByTeam = new Map<string, Set<string>>(); // teamId -> set(userId)
//       for (const tm of teamMemberDocs) {
//         const key = String(tm.team_id);
//         if (!membersByTeam.has(key)) membersByTeam.set(key, new Set());
//         membersByTeam.get(key)!.add(String(tm.student_id));
//       }

//       // Track students impacted (removed from a team or moved)
//       const changedStudentIds = new Set<string>();

//       // 4) Delete teams that are missing in incoming payload
//       const teamsToRemove = existingTeams.filter(
//         (t) => !incomingGroupNames.includes(t.team_number)
//       );
//       for (const team of teamsToRemove) {
//         const teamIdStr = String(team._id);

//         // collect members for this team as changed students
//         const memberIds = membersByTeam.get(teamIdStr) || new Set<string>();
//         memberIds.forEach((id) => changedStudentIds.add(id));

//         // delete team members
//         await TeamMember.deleteMany({ team_id: team._id }).session(session);

//         // remove assignment links for active assignments
//         const activeAssignments = await getActiveAssignments(
//           klass._id,
//           session
//         );
//         const activeAssignmentIds = activeAssignments.map(
//           (a) => a._id as mongoose.Types.ObjectId
//         );
//         if (activeAssignmentIds.length) {
//           await AssignmentTeam.deleteMany({
//             assignment_id: { $in: activeAssignmentIds },
//             team_id: team._id,
//           }).session(session);
//         }

//         // finally delete the team
//         await Team.deleteOne({ _id: team._id }).session(session);
//       }

//       // 5) Upsert teams & reconcile members for incoming groups
//       for (const group of groups) {
//         const groupName = group.groupName;
//         const members: string[] = Array.isArray(group.members)
//           ? group.members
//           : [];

//         // upsert team
//         let team = existingByName.get(groupName);
//         if (!team) {
//           team = await Team.create(
//             [
//               {
//                 class_id: klass._id,
//                 team_number: groupName,
//               },
//             ],
//             { session }
//           ).then((d) => d[0]);
//         }

//         // existing member ids for this team
//         const teamKey = String(team._id);
//         const existingMemberIds =
//           membersByTeam.get(teamKey) || new Set<string>();

//         // build new member ids
//         const newMemberIds: string[] = [];
//         for (const memberName of members) {
//           const { first_name, last_name } = splitName(memberName);
//           const email =
//             memberName.trim().toLowerCase().replace(/\s+/g, "") +
//             "@example.com";
//           let student = await User.findOne({ email }).session(session);
//           if (!student) {
//             student = await User.create(
//               [
//                 {
//                   email,
//                   first_name,
//                   last_name,
//                   role: "student",
//                 },
//               ],
//               { session }
//             ).then((d) => d[0]);
//           } else if (student.role !== "student") {
//             student.role = "student";
//             await student.save({ session });
//           }
//           newMemberIds.push(String(student._id));

//           // add missing membership
//           if (!existingMemberIds.has(String(student._id))) {
//             await TeamMember.create(
//               [
//                 {
//                   team_id: team._id,
//                   student_id: student._id,
//                 },
//               ],
//               { session }
//             );

//             // This member has *moved into* this team (or newly added)
//             // If they were in some other team for this class, treat as "changed"
//             // We mark them changed to wipe any active in-progress review data for safety
//             changedStudentIds.add(String(student._id));
//           }
//         }

//         // remove members that are no longer in the team
//         for (const oldId of existingMemberIds) {
//           if (!newMemberIds.includes(oldId)) {
//             await TeamMember.deleteOne({
//               team_id: team._id,
//               student_id: new mongoose.Types.ObjectId(oldId),
//             }).session(session);
//             // this student changed
//             changedStudentIds.add(oldId);
//           }
//         }

//         // ensure this team is linked to any active assignments
//         const activeAssignments = await getActiveAssignments(
//           klass._id,
//           session
//         );
//         for (const a of activeAssignments) {
//           const exists = await AssignmentTeam.findOne({
//             assignment_id: a._id,
//             team_id: team._id,
//           }).session(session);
//           if (!exists) {
//             await AssignmentTeam.create(
//               [
//                 {
//                   assignment_id: a._id,
//                   team_id: team._id,
//                 },
//               ],
//               { session }
//             );
//           }
//         }
//       }

//       // 6) If there are active assignments: purge review data for changed students
//       const activeAssignments = await getActiveAssignments(klass._id, session);
//       if (activeAssignments.length > 0 && changedStudentIds.size > 0) {
//         const activeAssignmentIds = activeAssignments.map(
//           (a) => a._id as mongoose.Types.ObjectId
//         );

//         // a) delete ALL submissions made by changed students for active assignments
//         const changedObjectIds = Array.from(changedStudentIds).map(
//           (id) => new mongoose.Types.ObjectId(id)
//         );
//         const subsByChanged = await mongoose
//           .model("Submission")
//           .find(
//             {
//               assignment_id: { $in: activeAssignmentIds },
//               student_id: { $in: changedObjectIds },
//             },
//             { _id: 1 }
//           )
//           .session(session);
//         const subsByChangedIds = subsByChanged.map(
//           (s) => s._id as mongoose.Types.ObjectId
//         );

//         if (subsByChangedIds.length) {
//           await mongoose
//             .model("Response")
//             .deleteMany({ submission_id: { $in: subsByChangedIds } })
//             .session(session);
//           await mongoose
//             .model("Comment")
//             .deleteMany({ submission_id: { $in: subsByChangedIds } })
//             .session(session);
//           await mongoose
//             .model("Praise")
//             .deleteMany({ submission_id: { $in: subsByChangedIds } })
//             .session(session);
//           await mongoose
//             .model("Submission")
//             .deleteMany({ _id: { $in: subsByChangedIds } })
//             .session(session);
//         }

//         // b) delete ANY peer artifacts that *target* a changed student, even if created by others
//         //    To scope correctly, we only touch artifacts whose submission belongs to an active assignment in this class.
//         const allActiveSubmissionIds = await getSubmissionIdsForAssignments(
//           activeAssignmentIds,
//           session
//         );
//         if (allActiveSubmissionIds.length) {
//           await mongoose
//             .model("Response")
//             .deleteMany({
//               submission_id: { $in: allActiveSubmissionIds },
//               to_student_id: { $in: changedObjectIds },
//             })
//             .session(session);
//           await mongoose
//             .model("Comment")
//             .deleteMany({
//               submission_id: { $in: allActiveSubmissionIds },
//               to_student_id: { $in: changedObjectIds },
//             })
//             .session(session);
//           await mongoose
//             .model("Praise")
//             .deleteMany({
//               submission_id: { $in: allActiveSubmissionIds },
//               to_student_id: { $in: changedObjectIds },
//             })
//             .session(session);
//         }
//       }

//       // 7) Clean orphaned students (no memberships anywhere)
//       //    (Won't delete instructors; Won't delete students that still belong to some other class)
//       const studentIds = await User.find(
//         { role: "student" },
//         { _id: 1 }
//       ).session(session);
//       const studentIdStrs = new Set(studentIds.map((u) => String(u._id)));
//       const activeMemberStudentIds = await TeamMember.find(
//         {},
//         { student_id: 1 }
//       ).session(session);
//       const activeMemberSet = new Set(
//         activeMemberStudentIds.map((tm) => String(tm.student_id))
//       );
//       const orphanIds = Array.from(studentIdStrs).filter(
//         (id) => !activeMemberSet.has(id)
//       );
//       if (orphanIds.length > 0) {
//         await User.deleteMany({
//           _id: { $in: orphanIds.map((id) => new mongoose.Types.ObjectId(id)) },
//           role: "student",
//         }).session(session);
//       }
//     });

//     // 8) Build response (outside transaction for simplicity)
//     // const {
//     //   instructor_email,
//     //   courseName,
//     //   term,
//     //   year,
//     //   class: section,
//     // } = await req.json().catch(() => ({})); // re-read body is not allowed; ignore

//     // Safer: re-query minimal fields for response
//     const instructor = await User.findOne({
//       email: body?.instructor_email,
//       role: "instructor",
//     });
//     const klass = await Class.findOne({
//       name: `${body?.term}_${body?.year}_${body?.courseName}`,
//       section: body?.class,
//       instructor_id: instructor?._id,
//     });
//     const teams = klass ? await Team.find({ class_id: klass._id }).lean() : [];

//     const fullTeams = [];
//     for (const team of teams) {
//       const members = await TeamMember.find({ team_id: team._id })
//         .populate("student_id")
//         .lean();
//       fullTeams.push({
//         _id: team._id,
//         class_id: team.class_id,
//         team_number: team.team_number,
//         createdAt: team.createdAt,
//         updatedAt: team.updatedAt,
//         members: members.map((m: any) => ({
//           user_id: m.student_id._id,
//           email: m.student_id.email,
//           first_name: m.student_id.first_name,
//           last_name: m.student_id.last_name,
//           role: m.student_id.role,
//         })),
//       });
//     }

//     return NextResponse.json({
//       ok: true,
//       message:
//         "Teams updated (transactional) and active assignments synchronized.",
//       class: klass
//         ? {
//             _id: klass._id,
//             name: klass.name,
//             section: klass.section,
//             term: klass.term,
//             year: klass.year,
//             instructor: instructor
//               ? {
//                   _id: instructor._id,
//                   email: instructor.email,
//                   first_name: instructor.first_name,
//                   last_name: instructor.last_name,
//                 }
//               : undefined,
//             teams: fullTeams,
//           }
//         : undefined,
//     });
//   } catch (e: any) {
//     console.error("update-teams error:", e);
//     return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
//   } finally {
//     session.endSession();
//   }
// }

// app/api/classes/update-teams/route.ts
// app/api/classes/update-teams/route.ts
import { NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";

import Class from "@/models/Class";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import Assignment from "@/models/Assignment";
import AssignmentTeam from "@/models/AssignmentTeam";
import User from "@/models/User";
import { splitName } from "@/lib/names";

// Ensure these models are registered with Mongoose
import "@/models/Submission";
import "@/models/Response";
import "@/models/Comment";
import "@/models/Praise";

type UserRole = "student" | "instructor" | "ta";

type IncomingGroup = {
  groupName: string; // you are using string team_number like "Group_1"
  members: string[];
};

type UpdateTeamsBody = {
  instructor_email?: string;
  // these may exist in payload but we won't destructure them (avoids unused-vars warning)
  instructor_first_name?: string;
  instructor_last_name?: string;
  courseName?: string;
  term?: string;
  year?: string | number;
  class?: string; // section
  groups?: IncomingGroup[];
};

type PopulatedStudent = {
  _id: Types.ObjectId;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
};

type TeamMemberPopulated = {
  student_id: PopulatedStudent;
};

type AssignmentIdOnly = { _id: Types.ObjectId };

type SubmissionIdOnly = { _id: Types.ObjectId };

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

/**
 * Helper: get active assignments for a class (start <= now <= due)
 */
async function getActiveAssignments(
  classId: Types.ObjectId,
  session: mongoose.ClientSession,
): Promise<AssignmentIdOnly[]> {
  const now = new Date();
  const docs = await Assignment.find({
    class_id: classId,
    start_date: { $lte: now },
    due_date: { $gte: now },
  })
    .select({ _id: 1 })
    .session(session)
    .lean();

  return docs as unknown as AssignmentIdOnly[];
}

/**
 * Helper: fetch submission _ids for a set of assignments
 */
async function getSubmissionIdsForAssignments(
  assignmentIds: Types.ObjectId[],
  session: mongoose.ClientSession,
): Promise<Types.ObjectId[]> {
  const SubmissionModel = mongoose.model("Submission");

  const subs = (await SubmissionModel.find(
    { assignment_id: { $in: assignmentIds } },
    { _id: 1 },
  )
    .session(session)
    .lean()) as unknown as SubmissionIdOnly[];

  return subs.map((s) => s._id);
}

export async function POST(req: Request) {
  await connectDB();

  const session = await mongoose.startSession();

  try {
    const body = (await req.json()) as UpdateTeamsBody;

    const instructor_email = body.instructor_email;
    const courseName = body.courseName;
    const term = body.term;
    const year = body.year;
    const section = body.class;
    const groups: IncomingGroup[] = Array.isArray(body.groups)
      ? body.groups
      : [];

    // 1) Validate minimal input
    if (!instructor_email || !courseName || !term || !year || !section) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    await session.withTransaction(async () => {
      // 2) Find the staff user (must already exist & be instructor/ta)
      const staff = await User.findOne({ email: instructor_email }).session(
        session,
      );

      if (!staff) {
        throw new Error(
          "User not found. Please register as instructor/TA before updating teams.",
        );
      }

      if (staff.role !== "instructor" && staff.role !== "ta") {
        throw new Error(
          "Only instructors or TAs are allowed to update class teams.",
        );
      }

      // 3) Find class (by course + term + year + section)
      const className = `${term}_${year}_${courseName}`;
      const klass = await Class.findOne({ name: className, section }).session(
        session,
      );

      if (!klass) {
        throw new Error(
          "Class not found for this course/term/section. Please create it first.",
        );
      }

      // 4) Load existing teams and members for this class
      const existingTeams = await Team.find({ class_id: klass._id }).session(
        session,
      );

      const existingByName = new Map<string, (typeof existingTeams)[number]>(
        existingTeams.map((t) => [String(t.team_number), t]),
      );

      const incomingGroupNames: string[] = groups.map((g) => g.groupName);

      // Build membership map: teamId -> Set<studentId>
      const teamMemberDocs = await TeamMember.find({
        team_id: { $in: existingTeams.map((t) => t._id) },
      }).session(session);

      const membersByTeam = new Map<string, Set<string>>();
      for (const tm of teamMemberDocs) {
        const key = String(tm.team_id);
        if (!membersByTeam.has(key)) membersByTeam.set(key, new Set());
        membersByTeam.get(key)!.add(String(tm.student_id));
      }

      const changedStudentIds = new Set<string>();

      // 5) Delete teams that are missing in incoming payload
      const teamsToRemove = existingTeams.filter(
        (t) => !incomingGroupNames.includes(String(t.team_number)),
      );

      for (const team of teamsToRemove) {
        const teamIdStr = String(team._id);

        const memberIds = membersByTeam.get(teamIdStr) || new Set<string>();
        memberIds.forEach((id) => changedStudentIds.add(id));

        await TeamMember.deleteMany({ team_id: team._id }).session(session);

        const activeAssignments = await getActiveAssignments(
          klass._id,
          session,
        );
        const activeAssignmentIds = activeAssignments.map((a) => a._id);

        if (activeAssignmentIds.length) {
          await AssignmentTeam.deleteMany({
            assignment_id: { $in: activeAssignmentIds },
            team_id: team._id,
          }).session(session);
        }

        await Team.deleteOne({ _id: team._id }).session(session);
      }

      // 6) Upsert teams & reconcile members for incoming groups
      for (const group of groups) {
        const groupName = group.groupName;
        const members: string[] = Array.isArray(group.members)
          ? group.members
          : [];

        let team = existingByName.get(groupName);
        if (!team) {
          const created = await Team.create(
            [{ class_id: klass._id, team_number: groupName }],
            { session },
          );
          team = created[0];
        }

        const teamKey = String(team._id);
        const existingMemberIds =
          membersByTeam.get(teamKey) || new Set<string>();

        const newMemberIds: string[] = [];

        for (const memberName of members) {
          const { first_name, last_name } = splitName(memberName);
          const email =
            memberName.trim().toLowerCase().replace(/\s+/g, "") +
            "@example.com";

          let student = await User.findOne({ email }).session(session);
          if (!student) {
            const created = await User.create(
              [{ email, first_name, last_name, role: "student" }],
              { session },
            );
            student = created[0];
          } else if (student.role !== "student") {
            student.role = "student";
            await student.save({ session });
          }

          newMemberIds.push(String(student._id));

          if (!existingMemberIds.has(String(student._id))) {
            await TeamMember.create(
              [{ team_id: team._id, student_id: student._id }],
              { session },
            );
            changedStudentIds.add(String(student._id));
          }
        }

        // Remove members no longer in the team
        for (const oldId of existingMemberIds) {
          if (!newMemberIds.includes(oldId)) {
            await TeamMember.deleteOne({
              team_id: team._id,
              student_id: new Types.ObjectId(oldId),
            }).session(session);

            changedStudentIds.add(oldId);
          }
        }

        // Ensure this team is linked to any active assignments
        const activeAssignments = await getActiveAssignments(
          klass._id,
          session,
        );

        for (const a of activeAssignments) {
          const exists = await AssignmentTeam.findOne({
            assignment_id: a._id,
            team_id: team._id,
          }).session(session);

          if (!exists) {
            await AssignmentTeam.create(
              [{ assignment_id: a._id, team_id: team._id }],
              { session },
            );
          }
        }
      }

      // 7) Purge review data for changed students in active assignments
      const activeAssignments = await getActiveAssignments(klass._id, session);

      if (activeAssignments.length > 0 && changedStudentIds.size > 0) {
        const activeAssignmentIds = activeAssignments.map((a) => a._id);

        const changedObjectIds = Array.from(changedStudentIds).map(
          (id) => new Types.ObjectId(id),
        );

        const SubmissionModel = mongoose.model("Submission");
        const ResponseModel = mongoose.model("Response");
        const CommentModel = mongoose.model("Comment");
        const PraiseModel = mongoose.model("Praise");

        const subsByChanged = (await SubmissionModel.find(
          {
            assignment_id: { $in: activeAssignmentIds },
            student_id: { $in: changedObjectIds },
          },
          { _id: 1 },
        )
          .session(session)
          .lean()) as unknown as SubmissionIdOnly[];

        const subsByChangedIds = subsByChanged.map((s) => s._id);

        if (subsByChangedIds.length) {
          await ResponseModel.deleteMany({
            submission_id: { $in: subsByChangedIds },
          }).session(session);

          await CommentModel.deleteMany({
            submission_id: { $in: subsByChangedIds },
          }).session(session);

          await PraiseModel.deleteMany({
            submission_id: { $in: subsByChangedIds },
          }).session(session);

          await SubmissionModel.deleteMany({
            _id: { $in: subsByChangedIds },
          }).session(session);
        }

        // Delete peer artifacts that target changed students
        const allActiveSubmissionIds = await getSubmissionIdsForAssignments(
          activeAssignmentIds,
          session,
        );

        if (allActiveSubmissionIds.length) {
          await ResponseModel.deleteMany({
            submission_id: { $in: allActiveSubmissionIds },
            to_student_id: { $in: changedObjectIds },
          }).session(session);

          await CommentModel.deleteMany({
            submission_id: { $in: allActiveSubmissionIds },
            to_student_id: { $in: changedObjectIds },
          }).session(session);

          await PraiseModel.deleteMany({
            submission_id: { $in: allActiveSubmissionIds },
            to_student_id: { $in: changedObjectIds },
          }).session(session);
        }
      }

      // 8) Clean orphaned students (no memberships anywhere)
      const studentIds = await User.find({ role: "student" }, { _id: 1 })
        .session(session)
        .lean();

      const studentIdStrs = new Set(studentIds.map((u) => String(u._id)));

      const activeMemberStudentIds = await TeamMember.find(
        {},
        { student_id: 1 },
      )
        .session(session)
        .lean();

      const activeMemberSet = new Set(
        activeMemberStudentIds.map((tm) => String(tm.student_id)),
      );

      const orphanIds = Array.from(studentIdStrs).filter(
        (id) => !activeMemberSet.has(id),
      );

      if (orphanIds.length > 0) {
        await User.deleteMany({
          _id: { $in: orphanIds.map((id) => new Types.ObjectId(id)) },
          role: "student",
        }).session(session);
      }
    });

    // 9) Build response (outside transaction)
    const instructor = await User.findOne({ email: instructor_email });

    const klass = await Class.findOne({
      name: `${term}_${year}_${courseName}`,
      section,
    });

    const teams = klass ? await Team.find({ class_id: klass._id }).lean() : [];

    const fullTeams = await Promise.all(
      teams.map(async (team) => {
        const members = (await TeamMember.find({ team_id: team._id })
          .populate("student_id")
          .lean()) as unknown as TeamMemberPopulated[];

        return {
          _id: team._id,
          class_id: team.class_id,
          team_number: team.team_number,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
          members: members.map((m) => ({
            user_id: m.student_id._id,
            email: m.student_id.email,
            first_name: m.student_id.first_name,
            last_name: m.student_id.last_name,
            role: m.student_id.role,
          })),
        };
      }),
    );

    return NextResponse.json({
      ok: true,
      message:
        "Teams updated (transactional) and active assignments synchronized.",
      class: klass
        ? {
            _id: klass._id,
            name: klass.name,
            section: klass.section,
            term: klass.term,
            year: klass.year,
            instructor: instructor
              ? {
                  _id: instructor._id,
                  email: instructor.email,
                  first_name: instructor.first_name,
                  last_name: instructor.last_name,
                  role: instructor.role,
                }
              : undefined,
            teams: fullTeams,
          }
        : undefined,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(e) },
      { status: 500 },
    );
  } finally {
    session.endSession();
  }
}
