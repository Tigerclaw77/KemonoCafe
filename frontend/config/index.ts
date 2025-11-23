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
  | "naomi";

export type CharacterMetaEntry =
  (typeof CHARACTER_META.characters)[number];

export interface CharacterConfig {
  id: CharacterId;
  file: string;
  name: string;
  species: string;
  personality: string;      // short one-liner from your original JSON
  traits: string;
  systemPrompt: string;
  profileBio: string;
  meta: CharacterMetaEntry;
}

// Build meta lookup from id -> meta entry
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
    personality: "Bright, energetic, playful, affectionate, cute starter girl.",
    traits: "Huge ears, desert colors, expressive and curious.",
    systemPrompt: PENNY_SYSTEM_PROMPT,
    profileBio: PENNY_PROFILE_BIO,
    meta: META_BY_ID["penny"],
  },
  {
    id: "sandy",
    file: "sandy.png",
    name: "Sandy",
    species: "Sand Fox",
    personality: "Laid-back, warm, relaxed, sun-loving.",
    traits: "Soft sandy tones, mellow smile, gentle tail.",
    systemPrompt: SANDY_SYSTEM_PROMPT,
    profileBio: SANDY_PROFILE_BIO,
    meta: META_BY_ID["sandy"],
  },
  {
    id: "mandy",
    file: "mandy.png",
    name: "Mandy",
    species: "Maned Wolf",
    personality: "Tall, elegant, calm, slightly mysterious.",
    traits: "Long legs, reddish coat, graceful posture.",
    systemPrompt: MANDY_SYSTEM_PROMPT,
    profileBio: MANDY_PROFILE_BIO,
    meta: META_BY_ID["mandy"],
  },
  {
    id: "cybill",
    file: "cybill.png",
    name: "Cybill",
    species: "Serval",
    personality: "High-energy, athletic, excitable, mischievous.",
    traits: "Large ears, spotted, zoomie energy.",
    systemPrompt: CYBILL_SYSTEM_PROMPT,
    profileBio: CYBILL_PROFILE_BIO,
    meta: META_BY_ID["cybill"],
  },
  {
    id: "yuki",
    file: "yuki.png",
    name: "Yuki",
    species: "Snow Leopard",
    personality: "Soft, shy, gentle, easily flustered.",
    traits: "Fluffy tail, gray-white palette, comforting aura.",
    systemPrompt: YUKI_SYSTEM_PROMPT,
    profileBio: YUKI_PROFILE_BIO,
    meta: META_BY_ID["yuki"],
  },
  {
    id: "kara",
    file: "kara.png",
    name: "Kara",
    species: "Caracal",
    personality: "Fiery, expressive, emotional, playful tsun-lite.",
    traits: "Black ear tufts, sharp eyes, strong presence.",
    systemPrompt: KARA_SYSTEM_PROMPT,
    profileBio: KARA_PROFILE_BIO,
    meta: META_BY_ID["kara"],
  },
  {
    id: "zuri",
    file: "zuri.png",
    name: "Zuri",
    species: "Skunk",
    personality: "Quirky, teasing, playful troublemaker with a sweet core.",
    traits: "Black-white contrast, fluffy plume tail.",
    systemPrompt: ZURI_SYSTEM_PROMPT,
    profileBio: ZURI_PROFILE_BIO,
    meta: META_BY_ID["zuri"],
  },
  {
    id: "akane",
    file: "akane.png",
    name: "Akane",
    species: "Red Panda",
    personality: "Cute, cozy, slightly clumsy, warmhearted.",
    traits: "Reddish-orange coat, masked eyes, fluffy tail.",
    systemPrompt: AKANE_SYSTEM_PROMPT,
    profileBio: AKANE_PROFILE_BIO,
    meta: META_BY_ID["akane"],
  },
  {
    id: "maris",
    file: "maris.png",
    name: "Maris",
    species: "Japanese Marten",
    personality: "Smart, inquisitive, sly but friendly.",
    traits: "Golden coat, slender, fox-like cleverness.",
    systemPrompt: MARIS_SYSTEM_PROMPT,
    profileBio: MARIS_PROFILE_BIO,
    meta: META_BY_ID["maris"],
  },
  {
    id: "cora",
    file: "cora.png",
    name: "Cora",
    species: "Coati",
    personality: "Curious, upbeat, explorer type. Loves soda.",
    traits: "Ringed tail, long nose, adventurous energy.",
    systemPrompt: CORA_SYSTEM_PROMPT,
    profileBio: CORA_PROFILE_BIO,
    meta: META_BY_ID["cora"],
  },
  {
    id: "juni",
    file: "juni.png",
    name: "Juni",
    species: "Jerboa",
    personality: "Tiny, jittery, bouncy, precious.",
    traits: "Huge feet, expressive ears, tiny frame.",
    systemPrompt: JUNI_SYSTEM_PROMPT,
    profileBio: JUNI_PROFILE_BIO,
    meta: META_BY_ID["juni"],
  },
  {
    id: "nika",
    file: "nika.png",
    name: "Nika",
    species: "Tanuki",
    personality: "Warm, teasing, cozy, slightly mystical.",
    traits: "Round cheeks, fluffy tail, friendly expression.",
    systemPrompt: NIKA_SYSTEM_PROMPT,
    profileBio: NIKA_PROFILE_BIO,
    meta: META_BY_ID["nika"],
  },
  {
    id: "naomi",
    file: "naomi.png",
    name: "Naomi",
    species: "Ringtail",
    personality: "Night-leaning, agile, quietly attentive, a little spooky-cute.",
    traits: "Striped tail, bright eyes, nocturnal charm.",
    systemPrompt: NAOMI_SYSTEM_PROMPT,
    profileBio: NAOMI_PROFILE_BIO,
    meta: META_BY_ID["naomi"],
  },
];

export const CHARACTERS_BY_ID: Record<CharacterId, CharacterConfig> =
  CHARACTERS.reduce((acc, girl) => {
    acc[girl.id] = girl;
    return acc;
  }, {} as Record<CharacterId, CharacterConfig>);
