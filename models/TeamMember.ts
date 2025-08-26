// models/TeamMember.ts
import mongoose from "mongoose";

const TeamMemberSchema = new mongoose.Schema({
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

export default mongoose.models.TeamMember ||
  mongoose.model("TeamMember", TeamMemberSchema);
