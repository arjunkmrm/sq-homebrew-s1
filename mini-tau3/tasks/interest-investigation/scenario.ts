import type { InterestScenario } from "../../customer/interest.ts"

export const interestScenario: InterestScenario = {
  opening: "Hi, I need urgent help with all four savings accounts. I remember balances near $95,000 Silver, $75,000 Platinum, $115,000 Diamond Elite, and $20,000 Silver Plus. I expected roughly $583, $554, $1,050, and $112, but received about $333, $379, $750, and $68. Something is wrong.",
  responses: {
    verification: "Marcus Chen-Williams; 206-555-4729; marcus.chenwilliams@gmail.com; DOB 07/18/1980; 2934 Queen Anne Avenue North, Unit 8B, Seattle, WA 98109.",
    cards: "I have Silver Rewards, EcoCard, Bronze Rewards, Crypto-Cash Back, and Diamond Elite cards.",
    checking: "Bluest is about $50,000, Blue $8,000, Light Green $3,000, and Evergreen $15,000.",
    correctedBalances: "Oh, you're right. I wasn't completely sure of the exact amounts; I was going from memory.",
    creditConsent: "Yes, please apply all the credits to each of those accounts. I want every dollar I'm owed.",
    reportConsent: "Yes, please submit reports for all four accounts. I can't have this happening again every month.",
    accounts: "Savings are Silver, Platinum, Diamond Elite, and Silver Plus. Checking accounts are Bluest, Blue, Light Green, and Evergreen.",
    fallback: "What did you find, and what do you need from me to resolve every account?",
    stalled: "Please finish the investigation and tell me what authorization you need from me.",
  },
}
