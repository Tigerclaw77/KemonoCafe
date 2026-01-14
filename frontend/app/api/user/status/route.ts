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

// ✅ pick a single app timezone for “daily free” boundaries
// Change this if you want (but keep it consistent everywhere).
const APP_TIMEZONE = "America/Chicago";

function isUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

// YYYY-MM-DD in chosen timezone (NOT UTC)
function getTodayStrInTimeZone(tz: string): string {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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

    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    const today = new Date().toISOString().slice(0, 10);

    // ─────────────────────────────────────
    // Resolve AUTH → APP user
    // ─────────────────────────────────────
    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (userErr) {
      console.error("[user/status] users lookup error:", userErr);
    }

    if (!userRow?.id) {
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
    const { data: balance, error: balanceErr } = await supabase
      .from("message_balances")
      .select("remaining_messages")
      .eq("user_id", appUserId)
      .maybeSingle();

    if (balanceErr) {
      console.error("[user/status] message_balances lookup error:", balanceErr);
    }

    const remainingMessages = balance?.remaining_messages ?? 0;

    // ─────────────────────────────────────
    // Daily free messages (AUTHORITATIVE)
    // ─────────────────────────────────────
    // ✅ Ensure the stats row EXISTS (no silent “update 0 rows”)
    const { data: statsRow, error: statsErr } = await supabase
      .from("user_stats")
      .select("daily_free_used, daily_free_date")
      .eq("user_id", appUserId)
      .maybeSingle();

    if (statsErr) {
      console.error("[user/status] user_stats lookup error:", statsErr);
    }

    // If missing row, create it (upsert)
    if (!statsRow) {
      const { error: upsertErr } = await supabase
        .from("user_stats")
        .upsert(
          {
            user_id: appUserId,
            daily_free_used: 0,
            daily_free_date: today,
            last_visit_at: nowIso,
          },
          { onConflict: "user_id" }
        );

      if (upsertErr) {
        console.error("[user/status] user_stats upsert error:", upsertErr);
      }
    }

    // Re-read after possible upsert so we have stable values
    const { data: stats2, error: stats2Err } = await supabase
      .from("user_stats")
      .select("daily_free_used, daily_free_date")
      .eq("user_id", appUserId)
      .maybeSingle();

    if (stats2Err) {
      console.error("[user/status] user_stats re-read error:", stats2Err);
    }

    const currentUsed = stats2?.daily_free_used ?? 0;
    const currentDate = stats2?.daily_free_date ?? null;

    const dailyFreeUsed = currentUsed;

    // ✅ Daily reset in APP_TIMEZONE
    // if (currentDate !== today) {
    //   const { error: resetErr } = await supabase
    //     .from("user_stats")
    //     .update({
    //       daily_free_used: 0,
    //       daily_free_date: today,
    //       last_visit_at: nowIso,
    //     })
    //     .eq("user_id", appUserId);

    //   if (resetErr) {
    //     console.error("[user/status] Daily free reset error:", resetErr);
    //   }

    //   dailyFreeUsed = 0;
    // }

    const dailyFreeRemaining = Math.max(DAILY_FREE_LIMIT - dailyFreeUsed, 0);
    const hasDailyFreeAvailable = dailyFreeRemaining > 0;

    // ─────────────────────────────────────
    // Nomination (AUTHORITATIVE-ish)
    // ─────────────────────────────────────
    const { data: companionRow, error: nomErr } = await supabase
      .from("companions")
      .select("nomination_expires_at, nomination_grace_used")
      .eq("user_id", appUserId)
      .maybeSingle();

    if (nomErr) {
      console.error("[user/status] companions lookup error:", nomErr);
    }

    let hasNomination = false;
    let nominationExpiresAt: string | null = null;
    let nominationGraceEndsAt: string | null = null;

    if (companionRow?.nomination_expires_at) {
      const expiresMs = new Date(companionRow.nomination_expires_at).getTime();
      const graceEndMs = expiresMs + GRACE_MS;

      if (nowMs <= expiresMs) {
        hasNomination = true;
        nominationExpiresAt = companionRow.nomination_expires_at;
        nominationGraceEndsAt = new Date(graceEndMs).toISOString();
      } else if (
        !companionRow.nomination_grace_used &&
        nowMs > expiresMs &&
        nowMs <= graceEndMs
      ) {
        hasNomination = true;
        nominationExpiresAt = companionRow.nomination_expires_at;
        nominationGraceEndsAt = new Date(graceEndMs).toISOString();
      }
    }

    console.log("[user/status]", {
      appUserId,
      today,
      tz: APP_TIMEZONE,
      remainingMessages,
      dailyFreeUsed,
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
