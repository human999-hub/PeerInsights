// models/Response.ts
import mongoose from "mongoose";

const ResponseSchema = new mongoose.Schema({
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
  question_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
    index: true,
  },
  rating: { type: Number, min: 1, max: 5, required: true },
});

export default mongoose.models.Response ||
  mongoose.model("Response", ResponseSchema);
