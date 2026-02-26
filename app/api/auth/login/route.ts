// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Types } from "mongoose";

type UserRole = "student" | "instructor" | "ta";

type LoginBody = {
  role?: UserRole;
  email?: string;
  password?: string;
};

type UserLoginDoc = {
  _id: Types.ObjectId;
  email: string;
  role: UserRole;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
};

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unknown error";
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isUserRole(v: unknown): v is UserRole {
  return v === "student" || v === "instructor" || v === "ta";
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const raw: unknown = await req.json();
    const body = raw as LoginBody;

    const role = body.role;
    const email = body.email;
    const password = body.password;

    // 1) Validate input strongly
    if (
      !isUserRole(role) ||
      !isNonEmptyString(email) ||
      !isNonEmptyString(password)
    ) {
      return NextResponse.json(
        { ok: false, error: "Role, email and password are required" },
        { status: 400 },
      );
    }

    const fullEmail = email;

    // 2) Find user
    const user = await User.findOne({
      email: fullEmail,
      role,
    })
      .select({
        email: 1,
        role: 1,
        password_hash: 1,
        first_name: 1,
        last_name: 1,
      })
      .lean<UserLoginDoc | null>();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Invalid email / role / password" },
        { status: 401 },
      );
    }

    // 3) Ensure password hash exists
    if (!isNonEmptyString(user.password_hash)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Password is not set for this account. Please contact the administrator.",
        },
        { status: 400 },
      );
    }

    // 4) Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { ok: false, error: "Invalid email / role / password" },
        { status: 401 },
      );
    }

    // 5) Create JWT
    const secret = process.env.JWT_SECRET;
    if (!isNonEmptyString(secret)) {
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

    // 6) Return
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
