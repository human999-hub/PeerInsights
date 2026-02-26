// lib/fk.js
import type { ClientSession, Model } from "mongoose";
import { Types } from "mongoose";

type ObjectIdLike = Types.ObjectId | string;

function isObjectIdLike(v: unknown): v is ObjectIdLike {
  return v instanceof Types.ObjectId || typeof v === "string";
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export async function assertExists<T>(
  ModelCtor: Model<T>,
  id: unknown,
  message: string,
  session?: ClientSession,
): Promise<void> {
  if (!id) throw new Error(message || "Missing id");
  if (!isObjectIdLike(id)) throw new Error(message || "Invalid id type");

  const query = ModelCtor.findOne({ _id: id }).select({ _id: 1 });
  if (session) query.session(session);

  const doc = await query.exec();
  if (!doc) throw new Error(message || `${ModelCtor.modelName} not found`);
}
