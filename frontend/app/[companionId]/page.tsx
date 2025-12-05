// frontend/app/[companionId]/page.tsx
import { notFound } from "next/navigation";

import ChatHeader from "../../components/ChatHeader";
import CompanionChat from "../../components/CompanionChat";
import CafeMenuButton from "../../components/CafeMenuButton";
import CompanionProfileHero from "../../components/CompanionProfileHero";

import {
  getCompanionById,
  type CompanionConfig,
} from "../../config/companions";

// Unified character config (all 13 girls)
import {
  CHARACTERS_BY_ID,
  type CharacterId,
  type CharacterConfig,
} from "../../config";

// Map from new CharacterConfig -> existing CompanionConfig shape
function mapCharacterToCompanion(character: CharacterConfig): CompanionConfig {
  return {
    id: character.id, // CharacterId === CompanionId now
    name: character.name,

    // images
    avatarSrc: `/${character.file}`,
    imageSrc: `/${character.file}`,

    // UI cosmetics
    accentColor: "#f97373", // placeholder; can be customized per girl later
    emoji: "☆",

    // text
    title: character.species,
    shortDescription: character.personality,
    systemPrompt: character.systemPrompt,
    profileBio: character.profileBio,
  };
}

interface CompanionPageProps {
  // In Next 16 server components, params is a Promise
  params: Promise<{ companionId: string }>;
}

export default async function CompanionPage({ params }: CompanionPageProps) {
  // ✅ Correct for Next 16: await the params Promise
  const { companionId } = await params;

  // 1) Try the old companions.ts data first (Penny & Sandy)
  let companion: CompanionConfig | null = getCompanionById(companionId);

  // 2) If not found there, fall back to the CHARACTERS config
  if (!companion) {
    const character = CHARACTERS_BY_ID[companionId as CharacterId];
    if (character) {
      companion = mapCharacterToCompanion(character);
    }
  }

  // 3) Still nothing? Then it's truly a 404
  if (!companion) {
    return notFound();
  }

  // 🔐 Auth wiring:
  // - For guest testing, leave this as `undefined`.
  // - When Supabase auth is hooked up, replace with the real user id.
  const userId: string | undefined = undefined;

  return (
    <main className="min-h-screen bg-cafe-gradient flex flex-col">
      {/* Top bar */}
      <ChatHeader companion={companion} />

      <section className="flex-1">
        <div className="max-w-3xl mx-auto px-4 pb-10 flex flex-col items-center gap-6">
          <CompanionProfileHero companion={companion} />
          <CompanionChat companion={companion} userId={userId} />

          <div className="w-full flex justify-end">
            <CafeMenuButton
              companionId={companion.id}
              companionName={companion.name}
              userId={userId}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
