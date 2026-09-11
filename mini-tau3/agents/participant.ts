import type { ParticipantFactory } from "./banking.ts"

// Everyone starts with the same baseline: system instructions, search, and banking tools.
export const createAgent: ParticipantFactory = (context) => context.defineAgent("participant")
