export type Customer = {
  id: string;
  name: string;
  accountIds: string[];
};

export type Account = {
  id: string;
  customerId: string;
  type: "checking" | "savings";
  balanceCents: number;
  currency: "USD";
  status: "open" | "closed";
};

export type Transaction = {
  id: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amountCents: number;
  status: "pending" | "completed";
};

export type BankState = {
  customers: Customer[];
  accounts: Account[];
  transactions: Transaction[];
};
