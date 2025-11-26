// frontend/app/api/user/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin level, server-side only
);

const DAILY_FREE_LIMIT = 6;

// Simple UUID validator (v4-style, good enough for our use)
function isUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    // Guests or non-UUID are treated as "no balance, no freebies" for now.
    if (!userId || !isUuid(userId)) {
      return NextResponse.json({
        remainingMessages: 0,
        hasNomination: false,
        nominationExpiresAt: null,
        hasDailyFreeAvailable: false,
        dailyFreeRemaining: 0,
      });
    }

    // 1) Get profile.remaining_messages
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("remaining_messages")
      .eq("id", userId)
      .maybeSingle();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to load profile" },
        { status: 500 }
      );
    }

    const remainingMessages = profile?.remaining_messages ?? 0;

    // 2) Daily free info from user_stats
    const { data: stats, error: statsError } = await supabase
      .from("user_stats")
      .select("daily_free_date, daily_free_used")
      .eq("user_id", userId)
      .maybeSingle();

    if (statsError && statsError.code !== "PGRST116") {
      console.error("Error fetching user_stats:", statsError);
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

    let dailyFreeUsed = 0;

    if (stats?.daily_free_date === todayStr) {
      dailyFreeUsed = stats.daily_free_used ?? 0;
    }

    const dailyFreeRemaining = Math.max(DAILY_FREE_LIMIT - dailyFreeUsed, 0);
    const hasDailyFreeAvailable = dailyFreeRemaining > 0;

    // 3) Check nomination (if present and not expired)
    const nowIso = now.toISOString();

    const { data: nomination, error: nominationError } = await supabase
      .from("nominations")
      .select("expires_at")
      .eq("user_id", userId)
      .gt("expires_at", nowIso)
      .maybeSingle();

    if (nominationError && nominationError.code !== "PGRST116") {
      console.error("Error fetching nomination:", nominationError);
    }

    const hasNomination = !!nomination;
    const nominationExpiresAt = nomination?.expires_at ?? null;

    return NextResponse.json({
      remainingMessages,
      hasNomination,
      nominationExpiresAt,
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
