// frontend/config/catalog/characters.ts
// Canonical character catalog (presentation + metadata only)

import type { PersonaId, Persona } from "../personas";
import { PERSONAS_BY_ID } from "../personas";
import { CHARACTER_META } from "../characterMeta";

// ---- Types ----

export type CharacterId = PersonaId;

export interface Character {
  id: CharacterId;
  name: string;
  species: string;
  image: string;        // image filename or path
  traits: string;       // short visual/personality blurb
  persona: Persona;     // injected persona (systemPrompt + bio)
  meta: {
    birthday: string;
    zodiac: string;
    mbti: string;
    bloodType: string;
    recommendations: {
      drink: string;
      snack: string;
      entree: string;
      dessert: string;
    };
  };
}

// ---- Meta lookup ----

const META_BY_ID = CHARACTER_META.characters.reduce(
  (acc, entry) => {
    acc[entry.id as CharacterId] = entry;
    return acc;
  },
  {} as Record<CharacterId, Character["meta"]>
);

// ---- Master character list ----

export const CHARACTERS: Character[] = [
  {
    id: "penny",
    name: "Penny",
    species: "Fennec",
    image: "penny.png",
    traits: "Bright, welcoming, gently playful; expressive ears and warm desert tones.",
    persona: PERSONAS_BY_ID.penny,
    meta: META_BY_ID.penny,
  },
  {
    id: "sandy",
    name: "Sandy",
    species: "Sand Fox",
    image: "sandy.png",
    traits: "Calm and steady; relaxed posture and a soft, grounding presence.",
    persona: PERSONAS_BY_ID.sandy,
    meta: META_BY_ID.sandy,
  },
  {
    id: "mandy",
    name: "Mandy",
    species: "Maned Wolf",
    image: "mandy.png",
    traits: "Thoughtful and composed; tall frame and unhurried movements.",
    persona: PERSONAS_BY_ID.mandy,
    meta: META_BY_ID.mandy,
  },
  {
    id: "cybill",
    name: "Cybill",
    species: "Serval",
    image: "cybill.png",
    traits: "Energetic and capable; athletic build and alert stance.",
    persona: PERSONAS_BY_ID.cybill,
    meta: META_BY_ID.cybill,
  },
  {
    id: "yuki",
    name: "Yuki",
    species: "Snow Leopard",
    image: "yuki.png",
    traits: "Soft-spoken and gentle; pale fur and calming presence.",
    persona: PERSONAS_BY_ID.yuki,
    meta: META_BY_ID.yuki,
  },
  {
    id: "kara",
    name: "Kara",
    species: "Caracal",
    image: "kara.png",
    traits: "Expressive and confident; strong posture and distinctive ear tufts.",
    persona: PERSONAS_BY_ID.kara,
    meta: META_BY_ID.kara,
  },
  {
    id: "zuri",
    name: "Zuri",
    species: "Skunk",
    image: "zuri.png",
    traits: "Lighthearted and self-assured; plush tail and relaxed charm.",
    persona: PERSONAS_BY_ID.zuri,
    meta: META_BY_ID.zuri,
  },
  {
    id: "akane",
    name: "Akane",
    species: "Red Panda",
    image: "akane.png",
    traits: "Warm and quietly affectionate; soft eyes and fluffy tail.",
    persona: PERSONAS_BY_ID.akane,
    meta: META_BY_ID.akane,
  },
  {
    id: "maris",
    name: "Maris",
    species: "Japanese Marten",
    image: "maris.png",
    traits: "Observant and clever; slender build and poised movements.",
    persona: PERSONAS_BY_ID.maris,
    meta: META_BY_ID.maris,
  },
  {
    id: "cora",
    name: "Cora",
    species: "Coati",
    image: "cora.png",
    traits: "Curious and upbeat; ringed tail and exploratory energy.",
    persona: PERSONAS_BY_ID.cora,
    meta: META_BY_ID.cora,
  },
  {
    id: "juni",
    name: "Juni",
    species: "Jerboa",
    image: "juni.png",
    traits: "Bright and earnest; compact frame and alert ears.",
    persona: PERSONAS_BY_ID.juni,
    meta: META_BY_ID.juni,
  },
  {
    id: "nika",
    name: "Nika",
    species: "Tanuki",
    image: "nika.png",
    traits: "Warm and comforting; rounded features and steady gaze.",
    persona: PERSONAS_BY_ID.nika,
    meta: META_BY_ID.nika,
  },
  {
    id: "naomi",
    name: "Naomi",
    species: "Ringtail",
    image: "naomi.png",
    traits: "Playful in a quiet way; striped tail and gentle curiosity.",
    persona: PERSONAS_BY_ID.naomi,
    meta: META_BY_ID.naomi,
  },
  {
    id: "elise",
    name: "Elise",
    species: "Ermine",
    image: "elise.png",
    traits: "Poised and discreet; refined calm and careful listening.",
    persona: PERSONAS_BY_ID.elise,
    meta: META_BY_ID.elise,
  },
  {
    id: "noa",
    name: "Noa",
    species: "Bushbaby",
    image: "noa.png",
    traits: "Gentle and deeply attentive; large eyes and receptive demeanor.",
    persona: PERSONAS_BY_ID.noa,
    meta: META_BY_ID.noa,
  },
];

// ---- Lookup helper ----

export const CHARACTERS_BY_ID: Record<CharacterId, Character> =
  CHARACTERS.reduce((acc, character) => {
    acc[character.id] = character;
    return acc;
  }, {} as Record<CharacterId, Character>);
