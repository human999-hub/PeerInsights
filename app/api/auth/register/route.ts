// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

type StaffRole = "instructor" | "ta";

type RegisterBody = {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  role?: StaffRole;
};

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body: RegisterBody = (await req.json()) as RegisterBody;

    const { first_name, last_name, email, password, role } = body;

    // 1️⃣ Basic validation
    if (!first_name || !last_name || !email || !password || !role) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 2️⃣ Only allow instructor/ta from this endpoint
    if (role !== "instructor" && role !== "ta") {
      return NextResponse.json(
        { ok: false, error: "Role must be 'instructor' or 'ta'" },
        { status: 400 },
      );
    }

    // 3️⃣ Check if user already exists
    const existing = await User.findOne({ email }).select({ _id: 1 }).lean();
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "User with this email already exists" },
        { status: 400 },
      );
    }

    // 4️⃣ Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // 5️⃣ Create user
    const user = await User.create({
      first_name,
      last_name,
      email,
      role,
      password_hash,
    });

    // 6️⃣ Return minimal info (no password_hash)
    return NextResponse.json(
      {
        ok: true,
        message: "User registered successfully",
        user: {
          _id: user._id.toString(),
          first_name: user.first_name ?? null,
          last_name: user.last_name ?? null,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (e: unknown) {
    console.error("Register error:", e);
    return NextResponse.json(
      { ok: false, error: errorMessage(e) },
      { status: 500 },
    );
  }
}
