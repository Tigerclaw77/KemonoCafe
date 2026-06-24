// frontend/app/api/user/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getCafeStatus } from "@/lib/cafeDb";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const guestStatus = {
  remainingMessages: 0,
  hasNomination: false,
  nominationExpiresAt: null,
  nominationGraceEndsAt: null,
  hasDailyFreeAvailable: false,
  dailyFreeRemaining: 0,
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(guestStatus);
    }

    const body = (await req.json().catch(() => ({}))) as {
      companionId?: string;
    };

    const status = await getCafeStatus(user.id, body.companionId ?? null);

    return NextResponse.json(status);
  } catch (err) {
    console.error("User status error:", err);
    return NextResponse.json(
      { error: "Failed to load user status" },
      { status: 500 }
    );
  }
}
