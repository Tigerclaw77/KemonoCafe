import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  createUserAccount,
  ensureUserDefaults,
} from "@/lib/auth";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName, userContext } = await req.json();

    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const user = await createUserAccount({
      email,
      password,
      displayName,
      userContext,
    });

    if (!user) {
      return NextResponse.json(
        { error: "Could not create account." },
        { status: 500 }
      );
    }

    await ensureUserDefaults(user.id);
    await createSession(user.id);

    return NextResponse.json({ user });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "23505"
    ) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    console.error("[auth/signup] error:", err);
    return NextResponse.json(
      { error: "Could not create account." },
      { status: 500 }
    );
  }
}

