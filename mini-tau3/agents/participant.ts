import { system } from "tardie/agent"
import type { ParticipantFactory } from "./banking.ts"

/** Workshop entrypoint: edit this factory, then run `bun run challenge`. */
export const createAgent: ParticipantFactory = (context) => context.defineAgent("participant", [
  system("Be methodical, retrieve primary policy documents, show the customer the essential calculations, and complete every authorized correction and report.", { name: "participant-strategy" }),
])
