// models/Class.ts
import mongoose from "mongoose";
// import { getNextCode } from "@/lib/codes";

const ClassSchema = new mongoose.Schema({
  // code: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  section: { type: String, required: true, index: true },
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
// ClassSchema.pre("save", async function () {
//   if (this.isNew && !this.code) this.code = await getNextCode("CL");
// });

export default mongoose.models.Class || mongoose.model("Class", ClassSchema);
