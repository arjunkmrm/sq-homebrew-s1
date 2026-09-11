import { readFile } from "node:fs/promises"
import type { CaseRun } from "../types.ts"

export async function loadSavedRuns(file: string): Promise<CaseRun[]> {
  const value: unknown = JSON.parse(await readFile(file, "utf8"))
  if (typeof value !== "object" || value === null) throw new Error("saved run must be a JSON object")
  const runs = Array.isArray((value as { cases?: unknown }).cases)
    ? (value as { cases: unknown[] }).cases
    : [value]
  if (!runs.every(run => typeof run === "object" && run !== null && typeof (run as { id?: unknown }).id === "string")) {
    throw new Error("saved run must contain case objects with an id")
  }
  return runs as CaseRun[]
}
