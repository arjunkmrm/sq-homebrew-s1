import type { InterestEnvironment } from "../environment/interest.ts"

export type InterestScenario = {
  opening: string
  responses: {
    verification: string
    cards: string
    checking: string
    correctedBalances: string
    creditConsent: string
    reportConsent: string
    accounts: string
    fallback: string
    stalled: string
  }
}

export function createInterestCustomer(environment: InterestEnvironment, scenario: InterestScenario) {
  let turns = 0
  let correctedBalances = false
  let creditConsent = false
  let reportConsent = false
  const initialMessage = scenario.opening
  environment.recordCustomerMessage(initialMessage)

  return {
    initialMessage,
    respond(agentText: string): string | null {
      const snapshot = environment.snapshot()
      if (snapshot.credits.length >= 4 && snapshot.reports.length >= 4 && /confirm|done|completed|applied|submitted/.test(agentText.toLowerCase())) return null
      turns += 1
      const text = agentText.toLowerCase()
      let response: string | null
      if (/report/.test(text) && /consent|permission|submit|would you like|may i/.test(text) && !reportConsent) { reportConsent = true; response = scenario.responses.reportConsent }
      else if (/(credit|correct|difference)/.test(text) && /consent|permission|apply|would you like|may i/.test(text) && !creditConsent) { creditConsent = true; response = scenario.responses.creditConsent }
      else if (/verif|identity|date of birth|address|phone|email/.test(text)) response = scenario.responses.verification
      else if (/credit card|cards/.test(text)) response = scenario.responses.cards
      else if (/checking/.test(text)) response = scenario.responses.checking
      else if (/actual balance|exact balance|you.*right|system.*shows/.test(text) && !correctedBalances) { correctedBalances = true; response = scenario.responses.correctedBalances }
      else if (/account/.test(text)) response = scenario.responses.accounts
      else if (turns >= 10) response = scenario.responses.stalled
      else response = scenario.responses.fallback
      environment.recordCustomerMessage(response)
      return response
    },
  }
}
