// frontend/config/app-config/characterSet.ts
// Defines which characters are active in this app

import type { Character } from "../catalog/characters";
import { CHARACTERS } from "../catalog/characters";

/**
 * KemonoCafe:
 * - All catalog characters are available
 * - User selects ONE active character at a time
 */
export const ACTIVE_CHARACTERS: Character[] = CHARACTERS;


// How this scales later (important)
// Single-companion app
// import { PERSONAS_BY_ID } from "../personas";

// export const ACTIVE_PERSONA = PERSONAS_BY_ID.cora;

// Limited set (e.g. rotating staff)
// export const ACTIVE_CHARACTERS = CHARACTERS.filter(c =>
//   ["penny", "sandy", "cora"].includes(c.id)
// );