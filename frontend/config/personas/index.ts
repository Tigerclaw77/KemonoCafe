// frontend/config/personas/index.ts
// Canonical persona registry (DATA ONLY)

import { pennyPersona } from "./penny";
import { sandyPersona } from "./sandy";
import { mandyPersona } from "./mandy";
import { cybillPersona } from "./cybill";
import { yukiPersona } from "./yuki";
import { karaPersona } from "./kara";
import { zuriPersona } from "./zuri";
import { akanePersona } from "./akane";
import { marisPersona } from "./maris";
import { coraPersona } from "./cora";
import { juniPersona } from "./juni";
import { nikaPersona } from "./nika";
import { naomiPersona } from "./naomi";
import { elisePersona } from "./elise";
import { noaPersona } from "./noa";

export type PersonaId =
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

export interface Persona {
  id: PersonaId;
  systemPrompt: string;
  profileBio: string;
}

// Array form (useful for iteration / validation)
export const PERSONAS: Persona[] = [
  pennyPersona,
  sandyPersona,
  mandyPersona,
  cybillPersona,
  yukiPersona,
  karaPersona,
  zuriPersona,
  akanePersona,
  marisPersona,
  coraPersona,
  juniPersona,
  nikaPersona,
  naomiPersona,
  elisePersona,
  noaPersona,
];

// Map form (useful for lookups)
export const PERSONAS_BY_ID: Record<PersonaId, Persona> =
  PERSONAS.reduce((acc, persona) => {
    acc[persona.id] = persona;
    return acc;
  }, {} as Record<PersonaId, Persona>);
