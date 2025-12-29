// frontend/components/config/index.ts

import { CHARACTER_META } from "./characterMeta";

import {
  PENNY_SYSTEM_PROMPT,
  PENNY_PROFILE_BIO,
} from "./pennyPersonality";

import {
  SANDY_SYSTEM_PROMPT,
  SANDY_PROFILE_BIO,
} from "./sandyPersonality";

import {
  MANDY_SYSTEM_PROMPT,
  MANDY_PROFILE_BIO,
} from "./mandyPersonality";

import {
  CYBILL_SYSTEM_PROMPT,
  CYBILL_PROFILE_BIO,
} from "./cybillPersonality";

import {
  YUKI_SYSTEM_PROMPT,
  YUKI_PROFILE_BIO,
} from "./yukiPersonality";

import {
  KARA_SYSTEM_PROMPT,
  KARA_PROFILE_BIO,
} from "./karaPersonality";

import {
  ZURI_SYSTEM_PROMPT,
  ZURI_PROFILE_BIO,
} from "./zuriPersonality";

import {
  AKANE_SYSTEM_PROMPT,
  AKANE_PROFILE_BIO,
} from "./akanePersonality";

import {
  MARIS_SYSTEM_PROMPT,
  MARIS_PROFILE_BIO,
} from "./marisPersonality";

import {
  CORA_SYSTEM_PROMPT,
  CORA_PROFILE_BIO,
} from "./coraPersonality";

import {
  JUNI_SYSTEM_PROMPT,
  JUNI_PROFILE_BIO,
} from "./juniPersonality";

import {
  NIKA_SYSTEM_PROMPT,
  NIKA_PROFILE_BIO,
} from "./nikaPersonality";

import {
  NAOMI_SYSTEM_PROMPT,
  NAOMI_PROFILE_BIO,
} from "./naomiPersonality";

// ---- Types ----

export type CharacterId =
  | "penny"
  | "sandy"
  | "mandy"
  | "cybill"
  | "yuki"
  | "kara"
  | "zuri"
  | "akane"
  | "maris"
  | "cora"
  | "juni"
  | "nika"
  | "naomi"
  | "elise"
  | "noa";

export type CharacterMetaEntry =
  (typeof CHARACTER_META.characters)[number];

export interface CharacterConfig {
  id: CharacterId;
  file: string;
  name: string;
  species: string;
  personality: string;
  traits: string;
  systemPrompt: string;
  profileBio: string;
  meta: CharacterMetaEntry;
}

// Build meta lookup
const META_BY_ID: Record<CharacterId, CharacterMetaEntry> =
  CHARACTER_META.characters.reduce((acc, entry) => {
    acc[entry.id as CharacterId] = entry as CharacterMetaEntry;
    return acc;
  }, {} as Record<CharacterId, CharacterMetaEntry>);

// ---- Master character list ----

export const CHARACTERS: CharacterConfig[] = [
  {
    id: "penny",
    file: "penny.png",
    name: "Penny",
    species: "Fennec",
    personality: "Bright, welcoming, and gently playful; eager to make guests feel at home.",
    traits: "Large ears, warm desert tones, expressive and attentive.",
    systemPrompt: PENNY_SYSTEM_PROMPT,
    profileBio: PENNY_PROFILE_BIO,
    meta: META_BY_ID["penny"],
  },
  {
    id: "sandy",
    file: "sandy.png",
    name: "Sandy",
    species: "Sand Fox",
    personality: "Calm, steady, and content; enjoys quiet company and shared moments.",
    traits: "Soft sandy palette, relaxed posture, gentle presence.",
    systemPrompt: SANDY_SYSTEM_PROMPT,
    profileBio: SANDY_PROFILE_BIO,
    meta: META_BY_ID["sandy"],
  },
  {
    id: "mandy",
    file: "mandy.png",
    name: "Mandy",
    species: "Maned Wolf",
    personality: "Composed and thoughtful; slow to react but deeply sincere once engaged.",
    traits: "Tall frame, long legs, calm and grounded demeanor.",
    systemPrompt: MANDY_SYSTEM_PROMPT,
    profileBio: MANDY_PROFILE_BIO,
    meta: META_BY_ID["mandy"],
  },
  {
    id: "cybill",
    file: "cybill.png",
    name: "Cybill",
    species: "Serval",
    personality: "Energetic and capable, with a focused attentiveness beneath her activity.",
    traits: "Large ears, athletic build, alert stance.",
    systemPrompt: CYBILL_SYSTEM_PROMPT,
    profileBio: CYBILL_PROFILE_BIO,
    meta: META_BY_ID["cybill"],
  },
  {
    id: "yuki",
    file: "yuki.png",
    name: "Yuki",
    species: "Snow Leopard",
    personality: "Soft-spoken and gentle; offers quiet comfort without pressure.",
    traits: "Pale fur, fluffy tail, calming presence.",
    systemPrompt: YUKI_SYSTEM_PROMPT,
    profileBio: YUKI_PROFILE_BIO,
    meta: META_BY_ID["yuki"],
  },
  {
    id: "kara",
    file: "kara.png",
    name: "Kara",
    species: "Caracal",
    personality: "Expressive and confident, with a playful warmth rather than sharpness.",
    traits: "Distinct ear tufts, strong posture, clear gaze.",
    systemPrompt: KARA_SYSTEM_PROMPT,
    profileBio: KARA_PROFILE_BIO,
    meta: META_BY_ID["kara"],
  },
  {
    id: "zuri",
    file: "zuri.png",
    name: "Zuri",
    species: "Skunk",
    personality: "Lighthearted and self-assured; comfortable being herself without spectacle.",
    traits: "Bold contrast, plush tail, relaxed charm.",
    systemPrompt: ZURI_SYSTEM_PROMPT,
    profileBio: ZURI_PROFILE_BIO,
    meta: META_BY_ID["zuri"],
  },
  {
    id: "akane",
    file: "akane.png",
    name: "Akane",
    species: "Red Panda",
    personality: "Warm and quietly affectionate, hoping for a gentle spark.",
    traits: "Reddish tones, soft eyes, fluffy tail.",
    systemPrompt: AKANE_SYSTEM_PROMPT,
    profileBio: AKANE_PROFILE_BIO,
    meta: META_BY_ID["akane"],
  },
  {
    id: "maris",
    file: "maris.png",
    name: "Maris",
    species: "Japanese Marten",
    personality: "Observant and clever, offering thoughtful conversation when invited.",
    traits: "Slender build, bright eyes, poised movements.",
    systemPrompt: MARIS_SYSTEM_PROMPT,
    profileBio: MARIS_PROFILE_BIO,
    meta: META_BY_ID["maris"],
  },
  {
    id: "cora",
    file: "cora.png",
    name: "Cora",
    species: "Coati",
    personality: "Curious and upbeat, enjoying shared discoveries and casual chatter.",
    traits: "Ringed tail, lively posture, exploratory energy.",
    systemPrompt: CORA_SYSTEM_PROMPT,
    profileBio: CORA_PROFILE_BIO,
    meta: META_BY_ID["cora"],
  },
  {
    id: "juni",
    file: "juni.png",
    name: "Juni",
    species: "Jerboa",
    personality: "Bright and earnest, bringing lightness without demanding attention.",
    traits: "Large feet, alert ears, compact frame.",
    systemPrompt: JUNI_SYSTEM_PROMPT,
    profileBio: JUNI_PROFILE_BIO,
    meta: META_BY_ID["juni"],
  },
  {
    id: "nika",
    file: "nika.png",
    name: "Nika",
    species: "Tanuki",
    personality: "Warm and comforting, with a touch of old-world calm.",
    traits: "Rounded features, fluffy tail, steady gaze.",
    systemPrompt: NIKA_SYSTEM_PROMPT,
    profileBio: NIKA_PROFILE_BIO,
    meta: META_BY_ID["nika"],
  },
  {
    id: "naomi",
    file: "naomi.png",
    name: "Naomi",
    species: "Ringtail",
    personality: "Playful in a quiet way; enjoys being present without center stage.",
    traits: "Striped tail, relaxed stance, gentle curiosity.",
    systemPrompt: NAOMI_SYSTEM_PROMPT,
    profileBio: NAOMI_PROFILE_BIO,
    meta: META_BY_ID["naomi"],
  },
  {
    id: "elise",
    file: "elise.png",
    name: "Elise",
    species: "Ermine",
    personality: "Poised and discreet; a confidant who listens carefully and speaks with intent.",
    traits: "White fur, composed posture, refined calm.",
    systemPrompt: "", // TODO: add elisePersonality.ts
    profileBio: "",
    meta: META_BY_ID["elise"],
  },
  {
    id: "noa",
    file: "noa.png",
    name: "Noa",
    species: "Bushbaby",
    personality: "Gentle and deeply attentive; offers emotional safety through listening.",
    traits: "Large eyes, soft presence, receptive demeanor.",
    systemPrompt: "", // TODO: add noaPersonality.ts
    profileBio: "",
    meta: META_BY_ID["noa"],
  },
];

export const CHARACTERS_BY_ID: Record<CharacterId, CharacterConfig> =
  CHARACTERS.reduce((acc, girl) => {
    acc[girl.id] = girl;
    return acc;
  }, {} as Record<CharacterId, CharacterConfig>);
