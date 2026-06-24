// frontend/app/api/chat/[companionId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
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
import { getCurrentUser } from "@/lib/auth";
import {
  consumeChatCredit,
  getCafeStatus,
  markNominationGraceUsed,
  refundMessageCredit,
} from "@/lib/cafeDb";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const ROUTE_VERSION = "chat-route-neon-revival-v1";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function mapCharacterToCompanion(character: CharacterConfig): CompanionConfig {
  return {
    id: character.id,
    name: character.name,
    emoji: "*",
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

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ companionId: string }> }
) {
  const resHeaders = new Headers();
  resHeaders.set("x-chat-route-version", ROUTE_VERSION);

  let consumedCredit: "FREE" | "BANKED" | null = null;
  let userIdForRefund: string | null = null;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401, headers: resHeaders }
      );
    }

    userIdForRefund = user.id;

    const { companionId } = await ctx.params;
    const companion = resolveCompanion(companionId);

    if (!companion) {
      return NextResponse.json(
        { error: "Companion not found" },
        { status: 404, headers: resHeaders }
      );
    }

    const body = (await req.json()) as {
      messages?: ChatMessage[];
    };

    if (!Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: "Invalid messages" },
        { status: 400, headers: resHeaders }
      );
    }

    const statusBefore = await getCafeStatus(user.id, companionId);

    const unlimited = statusBefore.hasNomination;
    let nominationJustEnded = false;

    if (unlimited && statusBefore.nominationExpiresAt) {
      const expiresMs = new Date(statusBefore.nominationExpiresAt).getTime();
      const graceEndMs = statusBefore.nominationGraceEndsAt
        ? new Date(statusBefore.nominationGraceEndsAt).getTime()
        : expiresMs;

      if (Date.now() > expiresMs && Date.now() <= graceEndMs) {
        nominationJustEnded = true;
        await markNominationGraceUsed(user.id, companionId);
      }
    }

    if (!unlimited) {
      consumedCredit = await consumeChatCredit(user.id);
    }

    if (!unlimited && !consumedCredit) {
      return NextResponse.json(
        {
          blocked: true,
          reason: "NO_MESSAGES_LEFT",
          remainingMessages: statusBefore.remainingMessages,
          dailyFreeRemaining: 0,
          hasDailyFreeAvailable: false,
          hasNomination: false,
          nominationJustEnded: false,
        },
        { status: 402, headers: resHeaders }
      );
    }

    let reply: string;

    try {
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

      reply =
        completion.choices[0]?.message?.content ??
        "Mmm... I had trouble hearing that.";
    } catch (err) {
      if (consumedCredit) {
        await refundMessageCredit(user.id, consumedCredit);
        consumedCredit = null;
      }

      throw err;
    }

    const statusAfter = await getCafeStatus(user.id, companionId);

    return NextResponse.json(
      {
        reply,
        remainingMessages: statusAfter.remainingMessages,
        dailyFreeRemaining: statusAfter.dailyFreeRemaining,
        hasDailyFreeAvailable: statusAfter.hasDailyFreeAvailable,
        blocked: false,
        hasNomination: nominationJustEnded ? false : statusAfter.hasNomination,
        nominationExpiresAt: statusAfter.nominationExpiresAt,
        nominationGraceEndsAt: statusAfter.nominationGraceEndsAt,
        nominationJustEnded,
      },
      { status: 200, headers: resHeaders }
    );
  } catch (err) {
    if (consumedCredit && userIdForRefund) {
      await refundMessageCredit(userIdForRefund, consumedCredit).catch(() => {});
    }

    console.error("Chat route error:", err);
    return NextResponse.json(
      {
        error: "Server error",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500, headers: resHeaders }
    );
  }
}
