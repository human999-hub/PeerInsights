// models/Question.ts
import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
   qid: { type: String, unique: true, index: true }, // <— add this
  title: { type: String, required: true },
  category: String,
  description: String,
  question_type: {
    type: String,
    enum: ["scale", "text", "praise"],
    required: true,
    default: "scale",
  },
  scale_min: Number,
  scale_max: Number,
  // e.g. { "1": "desc for 1", "2": "...", "5": "..." }
  scale_labels: { type: Map, of: String },
  // e.g. "Is there anything you want to praise about {{name}}?"
  placeholder_template: String,
  // e.g. [1,2,3] → text box appears after scale questions 1–3
  applies_to: [Number],
});
QuestionSchema.index({ title: 1 });

export default mongoose.models.Question ||
  mongoose.model("Question", QuestionSchema);
