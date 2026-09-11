import { readFile } from "node:fs/promises";
import type { BankState } from "./schema";

// loadSeedState loads the workshop's trusted JSON fixtures into fresh memory.
export async function loadSeedState(): Promise<BankState> {
  const [customers, accounts, transactions] = await Promise.all(
    ["customers", "accounts", "transactions"].map(async (name) => {
      const file = new URL(`./seed/${name}.json`, import.meta.url);
      return JSON.parse(await readFile(file, "utf8"));
    }),
  );

  return { customers, accounts, transactions };
}

// createBankState isolates a mutable run from its initial state and snapshots.
export function createBankState(initialState: BankState) {
  const initial = structuredClone(initialState);
  const state = structuredClone(initial);

  return {
    state,
    snapshot(): BankState {
      return structuredClone(state);
    },
    // reset restores all collections while preserving the top-level state object.
    reset(): void {
      Object.assign(state, structuredClone(initial));
    },
  };
}
