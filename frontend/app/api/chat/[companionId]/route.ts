// frontend/app/api/chat/[companionId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

import {
  getCompanionById,
  type CompanionConfig,
} from "../../../../config/companions";

import {
  CHARACTERS_BY_ID,
  type CharacterId,
  type CharacterConfig,
} from "../../../../config";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Supabase service client (server-side only)
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const DAILY_FREE_LIMIT = 6;

// UUID validator
function isUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

// Map from CharacterConfig -> CompanionConfig so the API can treat
// Penny/Sandy and the rest (Yuki, Naomi, etc.) the same way.
function mapCharacterToCompanion(character: CharacterConfig): CompanionConfig {
  return {
    id: character.id,
    name: character.name,
    emoji: "☆", // can customize later
    avatarSrc: `/${character.file}`,
    imageSrc: `/${character.file}`,
    title: character.species,
    shortDescription: character.personality,
    accentColor: "#f97373", // placeholder accent; can be per-girl later
    systemPrompt: character.systemPrompt,
    profileBio: character.profileBio,
  };
}

// Unified resolver: first try companions.ts (Penny/Sandy), then CHARACTERS
function resolveCompanion(companionId: string): CompanionConfig | null {
  const fromOld = getCompanionById(companionId);
  if (fromOld) return fromOld;

  const character = CHARACTERS_BY_ID[companionId as CharacterId];
  if (!character) return null;

  return mapCharacterToCompanion(character);
}

// Note: in Next 16 dynamic route handlers, params is a Promise
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ companionId: string }> }
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set.");
      return NextResponse.json(
        { error: "Server misconfiguration: missing API key" },
        { status: 500 }
      );
    }

    const { companionId } = await ctx.params;
    const companion = resolveCompanion(companionId);

    if (!companion) {
      return NextResponse.json(
        { error: "Companion not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const messages = body.messages as ChatMessage[] | undefined;
    const userId = body.userId as string | undefined;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Missing or invalid messages" },
        { status: 400 }
      );
    }

    // For the café economy we need a real Supabase UUID
    if (!userId || !isUuid(userId)) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    // ─────────────────────────────────────────────
    // 1) Load remaining_messages + nomination + daily free counters
    // ─────────────────────────────────────────────

    // Main balance: profiles.remaining_messages
    const { data: profile, error: profileError } = await serviceSupabase
      .from("profiles")
      .select("remaining_messages")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to load profile" },
        { status: 500 }
      );
    }

    let remainingMessages = profile?.remaining_messages ?? 0;

    // Nomination: unlimited until expires_at
    const now = new Date();
    const nowIso = now.toISOString();

    const { data: nomination, error: nominationError } = await serviceSupabase
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

    // Daily free info from user_stats
    const { data: statsRow, error: statsError } = await serviceSupabase
      .from("user_stats")
      .select("total_messages, daily_free_date, daily_free_used")
      .eq("user_id", userId)
      .maybeSingle();

    if (statsError && statsError.code !== "PGRST116") {
      console.error("Error fetching user_stats:", statsError);
    }

    const todayStr = nowIso.slice(0, 10); // YYYY-MM-DD

    const oldTotal = statsRow?.total_messages ?? 0;

    let dailyFreeUsed = 0;
    if (statsRow?.daily_free_date === todayStr) {
      dailyFreeUsed = statsRow.daily_free_used ?? 0;
    }

    let dailyFreeRemaining = Math.max(DAILY_FREE_LIMIT - dailyFreeUsed, 0);
    let useDailyFree = false;

    // ─────────────────────────────────────────────
    // 2) Decide which bucket this message uses
    // ─────────────────────────────────────────────

    if (!hasNomination) {
      if (remainingMessages > 0) {
        // Use banked message, handled later by decrement
      } else if (dailyFreeRemaining > 0) {
        // Use one daily free
        useDailyFree = true;
      } else {
        // No nomination, no bank, no daily freebies
        return NextResponse.json(
          { error: "NO_MESSAGES_LEFT" },
          { status: 402 }
        );
      }
    }

    // ─────────────────────────────────────────────
    // 3) Call OpenAI with the companion prompt
    // ─────────────────────────────────────────────

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 140,
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content: companion.systemPrompt,
        },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    });

    const reply =
      response.choices[0]?.message?.content ??
      "Mmm… I had a little trouble hearing that, could you say it again?";

    // ─────────────────────────────────────────────
    // 4) Update stats: total messages + daily free counters
    // ─────────────────────────────────────────────

        const newTotal = oldTotal + 1;

    type StatsPayload = {
      total_messages: number;
      last_visit_at: string;
      daily_free_date?: string;
      daily_free_used?: number;
    };

    const statsPayload: StatsPayload = {
      total_messages: newTotal,
      last_visit_at: nowIso,
    };

    if (useDailyFree) {
      const updatedUsed = dailyFreeUsed + 1;
      statsPayload.daily_free_date = todayStr;
      statsPayload.daily_free_used = updatedUsed;
      dailyFreeUsed = updatedUsed;
    }

    if (statsRow) {
      const { error: updateStatsError } = await serviceSupabase
        .from("user_stats")
        .update(statsPayload)
        .eq("user_id", userId);

      if (updateStatsError) {
        console.error("Error updating user_stats:", updateStatsError);
      }
    } else {
      const insertPayload: StatsPayload & { user_id: string } = {
        user_id: userId,
        ...statsPayload,
      };

      const { error: insertStatsError } = await serviceSupabase
        .from("user_stats")
        .insert(insertPayload);

      if (insertStatsError) {
        console.error("Error inserting user_stats:", insertStatsError);
      }
    }

    // ─────────────────────────────────────────────
    // 5) Decrement banked messages if needed
    // ─────────────────────────────────────────────

    if (!hasNomination && !useDailyFree) {
      const newBalance = Math.max(remainingMessages - 1, 0);

      const { data: updatedProfile, error: updateError } =
        await serviceSupabase
          .from("profiles")
          .update({ remaining_messages: newBalance })
          .eq("id", userId)
          .select("remaining_messages")
          .single();

      if (updateError) {
        console.error("Failed to decrement remaining_messages:", updateError);
      } else {
        remainingMessages = updatedProfile.remaining_messages ?? newBalance;
      }
    }

    // Recompute dailyFreeRemaining after this message
    dailyFreeRemaining = Math.max(DAILY_FREE_LIMIT - dailyFreeUsed, 0);
    const hasDailyFreeAvailable = dailyFreeRemaining > 0;

    return NextResponse.json({
      reply,
      remainingMessages,
      hasNomination,
      nominationExpiresAt,
      hasDailyFreeAvailable,
      dailyFreeRemaining,
    });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json(
      { error: "Server error while generating reply" },
      { status: 500 }
    );
  }
}
