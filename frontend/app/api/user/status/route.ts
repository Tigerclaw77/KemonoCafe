// frontend/app/api/user/status/route.ts

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-side only
);

const DAILY_FREE_LIMIT = 6;
const GRACE_MS = 5 * 60_000;

function isUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

export async function POST(req: NextRequest) {
  try {
    const { userId: authUserId } = await req.json();

    // Guest / invalid
    if (!authUserId || !isUuid(authUserId)) {
      return NextResponse.json({
        remainingMessages: 0,
        hasNomination: false,
        nominationExpiresAt: null,
        nominationGraceEndsAt: null,
        hasDailyFreeAvailable: false,
        dailyFreeRemaining: 0,
      });
    }

    const now = Date.now();

    // ─────────────────────────────────────
    // Resolve AUTH → APP user
    // ─────────────────────────────────────

    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (!userRow) {
      return NextResponse.json({
        remainingMessages: 0,
        hasNomination: false,
        nominationExpiresAt: null,
        nominationGraceEndsAt: null,
        hasDailyFreeAvailable: false,
        dailyFreeRemaining: 0,
      });
    }

    const appUserId = userRow.id;

    // ─────────────────────────────────────
    // Banked messages (AUTHORITATIVE)
    // ─────────────────────────────────────

    const { data: balance } = await supabase
      .from("message_balances")
      .select("remaining_messages")
      .eq("user_id", appUserId)
      .maybeSingle();

    const remainingMessages = balance?.remaining_messages ?? 0;

    // ─────────────────────────────────────
    // Daily free messages (AUTHORITATIVE)
    // ─────────────────────────────────────

    const { data: stats } = await supabase
      .from("user_stats")
      .select("daily_free_used")
      .eq("user_id", appUserId)
      .maybeSingle();

    const dailyFreeUsed = stats?.daily_free_used ?? 0;
    const dailyFreeRemaining = Math.max(
      DAILY_FREE_LIMIT - dailyFreeUsed,
      0
    );

    const hasDailyFreeAvailable = dailyFreeRemaining > 0;

    // ─────────────────────────────────────
    // Nomination (AUTHORITATIVE)
    // ─────────────────────────────────────

    const { data: companionRow } = await supabase
      .from("companions")
      .select("nomination_expires_at, nomination_grace_used")
      .eq("user_id", appUserId)
      .maybeSingle();

    let hasNomination = false;
    let nominationExpiresAt: string | null = null;
    let nominationGraceEndsAt: string | null = null;

    if (companionRow?.nomination_expires_at) {
      const expiresMs = new Date(
        companionRow.nomination_expires_at
      ).getTime();

      const graceEndMs = expiresMs + GRACE_MS;

      if (now <= expiresMs) {
        hasNomination = true;
        nominationExpiresAt = companionRow.nomination_expires_at;
        nominationGraceEndsAt = new Date(graceEndMs).toISOString();
      } else if (
        !companionRow.nomination_grace_used &&
        now > expiresMs &&
        now <= graceEndMs
      ) {
        hasNomination = true;
        nominationExpiresAt = companionRow.nomination_expires_at;
        nominationGraceEndsAt = new Date(graceEndMs).toISOString();
      }
    }

    console.log("[user/status]", {
      appUserId,
      remainingMessages,
      dailyFreeRemaining,
      hasNomination,
    });

    return NextResponse.json({
      remainingMessages,
      hasNomination,
      nominationExpiresAt,
      nominationGraceEndsAt,
      hasDailyFreeAvailable,
      dailyFreeRemaining,
    });
  } catch (err) {
    console.error("User status error:", err);
    return NextResponse.json(
      { error: "Failed to load user status" },
      { status: 500 }
    );
  }
}
