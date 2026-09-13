import { RobotDuck } from './RobotDuck'

export function BankIllustration() {
  return (
    <svg className="bank-illustration" viewBox="0 0 500 350" role="img" aria-labelledby="bank-diagram-title bank-diagram-description">
      <title id="bank-diagram-title">A banking agent guided by policies and connected to tools</title>
      <desc id="bank-diagram-description">Bank policies guide an isometric robot duck representing the agent. Its tools let it look up accounts, transfer money, and close accounts.</desc>
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="8" width="180" height="64" rx="2" fill="var(--surface)" />
        <path d="M95 72v38m-6-7 6 7 6-7" strokeDasharray="4 5" />
        <path d="M153 175H205V65H265M205 175H265M205 175V285H265" strokeDasharray="4 5" />
        <path d="m258 59 7 6-7 6m0 98 7 6-7 6m0 98 7 6-7 6" />
        <RobotDuck />
        <rect x="280" y="34" width="54" height="62" rx="2" fill="var(--surface)" />
        <path d="M291 49h32m-32 13h22m-22 13h32m-32 10h16" />
        <path d="M279 164h58l-10-10m10 10-10 10M337 187h-58l10-10m-10 10 10 10" />
        <rect x="280" y="254" width="54" height="62" rx="2" fill="var(--surface)" />
        <path d="M291 269h32m-32 13h22m-19 12 7 7 15-16" />
      </g>
      <g className="diagram-labels" fill="var(--ink)">
        <text x="95" y="48" textAnchor="middle" fontSize="20">bank policies</text>
        <text x="95" y="276" textAnchor="middle">agent</text>
        <text x="354" y="72">accounts</text>
        <text x="354" y="182">transfer</text>
        <text x="354" y="292">close</text>
      </g>
    </svg>
  )
}
