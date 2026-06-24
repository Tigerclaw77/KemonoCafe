import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  ensureUserDefaults,
  findUserByEmail,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    const passwordMatches = user
      ? await verifyPassword(password, user.password_hash, user.password_salt)
      : false;

    if (!user || !passwordMatches) {
      return NextResponse.json(
        { error: "Incorrect email or password." },
        { status: 401 }
      );
    }

    await ensureUserDefaults(user.id);
    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        user_context: user.user_context,
      },
    });
  } catch (err) {
    console.error("[auth/login] error:", err);
    return NextResponse.json({ error: "Could not log in." }, { status: 500 });
  }
}

