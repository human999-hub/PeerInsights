// models/Praise.ts
import mongoose from "mongoose";

const PraiseSchema = new mongoose.Schema({
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
  praise_text: { type: String, required: true },
});

export default mongoose.models.Praise || mongoose.model("Praise", PraiseSchema);
