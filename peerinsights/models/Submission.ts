// models/Submission.ts

import mongoose from "mongoose";
// import { getNextCode } from "@/lib/codes";

const SubmissionSchema = new mongoose.Schema({
  //code: { type: String, unique: true, index: true }, // 👈 NEW

  assignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
    index: true,
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
    index: true,
  },
  // set to 'S' when multiples NOT allowed → enables partial unique index
  single_lock: { type: String },
  submitted_at: { type: Date, default: Date.now },
});

// Uniqueness when single_lock exists (one submission per (assignment, student))
SubmissionSchema.index(
  { assignment_id: 1, student_id: 1, single_lock: 1 },
  { unique: true, partialFilterExpression: { single_lock: { $exists: true } } }
);

// SubmissionSchema.pre("save", async function () {
//   if (this.isNew && !this.code) this.code = await getNextCode("SUB");
// });

export default mongoose.models.Submission ||
  mongoose.model("Submission", SubmissionSchema);
