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

const ROUTE_VERSION = "chat-route-2026-01-20-v5-memory"; // bump

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

// Memory + welcome-back tuning
const MEMORY_LIMIT = 30;
const WELCOME_BACK_AFTER_HOURS = 6;

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
    const nowIso = now.toISOString();
    const today = getUtcTodayString(now);

    // ─────────── Resolve AUTH → APP user ───────────

    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", body.userId)
      .maybeSingle();

    if (userErr) {
      console.error("User lookup error:", userErr);
      return NextResponse.json(
        { error: "USER_LOOKUP_FAILED" },
        { status: 500, headers: resHeaders },
      );
    }

    if (!userRow?.id) {
      return NextResponse.json(
        { error: "USER_NOT_SYNCED" },
        { status: 401, headers: resHeaders },
      );
    }

    const appUserId = userRow.id;

    // ─────────── Nomination ───────────

    const { data: companionRow, error: compErr } = await supabase
      .from("companions")
      .select("id, nomination_expires_at, nomination_grace_used")
      .eq("user_id", appUserId)
      .eq("character_id", companionId)
      .maybeSingle();

    if (compErr) {
      console.error("Companion lookup error:", compErr);
      return NextResponse.json(
        { error: "COMPANION_LOOKUP_FAILED" },
        { status: 500, headers: resHeaders },
      );
    }

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

        const { error: graceErr } = await supabase
          .from("companions")
          .update({ nomination_grace_used: true })
          .eq("id", companionRow.id);

        if (graceErr) console.error("Grace update error:", graceErr);
      }
    }

    // ─────────── Banked messages ───────────

    const { data: balanceRow, error: balErr } = await supabase
      .from("message_balances")
      .select("remaining_messages")
      .eq("user_id", appUserId)
      .maybeSingle();

    if (balErr) console.error("Balance lookup error:", balErr);

    const banked = balanceRow?.remaining_messages ?? 0;

    // ─────────── Daily free messages (RESET + CONSUME SAFE) ───────────
    // Ensure row exists so updates don't silently affect 0 rows.

    const { data: statsRow, error: statsErr } = await supabase
      .from("user_stats")
      .select("daily_free_used, daily_free_date")
      .eq("user_id", appUserId)
      .maybeSingle();

    if (statsErr) console.error("Stats select error:", statsErr);

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
          { onConflict: "user_id" },
        );

      if (upsertErr) console.error("Stats upsert error:", upsertErr);
    }

    // Re-read authoritative values
    const { data: stats2, error: stats2Err } = await supabase
      .from("user_stats")
      .select("daily_free_used, daily_free_date")
      .eq("user_id", appUserId)
      .maybeSingle();

    if (stats2Err) console.error("Stats re-read error:", stats2Err);

    let dailyFreeUsed = stats2?.daily_free_used ?? 0;
    const statsDate = stats2?.daily_free_date ?? null;

    if (statsDate !== today) {
      const { error: resetErr } = await supabase
        .from("user_stats")
        .update({
          daily_free_used: 0,
          daily_free_date: today,
          last_visit_at: nowIso,
        })
        .eq("user_id", appUserId);

      if (resetErr) console.error("Daily free reset error:", resetErr);

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

    // ─────────── Identify the newest user message ───────────

    const lastUserMessage = body.messages.at(-1);

    if (!lastUserMessage || lastUserMessage.role !== "user") {
      return NextResponse.json(
        { error: "Invalid last user message" },
        { status: 400, headers: resHeaders },
      );
    }

    // ─────────── Load memory from DB (last N messages) ───────────

    const { data: historyRows, error: histErr } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("user_id", appUserId)
      .eq("companion_id", companionId)
      .order("created_at", { ascending: false })
      .limit(MEMORY_LIMIT);

    if (histErr) console.error("History load error:", histErr);

    const historyChrono = (historyRows ?? []).slice().reverse();

    // ─────────── Welcome-back hint if last interaction was 6h+ ago ───────────
    // IMPORTANT: This must be a SYSTEM message, not assistant/user.

    let welcomeBackSystemHint: { role: "system"; content: string } | null = null;

    if (historyChrono.length > 0) {
      const lastHist = historyChrono[historyChrono.length - 1];
      const lastMs = new Date(lastHist.created_at).getTime();
      const hoursAway = (now.getTime() - lastMs) / (1000 * 60 * 60);

      if (hoursAway >= WELCOME_BACK_AFTER_HOURS) {
        welcomeBackSystemHint = {
          role: "system",
          content:
            "The user is returning after time away (hours). Start your next reply with a warm, natural welcome-back (do not mention timestamps). Then continue normally.",
        };
      }
    }

    // ─────────── Persist USER message (DB is the source of truth) ───────────

    const { error: userMsgErr } = await supabase.from("chat_messages").insert({
      user_id: appUserId,
      companion_id: companionId,
      role: "user",
      content: lastUserMessage.content,
    });

    if (userMsgErr) {
      console.error("[chat_messages] user insert failed:", userMsgErr);
    }

    // ─────────── Build OpenAI message list using DB memory ───────────
    // We do NOT spread body.messages (client history) because DB memory is now canonical.
    // This avoids duplication / drift across refreshes.

    const openAiMessages: Array<
      | { role: "system"; content: string }
      | { role: "user" | "assistant"; content: string }
    > = [
      { role: "system", content: buildMenuContext() },
      { role: "system", content: companion.systemPrompt },
    ];

    if (welcomeBackSystemHint) openAiMessages.push(welcomeBackSystemHint);

    for (const m of historyChrono) {
      // safeguard: enforce only user/assistant roles
      if (m.role === "user" || m.role === "assistant") {
        openAiMessages.push({ role: m.role, content: m.content });
      }
    }

    // include the newest user message (just inserted)
    openAiMessages.push({ role: "user", content: lastUserMessage.content });

    // ─────────── OpenAI ───────────

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 160,
      messages: openAiMessages,
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
      const { error: updErr } = await supabase
        .from("user_stats")
        .update({
          daily_free_used: dailyFreeUsed + 1,
          daily_free_date: today,
          last_visit_at: nowIso,
        })
        .eq("user_id", appUserId);

      if (updErr) console.error("Stats update error:", updErr);

      dailyFreeRemaining = Math.max(dailyFreeRemaining - 1, 0);
    }

    if (consume === "BANKED") {
      const { error: updBalErr } = await supabase
        .from("message_balances")
        .update({
          remaining_messages: Math.max(banked - 1, 0),
          updated_at: nowIso,
        })
        .eq("user_id", appUserId);

      if (updBalErr) console.error("Balance update error:", updBalErr);
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
      {
        error: "Server error",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500, headers: resHeaders },
    );
  }
}
