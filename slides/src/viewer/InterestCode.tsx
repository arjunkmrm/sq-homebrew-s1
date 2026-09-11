import { useState } from 'react'
import actor from '../../../mini-tau3/tasks/interest-investigation/actor.ts?raw'
import environment from '../../../mini-tau3/tasks/interest-investigation/environment.ts?raw'
import customer from '../../../mini-tau3/tasks/interest-investigation/customer.ts?raw'
import reward from '../../../mini-tau3/rewards/interest-run.ts?raw'
import { HighlightedCode } from './HighlightedCode'
import type { AgentVersion } from '../../../mini-tau3/agents/variant-info'

const files = { 'actor.ts': actor, 'environment.ts': environment, 'customer.ts': customer, 'interest-run.ts': reward }
export function InterestCode({ version }: { version: AgentVersion }) {
  const [file, setFile] = useState<keyof typeof files>('actor.ts')
  return <div className="variant-source">
    <div className="variant-source-heading"><nav aria-label="Investigation source files">{Object.keys(files).map(name => <button key={name} aria-pressed={file === name} onClick={() => setFile(name as keyof typeof files)}>{name}</button>)}</nav></div>
    <p>{file === 'actor.ts' ? `Running ${version}. Shared policy and tools, with the selected strategy.` : file === 'interest-run.ts' ? 'Evaluation-only targets and trajectory checks. This source is not provided to the agent.' : file === 'customer.ts' ? 'A scripted customer answers follow-up questions and grants consent.' : 'An isolated portfolio, retrievable policies, and banking operations.'}</p>
    <pre tabIndex={0}><HighlightedCode source={files[file]} /></pre>
  </div>
}
