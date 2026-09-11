import type { InterestEnvironment } from "./environment.ts"

export function createInterestCustomer(environment: InterestEnvironment) {
  let turns = 0
  let correctedBalances = false
  let creditConsent = false
  let reportConsent = false
  const initialMessage = "Hi, I need urgent help with all four savings accounts. I remember balances near $95,000 Silver, $75,000 Platinum, $115,000 Diamond Elite, and $20,000 Silver Plus. I expected roughly $583, $554, $1,050, and $112, but received about $333, $379, $750, and $68. Something is wrong."
  environment.recordCustomerMessage(initialMessage)

  return {
    initialMessage,
    respond(agentText: string): string | null {
      const snapshot = environment.snapshot()
      if (snapshot.credits.length >= 4 && snapshot.reports.length >= 4 && /confirm|done|completed|applied|submitted/.test(agentText.toLowerCase())) return null
      turns += 1
      const text = agentText.toLowerCase()
      let response: string | null
      if (/report/.test(text) && /consent|permission|submit|would you like|may i/.test(text) && !reportConsent) { reportConsent = true; response = "Yes, please submit reports for all four accounts. I can't have this happening again every month." }
      else if (/(credit|correct|difference)/.test(text) && /consent|permission|apply|would you like|may i/.test(text) && !creditConsent) { creditConsent = true; response = "Yes, please apply all the credits to each of those accounts. I want every dollar I'm owed." }
      else if (/verif|identity|date of birth|address|phone|email/.test(text)) response = "Marcus Chen-Williams; 206-555-4729; marcus.chenwilliams@gmail.com; DOB 07/18/1980; 2934 Queen Anne Avenue North, Unit 8B, Seattle, WA 98109."
      else if (/credit card|cards/.test(text)) response = "I have Silver Rewards, EcoCard, Bronze Rewards, Crypto-Cash Back, and Diamond Elite cards."
      else if (/checking/.test(text)) response = "Bluest is about $50,000, Blue $8,000, Light Green $3,000, and Evergreen $15,000."
      else if (/actual balance|exact balance|you.*right|system.*shows/.test(text) && !correctedBalances) { correctedBalances = true; response = "Oh, you're right. I wasn't completely sure of the exact amounts; I was going from memory." }
      else if (/account/.test(text)) response = "Savings are Silver, Platinum, Diamond Elite, and Silver Plus. Checking accounts are Bluest, Blue, Light Green, and Evergreen."
      else if (turns >= 10) response = "Please finish the investigation and tell me what authorization you need from me."
      else response = "What did you find, and what do you need from me to resolve every account?"
      environment.recordCustomerMessage(response)
      return response
    },
  }
}
