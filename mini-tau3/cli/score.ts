import { scoreSavedRun } from "../rewards/score.ts"
import { loadSavedRuns } from "./saved-runs.ts"

export async function scoreSavedRuns(file: string) {
  const runs = await loadSavedRuns(file)
  const results = runs.map(run => {
    try { return { id: run.id, ...scoreSavedRun(run) } }
    catch (error) { return { id: run.id, error: error instanceof Error ? error.message : String(error) } }
  })
  console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2))
}
