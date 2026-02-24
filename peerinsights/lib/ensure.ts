// peerInsights/lib/ensure.ts
import User from "@/models/User";
import Team from "@/models/Team";
import TeamMember from "@/models/TeamMember";
import { splitName } from "./names";
import mongoose from "mongoose";

/**
 * Ensures an instructor user exists by email + name.
 */
export async function ensureInstructor(
  email: string,
  first: string,
  last: string
) {
  let u = await User.findOne({ email });
  if (!u) {
    u = await User.create({
      email,
      first_name: first,
      last_name: last,
      role: "instructor",
    });
  } else if (u.role !== "instructor") {
    // keep it simple: we won't downgrade/upgrade roles automatically
    // but you could update here if you want:
    u.role = "instructor";
    await u.save();
  }
  return u;
}

/**
 * Ensures a student user exists. If email is missing, synthesizes one.
 * (Good for dev/testing. In prod, you likely want a real email from CSV.)
 */
export async function ensureStudentByNameOrEmail(
  name: string,
  email?: string,
  sectionHint?: string
) {
  if (email) {
    let u = await User.findOne({ email });
    if (!u) {
      const { first_name, last_name } = splitName(name);
      u = await User.create({
        email,
        first_name,
        last_name,
        role: "student",
      });
    }
    return u;
  }

  // No email—synthesize a stable one from name+section (dev-safe).
  const slug = (name || "").trim().toLowerCase().replace(/\s+/g, ".");
  const sec = (sectionHint || "section").toLowerCase().replace(/\W+/g, "");
  const syntheticEmail = `${slug}+${sec}@example.edu`;

  let u = await User.findOne({ email: syntheticEmail });
  if (!u) {
    const { first_name, last_name } = splitName(name);
    u = await User.create({
      email: syntheticEmail,
      first_name,
      last_name,
      role: "student",
    });
  }
  return u;
}

export async function ensureTeam(
  class_id: mongoose.Types.ObjectId,
  team_number: string
) {
  let team = await Team.findOne({ class_id, team_number });
  if (!team) {
    team = await Team.create({ class_id, team_number });
  }
  return team;
}

export async function ensureMembership(
  team_id: mongoose.Types.ObjectId,
  student_id: mongoose.Types.ObjectId
) {
  const exists = await TeamMember.exists({ team_id, student_id });
  if (!exists) {
    await TeamMember.create({ team_id, student_id });
  }
}
