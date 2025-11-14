// models/Comment.ts
import mongoose from "mongoose";
// import { getNextCode } from "@/lib/codes";

const CommentSchema = new mongoose.Schema({
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
  // This references the SCALE question that was rated
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
    index: true,
  },
  //comment_text: { type: String, required: true },
  comment_text: { type: String },
});

// CommentSchema.pre("save", async function () {
//   if (this.isNew && !this.code) this.code = await getNextCode("CMT");
// });

export default mongoose.models.Comment ||
  mongoose.model("Comment", CommentSchema);
