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

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ROUTE_VERSION = "chat-route-2026-01-20-v4"; // bump

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const DAILY_FREE_LIMIT = 6;
const GRACE_MS = 5 * 60_000;

// ───────────────────────── Helpers ─────────────────────────

function isUuid(v: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    v,
  );
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

function getUtcTodayString(d: Date) {
  return d.toISOString().slice(0, 10);
}

// ───────────────────────── Route ─────────────────────────

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ companionId: string }> },
) {
  const resHeaders = new Headers();
  resHeaders.set("x-chat-route-version", ROUTE_VERSION);

  try {
    const { companionId } = await ctx.params;
    const companion = resolveCompanion(companionId);

    if (!companion) {
      return NextResponse.json(
        { error: "Companion not found" },
        { status: 404, headers: resHeaders },
      );
    }

    const body = (await req.json()) as {
      messages?: ChatMessage[];
      userId?: string;
    };

    if (!Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Invalid messages" },
        { status: 400, headers: resHeaders },
      );
    }

    if (!body.userId || !isUuid(body.userId)) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401, headers: resHeaders },
      );
    }

    const now = new Date();
    const today = getUtcTodayString(now);

    // ─────────── Resolve AUTH → APP user ───────────

    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", body.userId)
      .maybeSingle();

    if (!userRow?.id) {
      return NextResponse.json(
        { error: "USER_NOT_SYNCED" },
        { status: 401, headers: resHeaders },
      );
    }

    const appUserId = userRow.id;

    // ─────────── Nomination ───────────

    const { data: companionRow } = await supabase
      .from("companions")
      .select("id, nomination_expires_at, nomination_grace_used")
      .eq("user_id", appUserId)
      .eq("character_id", companionId)
      .maybeSingle();

    let unlimited = false;
    let nominationJustEnded = false;

    if (companionRow?.nomination_expires_at) {
      const expiresMs = new Date(companionRow.nomination_expires_at).getTime();
      const graceEndMs = expiresMs + GRACE_MS;
      const nowMs = now.getTime();

      if (nowMs <= expiresMs) unlimited = true;
      else if (!companionRow.nomination_grace_used && nowMs <= graceEndMs) {
        unlimited = true;
        nominationJustEnded = true;

        await supabase
          .from("companions")
          .update({ nomination_grace_used: true })
          .eq("id", companionRow.id);
      }
    }

    // ─────────── Banked messages ───────────

    const { data: balanceRow } = await supabase
      .from("message_balances")
      .select("remaining_messages")
      .eq("user_id", appUserId)
      .maybeSingle();

    const banked = balanceRow?.remaining_messages ?? 0;

    // ─────────── Daily free messages (RESET + CONSUME SAFE) ───────────

    const { data: statsRow } = await supabase
      .from("user_stats")
      .select("daily_free_used, daily_free_date")
      .eq("user_id", appUserId)
      .maybeSingle();

    let dailyFreeUsed = statsRow?.daily_free_used ?? 0;
    const statsDate = statsRow?.daily_free_date ?? null;

    // ✅ NEW: persist reset if date changed
    if (statsDate !== today) {
      await supabase
        .from("user_stats")
        .update({
          daily_free_used: 0,
          daily_free_date: today,
          last_visit_at: now.toISOString(),
        })
        .eq("user_id", appUserId);

      dailyFreeUsed = 0;
    }

    let dailyFreeRemaining = Math.max(DAILY_FREE_LIMIT - dailyFreeUsed, 0);

    // ─────────── Decide consumption ───────────

    let consume: "UNLIMITED" | "FREE" | "BANKED" | null = null;

    if (unlimited) consume = "UNLIMITED";
    else if (dailyFreeRemaining > 0) consume = "FREE";
    else if (banked > 0) consume = "BANKED";

    if (!consume) {
      return NextResponse.json(
        {
          blocked: true,
          reason: "NO_MESSAGES_LEFT",
          remainingMessages: banked,
          dailyFreeRemaining: 0,
          hasDailyFreeAvailable: false,
          hasNomination: false,
          nominationJustEnded: false,
        },
        { status: 402, headers: resHeaders },
      );
    }

    // ─────────── Persist USER message ───────────

    const lastUserMessage = body.messages.at(-1);

    if (lastUserMessage?.role === "user") {
      const { error: userMsgErr } = await supabase
        .from("chat_messages")
        .insert({
          user_id: appUserId,
          companion_id: companionId,
          role: "user",
          content: lastUserMessage.content,
        });

      if (userMsgErr) {
        console.error("[chat_messages] user insert failed:", userMsgErr);
      }
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

    // ─────────── Persist ASSISTANT message ───────────

    const { error: assistantMsgErr } = await supabase
      .from("chat_messages")
      .insert({
        user_id: appUserId,
        companion_id: companionId,
        role: "assistant",
        content: reply,
      });

    if (assistantMsgErr) {
      console.error(
        "[chat_messages] assistant insert failed:",
        assistantMsgErr,
      );
    }

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

      dailyFreeRemaining = Math.max(dailyFreeRemaining - 1, 0);
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

    return NextResponse.json(
      {
        reply,
        remainingMessages:
          consume === "BANKED" ? Math.max(banked - 1, 0) : banked,
        dailyFreeRemaining,
        hasDailyFreeAvailable: dailyFreeRemaining > 0,
        blocked: false,
        hasNomination: unlimited,
        nominationJustEnded,
      },
      { status: 200, headers: resHeaders },
    );
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: resHeaders },
    );
  }
}
