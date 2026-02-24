// models/AssignmentTeam.ts
import mongoose from "mongoose";
// import { getNextCode } from "@/lib/codes";
const AssignmentTeamSchema = new mongoose.Schema({
  // code: { type: String, unique: true, index: true },
  assignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
});

// UNIQUE (assignment_id, team_id)
AssignmentTeamSchema.index({ assignment_id: 1, team_id: 1 }, { unique: true });
AssignmentTeamSchema.index({ team_id: 1 });

// AssignmentTeamSchema.pre("save", async function () {
//   if (this.isNew && !this.code) this.code = await getNextCode("AT");
// });

export default mongoose.models.AssignmentTeam ||
  mongoose.model("AssignmentTeam", AssignmentTeamSchema);
