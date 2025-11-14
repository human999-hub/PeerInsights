// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { first_name, last_name, email, password, role } = body;

    // 1️⃣ Basic validation
    if (!first_name || !last_name || !email || !password || !role) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Only allow instructor/ta from this endpoint
    if (!["instructor", "ta"].includes(role)) {
      return NextResponse.json(
        { ok: false, error: "Role must be 'instructor' or 'ta'" },
        { status: 400 }
      );
    }

    // 2️⃣ Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // 3️⃣ Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // 4️⃣ Create user
    const user = await User.create({
      first_name,
      last_name,
      email,
      role, // "instructor" | "ta"
      password_hash, // bcrypt hash
    });

    // 5️⃣ Return minimal info (no password_hash)
    return NextResponse.json(
      {
        ok: true,
        message: "User registered successfully",
        user: {
          _id: user._id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("Register error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
