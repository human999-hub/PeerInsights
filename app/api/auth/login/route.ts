// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { role, email, password } = body;

    // 1️⃣ Basic validation
    if (!role || !email || !password) {
      return NextResponse.json(
        { ok: false, error: "Role, email and password are required" },
        { status: 400 }
      );
    }

    // (Optional convenience: if frontend sends only pid like "abc123",
    // you can uncomment this to auto-append @vt.edu)
    // const fullEmail = email.includes("@") ? email : `${email}@vt.edu`;

    const fullEmail = email; // <- keep simple: assume frontend sends full email

    // 2️⃣ Find user with matching email + role
    const user = await User.findOne({
      email: fullEmail,
      role, // "student" | "instructor" | "ta"
    });

    if (!user) {
      // Don't leak which one is wrong; just say invalid credentials
      return NextResponse.json(
        { ok: false, error: "Invalid email / role / password" },
        { status: 401 }
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
        { status: 400 }
      );
    }

    // 4️⃣ Compare plaintext password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { ok: false, error: "Invalid email / role / password" },
        { status: 401 }
      );
    }

    // 5️⃣ Create JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(), // subject = user id
        email: user.email,
        role: user.role,
      },
      secret,
      {
        expiresIn: "1h", // token valid for 1 hour
      }
    );

    // 6️⃣ Return token + some user info
    return NextResponse.json({
      ok: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
    });
  } catch (e: any) {
    console.error("Login error:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Login failed" },
      { status: 500 }
    );
  }
}
