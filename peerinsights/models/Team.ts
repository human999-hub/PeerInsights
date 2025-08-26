// models/Team.ts
import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
  {
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    team_number: { type: String, required: true },
  },
  { timestamps: true }
);

// UNIQUE (class_id, team_number)
TeamSchema.index({ class_id: 1, team_number: 1 }, { unique: true });

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);
