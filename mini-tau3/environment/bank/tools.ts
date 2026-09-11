import type { Account, Transaction } from "./schema";
import type { createBankState } from "./state";

export type BankStore = ReturnType<typeof createBankState>;

export type BankToolErrorCode =
  | "CUSTOMER_NOT_FOUND"
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_NOT_OWNED"
  | "ACCOUNT_CLOSED"
  | "INVALID_AMOUNT"
  | "BALANCE_OVERFLOW"
  | "SAME_ACCOUNT"
  | "INSUFFICIENT_FUNDS"
  | "PENDING_TRANSACTIONS";

// BankToolError gives an agent adapter a stable, user-safe reason for a rejected action.
export class BankToolError extends Error {
  constructor(
    public readonly code: BankToolErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BankToolError";
  }
}

export type TransferInput = {
  customerId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amountCents: number;
};

export type CloseAccountInput = {
  customerId: string;
  accountId: string;
};

// createBankTools is the environment boundary for the workshop agent. It reads and
// mutates the supplied in-memory bank state while enforcing the bank's hard rules.
export function createBankTools(bank: BankStore) {
  function requireCustomer(customerId: string): void {
    if (!bank.state.customers.some((customer) => customer.id === customerId)) {
      throw new BankToolError("CUSTOMER_NOT_FOUND", "Customer was not found.");
    }
  }

  function requireOwnedAccount(customerId: string, accountId: string): Account {
    requireCustomer(customerId);
    const account = bank.state.accounts.find((item) => item.id === accountId);

    if (!account) {
      throw new BankToolError("ACCOUNT_NOT_FOUND", "Account was not found.");
    }
    if (account.customerId !== customerId) {
      throw new BankToolError(
        "ACCOUNT_NOT_OWNED",
        "This account does not belong to the customer.",
      );
    }

    return account;
  }

  function requireOpen(account: Account): void {
    if (account.status !== "open") {
      throw new BankToolError("ACCOUNT_CLOSED", "This account is closed.");
    }
  }

  function nextTransactionId(): string {
    const usedIds = new Set(bank.state.transactions.map((transaction) => transaction.id));
    let sequence = 1;
    while (usedIds.has(`transaction_${sequence}`)) {
      sequence += 1;
    }
    return `transaction_${sequence}`;
  }

  return {
    listAccounts(customerId: string): Account[] {
      requireCustomer(customerId);
      return structuredClone(
        bank.state.accounts.filter((account) => account.customerId === customerId),
      );
    },

    getAccount(input: CloseAccountInput): Account {
      return structuredClone(requireOwnedAccount(input.customerId, input.accountId));
    },

    transfer(input: TransferInput): Transaction {
      const { customerId, sourceAccountId, destinationAccountId, amountCents } = input;
      const source = requireOwnedAccount(customerId, sourceAccountId);
      const destination = requireOwnedAccount(customerId, destinationAccountId);

      if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
        throw new BankToolError(
          "INVALID_AMOUNT",
          "Transfer amount must be a positive whole number of cents.",
        );
      }
      if (source.id === destination.id) {
        throw new BankToolError(
          "SAME_ACCOUNT",
          "Source and destination accounts must be different.",
        );
      }

      requireOpen(source);
      requireOpen(destination);

      if (source.balanceCents < amountCents) {
        throw new BankToolError(
          "INSUFFICIENT_FUNDS",
          "The source account does not have enough available funds.",
        );
      }
      if (!Number.isSafeInteger(destination.balanceCents + amountCents)) {
        throw new BankToolError(
          "BALANCE_OVERFLOW",
          "The destination balance would exceed the supported amount range.",
        );
      }

      source.balanceCents -= amountCents;
      destination.balanceCents += amountCents;

      const transaction: Transaction = {
        id: nextTransactionId(),
        sourceAccountId: source.id,
        destinationAccountId: destination.id,
        amountCents,
        status: "completed",
      };
      bank.state.transactions.push(transaction);
      return structuredClone(transaction);
    },

    closeAccount(input: CloseAccountInput): Account {
      const account = requireOwnedAccount(input.customerId, input.accountId);
      requireOpen(account);

      if (account.balanceCents !== 0) {
        throw new BankToolError(
          "INVALID_AMOUNT",
          "An account must have a zero balance before it can be closed.",
        );
      }
      if (
        bank.state.transactions.some(
          (transaction) =>
            transaction.status === "pending" &&
            (transaction.sourceAccountId === account.id ||
              transaction.destinationAccountId === account.id),
        )
      ) {
        throw new BankToolError(
          "PENDING_TRANSACTIONS",
          "An account with pending transactions cannot be closed.",
        );
      }

      account.status = "closed";
      return structuredClone(account);
    },
  };
}
