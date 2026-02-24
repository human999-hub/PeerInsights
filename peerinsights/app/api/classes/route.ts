// app/api/classes/route.ts
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
//       groups = [], // expect teams here
//     } = body;

//     // 1. Ensure Instructor
//     let instructor = await User.findOne({ email: instructor_email });
//     if (!instructor) {
//       instructor = await User.create({
//         email: instructor_email,
//         first_name: instructor_first_name,
//         last_name: instructor_last_name,
//         role: "instructor",
//       });
//     }

//     // 2. Create/Find Class
//     const className = `${term}_${year}_${courseName}`;
//     let klass = await Class.findOne({ name: className, section });
//     if (!klass) {
//       klass = await Class.create({
//         name: className,
//         section,
//         term,
//         year,
//         instructor_id: instructor._id,
//       });
//     }

//     // 3. Create/Find Teams and Members
//     for (const group of groups) {
//       let team = await Team.findOne({
//         class_id: klass._id,
//         team_number: group.groupName,
//       });
//       if (!team) {
//         team = await Team.create({
//           class_id: klass._id,
//           team_number: group.groupName,
//         });
//       }

//       // Ensure members
//       for (const memberName of group.members) {
//         // Split into first and last names (naive split)
//         const [first_name, ...lastParts] = memberName.split(" ");
//         const last_name = lastParts.join(" ") || "";

//         let student = await User.findOne({
//           email: memberName.toLowerCase().replace(/\s+/g, "") + "@example.com",
//         });
//         if (!student) {
//           student = await User.create({
//             email:
//               memberName.toLowerCase().replace(/\s+/g, "") + "@example.com",
//             first_name,
//             last_name,
//             role: "student",
//           });
//         }

//         const exists = await TeamMember.findOne({
//           team_id: team._id,
//           student_id: student._id,
//         });
//         if (!exists) {
//           await TeamMember.create({
//             team_id: team._id,
//             student_id: student._id,
//           });
//         }
//       }
//     }

//     // 4. Fetch Teams + Members for response
//     const teams = await Team.find({ class_id: klass._id }).lean();
//     for (const team of teams) {
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

//     // 5. Return full payload
//     return NextResponse.json({
//       ok: true,
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
//         teams,
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

    // 2️⃣ Create/find class
    const className = `${term}_${year}_${courseName}`;
    let klass = await Class.findOne({ name: className, section });
    if (!klass) {
      klass = await Class.create({
        name: className,
        section,
        term,
        year,
        instructor_id: instructor._id,
      });
    }

    // 3️⃣ Create teams and members
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

        const exists = await TeamMember.findOne({
          team_id: team._id,
          student_id: student._id,
        });
        if (!exists)
          await TeamMember.create({
            team_id: team._id,
            student_id: student._id,
          });
      }
    }

    // 4️⃣ Build return payload
    const teams = await Team.find({ class_id: klass._id }).lean();
    for (const team of teams) {
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
        teams,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
