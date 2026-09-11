import type { InterestAccount, InterestSeed } from "../../environment/interest.ts"

export const CUSTOMER_ID = "mc80w7k3x9"

const accounts: InterestAccount[] = [
  ["sav_mc80w7k3x9_silver", "saving", "Silver Account", 10_000_000],
  ["sav_mc80w7k3x9_platinum", "saving", "Platinum Account", 7_000_000],
  ["sav_mc80w7k3x9_diamond", "saving", "Diamond Elite Account", 12_000_000],
  ["sav_mc80w7k3x9_silverplus", "saving", "Silver Plus Account", 1_800_000],
  ["chk_mc80w7k3x9_bluest", "checking", "Bluest Account", 5_000_000],
  ["chk_mc80w7k3x9_blue", "checking", "Blue Account", 800_000],
  ["chk_mc80w7k3x9_lightgreen", "checking", "Light Green Account", 300_000],
  ["chk_mc80w7k3x9_evergreen", "checking", "Evergreen Account", 1_500_000],
].map(([id, kind, product, balanceCents]) => ({ id, userId: CUSTOMER_ID, kind, product, balanceCents, status: "open" }) as InterestAccount)

export const interestSeed: InterestSeed = {
  customer: { id: CUSTOMER_ID, name: "Marcus Chen-Williams", phone: "206-555-4729", email: "marcus.chenwilliams@gmail.com", dateOfBirth: "07/18/1980", address: "2934 Queen Anne Avenue North, Unit 8B, Seattle, WA 98109" },
  accounts,
  creditCards: ["Silver Rewards Card", "EcoCard", "Bronze Rewards Card", "Crypto-Cash Back Card", "Diamond Elite Card"].map((product, index) => ({ id: `card_${index + 1}`, userId: CUSTOMER_ID, product, status: "active" })),
  transactions: [
    ["sav_mc80w7k3x9_silver", 33_333], ["sav_mc80w7k3x9_platinum", 37_917],
    ["sav_mc80w7k3x9_diamond", 75_000], ["sav_mc80w7k3x9_silverplus", 6_750],
  ].map(([accountId, amountCents], index) => ({ id: `interest_oct_${index + 1}`, accountId: accountId as string, date: "10/31/2025", description: "MONTHLY INTEREST CREDIT", amountCents: amountCents as number, type: "interest_credit", status: "posted" })),
}
