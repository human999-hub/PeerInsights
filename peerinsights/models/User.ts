// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  //code: { type: String, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  first_name: String,
  last_name: String,
  role: { type: String, enum: ["student", "instructor", "ta"], required: true },
  password_hash: String,
  created_at: { type: Date, default: Date.now },
});

// UserSchema.pre("save", async function () {
//   if (this.isNew && !this.code) {
//     this.code = await getNextCode("U");
//   }
// });

UserSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const userId = this._id;
    await mongoose.model("TeamMember").deleteMany({ student_id: userId });
    next();
  }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
