// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  first_name: String,
  last_name: String,
  role: { type: String, enum: ["student", "instructor"], required: true },
  password_hash: String,
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
