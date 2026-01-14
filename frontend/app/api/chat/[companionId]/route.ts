// frontend/app/api/chat/[companionId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { buildMenuContext } from "../../../../config/menu";
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
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const DAILY_FREE_LIMIT = 6;
const GRACE_MS = 5 * 60_000;

// ───────────────────────── Helpers ─────────────────────────

function isUuid(v: string) {
  return /^[0-9a-fA-F-]{36}$/.test(v);
}

function mapCharacterToCompanion(character: CharacterConfig): CompanionConfig {
  return {
    id: character.id,
    name: character.name,
    emoji: "☆",
    avatarSrc: `/${character.file}`,
    imageSrc: `/${character.file}`,
    title: character.species,
    shortDescription: character.personality,
    accentColor: "#f97373",
    systemPrompt: character.systemPrompt,
    profileBio: character.profileBio,
  };
}

function resolveCompanion(id: string): CompanionConfig | null {
  return (
    getCompanionById(id) ??
    (() => {
      const c = CHARACTERS_BY_ID[id as CharacterId];
      return c ? mapCharacterToCompanion(c) : null;
    })()
  );
}

// ───────────────────────── Route ─────────────────────────

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ companionId: string }> }
) {
  try {
    const { companionId } = await ctx.params;
    const companion = resolveCompanion(companionId);

    if (!companion) {
      return NextResponse.json({ error: "Companion not found" }, { status: 404 });
    }

    const body = (await req.json()) as {
      messages?: ChatMessage[];
      userId?: string; // auth user id
    };

    if (!Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    if (!body.userId || !isUuid(body.userId)) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const authUserId = body.userId;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // ─────────── Resolve AUTH → APP user ───────────

    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (!userRow) {
      return NextResponse.json({ error: "USER_NOT_SYNCED" }, { status: 401 });
    }

    const appUserId = userRow.id;

    // ─────────── Nomination ───────────
    // NOTE: This assumes companions.user_id stores APP user id.

    const { data: companionRow } = await supabase
      .from("companions")
      .select("id, nomination_expires_at, nomination_grace_used")
      .eq("user_id", appUserId)
      .eq("character_id", companionId)
      .maybeSingle();

    let hasNomination = false;
    let nominationJustEnded = false;

    let nominationExpiresAt: string | null = null;
    let nominationGraceEndsAt: string | null = null;

    if (companionRow?.nomination_expires_at) {
      nominationExpiresAt = companionRow.nomination_expires_at;

      const expiresMs = new Date(companionRow.nomination_expires_at).getTime();
      const graceEndMs = expiresMs + GRACE_MS;
      nominationGraceEndsAt = new Date(graceEndMs).toISOString();

      const nowMs = now.getTime();

      if (nowMs <= expiresMs) {
        hasNomination = true;
      } else if (!companionRow.nomination_grace_used && nowMs <= graceEndMs) {
        // within grace window (first time only)
        hasNomination = true;

        // Your existing meaning: "grace just triggered / started being used"
        nominationJustEnded = true;

        await supabase
          .from("companions")
          .update({ nomination_grace_used: true })
          .eq("id", companionRow.id);
      }
    }

    // ─────────── Message balances ───────────
    // IMPORTANT: message_balances.user_id stores APP user id

    const { data: balanceRow } = await supabase
      .from("message_balances")
      .select("remaining_messages")
      .eq("user_id", appUserId)
      .maybeSingle();

    const banked = balanceRow?.remaining_messages ?? 0;

    // ─────────── user_stats ───────────
    // IMPORTANT: user_stats.user_id stores APP user id
    // Also: include daily_free_date so we can reset correctly.

    let { data: statsRow } = await supabase
      .from("user_stats")
      .select("daily_free_date, daily_free_used")
      .eq("user_id", appUserId)
      .maybeSingle();

    if (!statsRow) {
      await supabase.from("user_stats").insert({
        user_id: appUserId,
        daily_free_date: today,
        daily_free_used: 0,
        last_visit_at: now.toISOString(),
      });

      const retry = await supabase
        .from("user_stats")
        .select("daily_free_date, daily_free_used")
        .eq("user_id", appUserId)
        .single();

      statsRow = retry.data!;
    }

    const dailyFreeUsed =
      statsRow.daily_free_date === today ? statsRow.daily_free_used : 0;

    let dailyFreeRemaining = Math.max(DAILY_FREE_LIMIT - dailyFreeUsed, 0);

    // ─────────── Decide consumption (AUTHORITATIVE) ───────────

    let consume: "UNLIMITED" | "FREE" | "BANKED" | null = null;

    if (hasNomination) consume = "UNLIMITED";
    else if (dailyFreeRemaining > 0) consume = "FREE";
    else if (banked > 0) consume = "BANKED";

    // 🚫 HARD STOP — NOTHING BELOW RUNS
    if (!consume) {
      return NextResponse.json(
        {
          blocked: true,
          reason: "NO_MESSAGES_LEFT",

          // keep response shape consistent for frontend
          reply: "",
          remainingMessages: banked,
          dailyFreeRemaining: 0,
          hasDailyFreeAvailable: false,

          hasNomination: false,
          nominationExpiresAt,
          nominationGraceEndsAt,
          nominationJustEnded: false,
        },
        { status: 402 }
      );
    }

    // ─────────── OpenAI ───────────

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 140,
      messages: [
        { role: "system", content: buildMenuContext() },
        { role: "system", content: companion.systemPrompt },
        ...body.messages,
      ],
    });

    const reply =
      completion.choices[0]?.message?.content ??
      "Mmm… I had trouble hearing that.";

    // ─────────── Persist usage ───────────

    if (consume === "FREE") {
      await supabase
        .from("user_stats")
        .update({
          daily_free_used: dailyFreeUsed + 1,
          daily_free_date: today,
          last_visit_at: now.toISOString(),
        })
        .eq("user_id", appUserId);

      dailyFreeRemaining -= 1;
    }

    if (consume === "BANKED") {
      await supabase
        .from("message_balances")
        .update({
          remaining_messages: Math.max(banked - 1, 0),
          updated_at: now.toISOString(),
        })
        .eq("user_id", appUserId);
    }

    // ─────────── Response ───────────

    const remainingMessages =
      consume === "BANKED" ? Math.max(banked - 1, 0) : banked;

    return NextResponse.json({
      reply,

      remainingMessages,
      dailyFreeRemaining,
      hasDailyFreeAvailable: dailyFreeRemaining > 0,

      blocked: false,

      hasNomination,
      nominationExpiresAt,
      nominationGraceEndsAt,
      nominationJustEnded,
    });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json(
      {
        error: "Server error",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
