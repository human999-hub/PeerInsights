// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

type UserRole = "student" | "instructor" | "ta";

type LoginBody = {
  role?: UserRole;
  email?: string;
  password?: string;
};

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Unknown error";
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body: LoginBody = (await req.json()) as LoginBody;
    const { role, email, password } = body;

    // 1️⃣ Basic validation
    if (!role || !email || !password) {
      return NextResponse.json(
        { ok: false, error: "Role, email and password are required" },
        { status: 400 },
      );
    }

    const fullEmail = email; // assume frontend sends full email

    // 2️⃣ Find user with matching email + role
    const user = await User.findOne({
      email: fullEmail,
      role,
    }).lean(false); // ensure it's a Mongoose doc in case you ever need methods

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Invalid email / role / password" },
        { status: 401 },
      );
    }

    // 3️⃣ Ensure password hash exists
    if (!user.password_hash) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Password is not set for this account. Please contact the administrator.",
        },
        { status: 400 },
      );
    }

    // 4️⃣ Compare plaintext password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { ok: false, error: "Invalid email / role / password" },
        { status: 401 },
      );
    }

    // 5️⃣ Create JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: "1h" },
    );

    // 6️⃣ Return token + user info
    return NextResponse.json({
      ok: true,
      token,
      user: {
        _id: user._id.toString(),
        email: user.email,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        role: user.role,
      },
    });
  } catch (e: unknown) {
    console.error("Login error:", e);
    return NextResponse.json(
      { ok: false, error: errorMessage(e) || "Login failed" },
      { status: 500 },
    );
  }
}
