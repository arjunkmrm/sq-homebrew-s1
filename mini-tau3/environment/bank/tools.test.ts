import assert from "node:assert/strict";
import test from "node:test";
import { createBankTools, BankToolError } from "./tools";
import { createBankState, loadSeedState } from "./state";

async function makeTools() {
  return createBankTools(createBankState(await loadSeedState()));
}

test("transfers between a customer's open accounts and records the transaction", async () => {
  const tools = await makeTools();
  const transaction = tools.transfer({
    customerId: "customer_alex",
    sourceAccountId: "account_alex_savings",
    destinationAccountId: "account_alex_checking",
    amountCents: 50_000,
  });

  assert.equal(transaction.status, "completed");
  assert.equal(tools.getAccount({ customerId: "customer_alex", accountId: "account_alex_savings" }).balanceCents, 300_000);
  assert.equal(tools.getAccount({ customerId: "customer_alex", accountId: "account_alex_checking" }).balanceCents, 175_000);
});

test("rejects transfers outside ownership, balance, and valid amounts", async () => {
  const tools = await makeTools();

  for (const input of [
    { customerId: "customer_alex", sourceAccountId: "account_alex_savings", destinationAccountId: "account_jordan_checking", amountCents: 100 },
    { customerId: "customer_alex", sourceAccountId: "account_alex_savings", destinationAccountId: "account_alex_checking", amountCents: 350_001 },
    { customerId: "customer_alex", sourceAccountId: "account_alex_savings", destinationAccountId: "account_alex_checking", amountCents: 0 },
  ]) {
    assert.throws(() => tools.transfer(input), BankToolError);
  }
});

test("closes only a zero-balance account without pending transactions", async () => {
  const state = createBankState(await loadSeedState());
  const tools = createBankTools(state);

  tools.transfer({
    customerId: "customer_alex",
    sourceAccountId: "account_alex_savings",
    destinationAccountId: "account_alex_checking",
    amountCents: 350_000,
  });
  assert.equal(
    tools.closeAccount({ customerId: "customer_alex", accountId: "account_alex_savings" }).status,
    "closed",
  );

  state.state.accounts.find((account) => account.id === "account_jordan_savings")!.balanceCents = 0;
  state.state.transactions.push({
    id: "transaction_pending",
    sourceAccountId: "account_jordan_savings",
    destinationAccountId: "account_jordan_checking",
    amountCents: 1,
    status: "pending",
  });
  assert.throws(
    () => tools.closeAccount({ customerId: "customer_jordan", accountId: "account_jordan_savings" }),
    BankToolError,
  );
});

test("does not mutate balances when a destination balance would overflow", async () => {
  const state = createBankState(await loadSeedState());
  const tools = createBankTools(state);
  state.state.accounts.find((account) => account.id === "account_alex_checking")!.balanceCents =
    Number.MAX_SAFE_INTEGER;

  assert.throws(
    () =>
      tools.transfer({
        customerId: "customer_alex",
        sourceAccountId: "account_alex_savings",
        destinationAccountId: "account_alex_checking",
        amountCents: 1,
      }),
    BankToolError,
  );
  assert.equal(
    tools.getAccount({ customerId: "customer_alex", accountId: "account_alex_savings" }).balanceCents,
    350_000,
  );
});

test("allocates the first unused deterministic transaction ID", async () => {
  const state = createBankState(await loadSeedState());
  state.state.transactions.push({
    id: "transaction_2",
    sourceAccountId: "account_jordan_savings",
    destinationAccountId: "account_jordan_checking",
    amountCents: 10,
    status: "completed",
  });
  const tools = createBankTools(state);

  const transaction = tools.transfer({
    customerId: "customer_alex",
    sourceAccountId: "account_alex_savings",
    destinationAccountId: "account_alex_checking",
    amountCents: 100,
  });

  assert.equal(transaction.id, "transaction_1");
});
