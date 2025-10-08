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

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Class from "@/models/Class";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      instructor_email,
      instructor_first_name,
      instructor_last_name,
      courseName,
      term,
      year,
      class: section,
      groups = [],
    } = body;

    // 1️⃣ Ensure instructor
    let instructor = await User.findOne({ email: instructor_email });
    if (!instructor) {
      instructor = await User.create({
        email: instructor_email,
        first_name: instructor_first_name,
        last_name: instructor_last_name,
        role: "instructor",
      });
    }

    // 2️⃣ Find class
    const className = `${term}_${year}_${courseName}`;
    const klass = await Class.findOne({ name: className, section });
    if (!klass) throw new Error("Class not found. Please create it first.");

    // 3️⃣ Get existing teams
    const existingTeams = await Team.find({ class_id: klass._id });
    const incomingGroupNames = groups.map((g) => g.groupName);

    // 4️⃣ Remove missing teams
    const teamsToRemove = existingTeams.filter(
      (t) => !incomingGroupNames.includes(t.team_number)
    );
    for (const team of teamsToRemove) {
      await TeamMember.deleteMany({ team_id: team._id });
      await Team.deleteOne({ _id: team._id });
    }

    // 5️⃣ Add / update teams
    for (const group of groups) {
      let team = await Team.findOne({
        class_id: klass._id,
        team_number: group.groupName,
      });
      if (!team)
        team = await Team.create({
          class_id: klass._id,
          team_number: group.groupName,
        });

      const existingMembers = await TeamMember.find({ team_id: team._id });
      const existingMemberIds = new Set(
        existingMembers.map((tm) => String(tm.student_id))
      );
      const newMemberIds: string[] = [];

      for (const memberName of group.members) {
        const [first_name, ...rest] = memberName.split(" ");
        const last_name = rest.join(" ") || "";
        const email =
          memberName.toLowerCase().replace(/\s+/g, "") + "@example.com";

        let student = await User.findOne({ email });
        if (!student) {
          student = await User.create({
            email,
            first_name,
            last_name,
            role: "student",
          });
        }
        newMemberIds.push(String(student._id));

        if (!existingMemberIds.has(String(student._id))) {
          await TeamMember.create({
            team_id: team._id,
            student_id: student._id,
          });
        }
      }

      // remove those not in payload
      for (const member of existingMembers) {
        if (!newMemberIds.includes(String(member.student_id))) {
          await TeamMember.deleteOne({ _id: member._id });
        }
      }
    }

    // 6️⃣ Clean orphaned users (students not in any TeamMember)
    const allStudentIds = (await User.find({ role: "student" })).map((u) =>
      String(u._id)
    );
    const activeIds = (await TeamMember.find({})).map((tm) =>
      String(tm.student_id)
    );
    const orphanIds = allStudentIds.filter((id) => !activeIds.includes(id));
    if (orphanIds.length > 0)
      await User.deleteMany({ _id: { $in: orphanIds } });

    // 7️⃣ Response
    const updatedTeams = await Team.find({ class_id: klass._id }).lean();
    for (const team of updatedTeams) {
      const members = await TeamMember.find({ team_id: team._id })
        .populate("student_id")
        .lean();
      team.members = members.map((m) => ({
        user_id: m.student_id._id,
        email: m.student_id.email,
        first_name: m.student_id.first_name,
        last_name: m.student_id.last_name,
        role: m.student_id.role,
      }));
    }

    return NextResponse.json({
      ok: true,
      message: "Teams successfully updated.",
      class: {
        _id: klass._id,
        name: klass.name,
        section: klass.section,
        term: klass.term,
        year: klass.year,
        instructor: {
          _id: instructor._id,
          email: instructor.email,
          first_name: instructor.first_name,
          last_name: instructor.last_name,
        },
        teams: updatedTeams,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
