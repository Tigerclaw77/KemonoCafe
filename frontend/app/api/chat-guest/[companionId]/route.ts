// frontend/app/api/chat-guest/[companionId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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

// Map from CharacterConfig -> CompanionConfig so the API can treat
// Penny/Sandy and the rest (Yuki, Naomi, etc.) the same way.
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

// Unified resolver: first try companions.ts (Penny/Sandy), then CHARACTERS
function resolveCompanion(companionId: string): CompanionConfig | null {
  const fromOld = getCompanionById(companionId);
  if (fromOld) return fromOld;

  const character = CHARACTERS_BY_ID[companionId as CharacterId];
  if (!character) return null;

  return mapCharacterToCompanion(character);
}

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Missing or invalid messages" },
        { status: 400 }
      );
    }

    // No userId, no Supabase, just a raw AI reply
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

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Guest chat route error:", err);
    return NextResponse.json(
      { error: "Server error while generating reply" },
      { status: 500 }
    );
  }
}
