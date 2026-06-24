import { NextResponse } from "next/server";
import { dbQueryOne } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, companionId, source } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    await dbQueryOne<{ id: string }>(
      `
        insert into email_captures (email, companion_id, source)
        values ($1, $2, $3)
        on conflict (email) do nothing
        returning id
      `,
      [normalizedEmail, companionId ?? null, source ?? "unknown"]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email capture route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
