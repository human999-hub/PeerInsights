// models/TeamMember.ts
import mongoose from "mongoose";
// import { getNextCode } from "@/lib/codes";

const TeamMemberSchema = new mongoose.Schema({
  //code: { type: String, unique: true, index: true }, // 👈 NEW

  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  added_at: { type: Date, default: Date.now },
});

// UNIQUE (team_id, student_id)
TeamMemberSchema.index({ team_id: 1, student_id: 1 }, { unique: true });
TeamMemberSchema.index({ student_id: 1 });

// TeamMemberSchema.pre("save", async function () {
//   if (this.isNew && !this.code) this.code = await getNextCode("TM");
// });

export default mongoose.models.TeamMember ||
  mongoose.model("TeamMember", TeamMemberSchema);
