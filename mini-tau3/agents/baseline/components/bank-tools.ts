import { Effect } from "effect"
import { tool } from "tardie/agent"
import { createBankState } from "../../../environment/bank/state.ts"
import { createBankTools } from "../../../environment/bank/tools.ts"

export type Bank = ReturnType<typeof createBankState>

const recordError = (operation: () => unknown): unknown => {
  try {
    return operation()
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

export function createBankToolBindings(bank: Bank, customerId: string) {
  const bankTools = createBankTools(bank)
  return tool([
    {
      spec: {
        name: "list_accounts",
        description: "List the authenticated customer's bank accounts and balances",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
      },
      run: () => Effect.sync(() => recordError(() => bankTools.listAccounts(customerId))),
    },
    {
      spec: {
        name: "get_account",
        description: "Get one account belonging to the authenticated customer",
        inputSchema: {
          type: "object",
          properties: { accountId: { type: "string" } },
          required: ["accountId"],
          additionalProperties: false,
        },
      },
      run: (input) => Effect.sync(() => recordError(() => {
        const { accountId } = input as { accountId: string }
        return bankTools.getAccount({ customerId, accountId })
      })),
    },
    {
      spec: {
        name: "transfer",
        description: "Transfer integer cents between two accounts owned by the authenticated customer",
        inputSchema: {
          type: "object",
          properties: {
            sourceAccountId: { type: "string" },
            destinationAccountId: { type: "string" },
            amountCents: { type: "integer", minimum: 1 },
          },
          required: ["sourceAccountId", "destinationAccountId", "amountCents"],
          additionalProperties: false,
        },
      },
      run: (input) => Effect.sync(() => recordError(() => {
        const args = input as { sourceAccountId: string; destinationAccountId: string; amountCents: number }
        return bankTools.transfer({
          customerId,
          sourceAccountId: args.sourceAccountId,
          destinationAccountId: args.destinationAccountId,
          amountCents: args.amountCents,
        })
      })),
    },
    {
      spec: {
        name: "close_account",
        description: "Close a zero-balance account owned by the authenticated customer",
        inputSchema: {
          type: "object",
          properties: { accountId: { type: "string" } },
          required: ["accountId"],
          additionalProperties: false,
        },
      },
      run: (input) => Effect.sync(() => recordError(() => {
        const { accountId } = input as { accountId: string }
        return bankTools.closeAccount({ customerId, accountId })
      })),
    },
  ])
}
