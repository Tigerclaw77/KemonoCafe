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
  apiKey: process.env.OPENAI_API_KEY,
});

// Service-role Supabase (server only)
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const DAILY_FREE_LIMIT = 6;
const GRACE_MS = 5 * 60_000;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isUuid(value: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    value
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

function resolveCompanion(companionId: string): CompanionConfig | null {
  return (
    getCompanionById(companionId) ??
    (() => {
      const c = CHARACTERS_BY_ID[companionId as CharacterId];
      return c ? mapCharacterToCompanion(c) : null;
    })()
  );
}

// ─────────────────────────────────────────────
// MVP MEMORY HELPERS
// ─────────────────────────────────────────────

function extractMemoryCandidate(userMessage: string) {
  const triggers = [
    "i prefer",
    "i usually",
    "i like",
    "i love",
    "i don't like",
    "i hate",
    "i am not into",
    "i always",
  ];

  const normalized = userMessage.toLowerCase();
  if (!triggers.some((t) => normalized.includes(t))) return null;

  return {
    memory_type: "preference" as const,
    content: `User ${userMessage.trim()}`,
    importance: 0.8,
  };
}

async function loadMemories(appUserId: string, companionId: string) {
  const { data } = await serviceSupabase
    .from("companion_memories")
    .select("content")
    .eq("user_id", appUserId)
    .eq("companion_id", companionId)
    .order("importance", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  return data?.map((m) => m.content) ?? [];
}

async function saveMemory(
  appUserId: string,
  companionId: string,
  memory: {
    memory_type: "fact" | "preference" | "boundary";
    content: string;
    importance: number;
  }
) {
  await serviceSupabase.from("companion_memories").insert({
    user_id: appUserId,
    companion_id: companionId,
    memory_type: memory.memory_type,
    content: memory.content,
    importance: memory.importance,
  });
}

// ─────────────────────────────────────────────
// Route
// ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ companionId: string }> }
) {
  try {
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
    const authUserId = body.userId as string | undefined;

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    if (!authUserId || !isUuid(authUserId)) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    // ─────────────────────────────────────────────
    // 🔑 Resolve AUTH user → APP user
    // ─────────────────────────────────────────────

    const { data: userRow } = await serviceSupabase
      .from("users")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (!userRow) {
      return NextResponse.json(
        { error: "USER_NOT_SYNCED" },
        { status: 401 }
      );
    }

    const appUserId = userRow.id;

    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // ─────────────────────────────────────────────
    // Load memories
    // ─────────────────────────────────────────────

    const memories = await loadMemories(appUserId, companionId);

    const memoryBlock =
      memories.length > 0
        ? `\nKnown facts about the user:\n${memories
            .map((m) => `- ${m}`)
            .join("\n")}\n`
        : "";

    // ─────────────────────────────────────────────
    // Nomination state
    // ─────────────────────────────────────────────

    const { data: companionRow } = await serviceSupabase
      .from("companions")
      .select("id, nomination_expires_at, nomination_grace_used")
      .eq("user_id", appUserId)
      .eq("character_id", companionId)
      .maybeSingle();

    const nominationExpiresAt = companionRow?.nomination_expires_at
      ? new Date(companionRow.nomination_expires_at)
      : null;

    const graceUsed = companionRow?.nomination_grace_used === true;

    let unlimitedActive = false;
    let nominationJustEnded = false;

    if (nominationExpiresAt && now <= nominationExpiresAt) {
      unlimitedActive = true;
    } else if (
      nominationExpiresAt &&
      !graceUsed &&
      now > nominationExpiresAt &&
      now <= new Date(nominationExpiresAt.getTime() + GRACE_MS)
    ) {
      unlimitedActive = true;
      nominationJustEnded = true;

      if (companionRow?.id) {
        await serviceSupabase
          .from("companions")
          .update({ nomination_grace_used: true })
          .eq("id", companionRow.id);
      }
    }

    // ─────────────────────────────────────────────
    // Load balances
    // ─────────────────────────────────────────────

    const { data: balanceRow } = await serviceSupabase
      .from("message_balances")
      .select("remaining_messages")
      .eq("user_id", appUserId)
      .maybeSingle();

    let remainingMessages = balanceRow?.remaining_messages ?? 0;

    let { data: stats } = await serviceSupabase
      .from("user_stats")
      .select("total_messages, daily_free_date, daily_free_used")
      .eq("user_id", appUserId)
      .maybeSingle();

    if (!stats) {
      await serviceSupabase.from("user_stats").insert({
        user_id: appUserId,
        total_messages: 0,
        daily_free_date: today,
        daily_free_used: 0,
        last_visit_at: now.toISOString(),
      });

      stats = {
        total_messages: 0,
        daily_free_date: today,
        daily_free_used: 0,
      };
    }

    let dailyFreeUsed =
      stats.daily_free_date === today ? stats.daily_free_used ?? 0 : 0;

    let dailyFreeRemaining = Math.max(DAILY_FREE_LIMIT - dailyFreeUsed, 0);

    let useDailyFree = false;

    if (!unlimitedActive) {
      if (dailyFreeRemaining > 0) {
        useDailyFree = true;
      } else if (remainingMessages > 0) {
        // use banked
      } else {
        return NextResponse.json(
          { error: "NO_MESSAGES_LEFT" },
          { status: 402 }
        );
      }
    }

    // ─────────────────────────────────────────────
    // OpenAI call
    // ─────────────────────────────────────────────

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      max_tokens: 140,
      messages: [
        { role: "system", content: buildMenuContext() },
        {
          role: "system",
          content:
            companion.systemPrompt +
            "\n\n" +
            buildMenuContext() +
            "\n\n" +
            memoryBlock,
        },
        ...messages,
      ],
    });

    const reply =
      completion.choices[0]?.message?.content ??
      "Mmm… I had trouble hearing that.";

    // ─────────────────────────────────────────────
    // Save memory
    // ─────────────────────────────────────────────

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user")?.content;

    if (lastUserMessage) {
      const memoryCandidate = extractMemoryCandidate(lastUserMessage);
      if (memoryCandidate) {
        await saveMemory(appUserId, companionId, memoryCandidate);
      }
    }

    // ─────────────────────────────────────────────
    // Update stats
    // ─────────────────────────────────────────────

    const newTotal = (stats.total_messages ?? 0) + 1;

    const statsUpdate: Record<string, unknown> = {
      total_messages: newTotal,
      last_visit_at: now.toISOString(),
    };

    if (useDailyFree) {
      dailyFreeUsed += 1;
      statsUpdate.daily_free_date = today;
      statsUpdate.daily_free_used = dailyFreeUsed;
    }

    await serviceSupabase
      .from("user_stats")
      .update(statsUpdate)
      .eq("user_id", appUserId);

    if (!unlimitedActive && !useDailyFree) {
      const newRemaining = Math.max(remainingMessages - 1, 0);

      await serviceSupabase
        .from("message_balances")
        .update({
          remaining_messages: newRemaining,
          updated_at: now.toISOString(),
        })
        .eq("user_id", appUserId);

      remainingMessages = newRemaining;
    }

    dailyFreeRemaining = Math.max(DAILY_FREE_LIMIT - dailyFreeUsed, 0);

    return NextResponse.json({
      reply,
      remainingMessages,
      hasNomination: unlimitedActive,
      nominationExpiresAt,
      nominationJustEnded,
      hasDailyFreeAvailable: dailyFreeRemaining > 0,
      dailyFreeRemaining,
    });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
