// frontend/app/[companionId]/page.tsx

import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import {
  getCompanionById,
  type CompanionConfig,
} from "../../config/companions";

import CompanionChat from "../../components/CompanionChat";
import CafeMenuButton from "../../components/CafeMenuButton";
import CompanionProfileHero from "../../components/CompanionProfileHero";

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

  return (
    <main className="min-h-screen bg-cafe-gradient flex flex-col">
      {/* Top bar */}
      <header className="w-full border-b border-sky-100 bg-slate-900/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-sky-300">
              <Image
                src={companion.avatarSrc}
                alt={companion.name}
                fill
                className="object-cover object-[50%_25%]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-50">
                Kemono Cafe
              </p>
              <p className="text-[11px] text-slate-400">
                Chat with your chosen hostess
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-[11px] text-sky-300 hover:text-sky-200 underline-offset-2 hover:underline"
          >
            ← Choose another hostess
          </Link>
        </div>
      </header>

      {/* Main content */}
      <section className="flex-1">
        <div className="max-w-3xl mx-auto px-4 pb-10 flex flex-col items-center gap-6">
          {/* Big portrait + single-line label + profile modal trigger */}
          <CompanionProfileHero companion={companion} />

          {/* Chat card */}
          <CompanionChat companion={companion} />

          {/* Café menu button */}
          <div className="w-full flex justify-end">
            <CafeMenuButton
              companionId={companion.id}
              companionName={companion.name}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
