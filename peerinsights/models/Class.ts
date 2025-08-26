// models/Class.ts
import mongoose from "mongoose";

const ClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  instructor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  term: { type: String, enum: ["Fall", "Spring", "Summer"], required: true },
  year: { type: Number, min: 2000, max: 2100, required: true },
  created_at: { type: Date, default: Date.now },
});
ClassSchema.index({ instructor_id: 1, year: -1, term: 1 });

export default mongoose.models.Class || mongoose.model("Class", ClassSchema);
