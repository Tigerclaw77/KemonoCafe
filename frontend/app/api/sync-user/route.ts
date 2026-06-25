// frontend/app/api/sync-user/route.ts

import { NextResponse } from "next/server";
import { ensureUserDefaults, getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

async function syncCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  await ensureUserDefaults(user.id);
  return NextResponse.json({ status: "ok", user });
}

export async function POST() {
  return syncCurrentUser();
}

export async function GET() {
  return syncCurrentUser();
}
