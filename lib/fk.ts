// lib/fk.js
import type { ClientSession, Model } from "mongoose";

export async function assertExists<T>(
  ModelCtor: Model<T>,
  id: any,
  message: string,
  session?: ClientSession
) {
  if (!id) throw new Error(message || "Missing id");
  const doc = await ModelCtor.findOne({ _id: id })
    .session(session || null)
    .select({ _id: 1 });
  if (!doc) throw new Error(message || `${ModelCtor.modelName} not found`);
}
