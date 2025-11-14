// models/Praise.ts

import mongoose from "mongoose";
// import { getNextCode } from "@/lib/codes";

const PraiseSchema = new mongoose.Schema({
  // code: { type: String, unique: true, index: true }, // 👈 NEW

  submission_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Submission",
    required: true,
    index: true,
  },
  from_student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  to_student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  // optional tie to a praise question in your survey
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
  //praise_text: { type: String, required: true },
  praise_text: { type: String },
});

// PraiseSchema.pre("save", async function () {
//   if (this.isNew && !this.code) this.code = await getNextCode("PR");
// });

export default mongoose.models.Praise || mongoose.model("Praise", PraiseSchema);
