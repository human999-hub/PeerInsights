import mongoose from "mongoose";

export async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return; // already connected
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}
