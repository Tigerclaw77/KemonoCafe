// frontend/app/[companionId]/page.tsx

import { notFound } from "next/navigation";

import CafeHeader from "../../components/CafeHeader";
import CompanionChat from "../../components/CompanionChat";
import CafeMenuButton from "../../components/CafeMenuButton";
import CompanionProfileHero from "../../components/CompanionProfileHero";

import {
  getCompanionById,
  type CompanionConfig,
} from "../../config/companions";

import {
  CHARACTERS_BY_ID,
  type CharacterId,
  type CharacterConfig,
} from "../../config";

/**
 * Maps a CharacterConfig entry to the CompanionConfig shape
 * used throughout the chat and UI layer.
 */
function mapCharacterToCompanion(character: CharacterConfig): CompanionConfig {
  return {
    id: character.id,
    name: character.name,

    avatarSrc: `/${character.file}`,
    imageSrc: `/${character.file}`,

    accentColor: "#f97373",
    emoji: "☆",

    title: character.species,
    shortDescription: character.personality,
    systemPrompt: character.systemPrompt,
    profileBio: character.profileBio,
  };
}

interface CompanionPageProps {
  // Next 16: params is async
  params: Promise<{ companionId: string }>;
}

export default async function CompanionPage({ params }: CompanionPageProps) {
  const { companionId } = await params;

  let companion: CompanionConfig | null = getCompanionById(companionId);

  if (!companion) {
    const character = CHARACTERS_BY_ID[companionId as CharacterId];
    if (character) {
      companion = mapCharacterToCompanion(character);
    }
  }

  if (!companion) {
    return notFound();
  }

  return (
    <main className="min-h-screen bg-cafe-gradient flex flex-col">
      <CafeHeader />

      <section className="flex-1">
        <div className="max-w-3xl mx-auto px-4 pb-10 flex flex-col items-center gap-6">
          <CompanionProfileHero companion={companion} />

          <CompanionChat companion={companion} />

          {/* <div className="w-full flex justify-end">
            <CafeMenuButton
              companionId={companion.id}
              companionName={companion.name}
            />
          </div> */}
        </div>
      </section>
    </main>
  );
}
