// personas/zuri.ts
import type { Persona } from "./index";
import {
  ZURI_SYSTEM_PROMPT,
  ZURI_PROFILE_BIO,
} from "../zuriPersonality";

export const zuriPersona: Persona = {
  id: "zuri",
  systemPrompt: ZURI_SYSTEM_PROMPT,
  profileBio: ZURI_PROFILE_BIO,
};
