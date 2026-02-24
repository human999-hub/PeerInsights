// models/Team.ts
import mongoose from "mongoose";
// import { getNextCode } from "@/lib/codes";

const TeamSchema = new mongoose.Schema(
  {
    //code: { type: String, unique: true, index: true }, // 👈 NEW

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

// TeamSchema.pre("save", async function () {
//   if (this.isNew && !this.code) this.code = await getNextCode("T");
// });

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);
