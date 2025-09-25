// models/Assignment.ts
import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema({
  // code: { type: String, unique: true, index: true },
  class_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
    index: true,
  },
  title: { type: String, required: true },
  start_date: { type: Date, required: true },
  due_date: { type: Date, required: true },
  allow_multiple_submissions: { type: String, enum: ["Y", "N"], default: "N" },
  version: { type: Number, default: 1 },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  active: { type: String, enum: ["Y", "N"], default: "Y" },
});
AssignmentSchema.index({ class_id: 1, start_date: -1 });

// AssignmentSchema.pre("save", async function () {
//   if (this.isNew && !this.code) this.code = await getNextCode("A");
// });

export default mongoose.models.Assignment ||
  mongoose.model("Assignment", AssignmentSchema);
