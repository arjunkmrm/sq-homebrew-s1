import { useState } from 'react'
import actor from '../../../workshop/mini-tau3/agents/baseline/actor.ts?raw'
import environment from '../../../workshop/mini-tau3/environment/banking.ts?raw'
import tools from '../../../workshop/mini-tau3/environment/tools.ts?raw'
import customer from '../../../workshop/mini-tau3/environment/customer/agent.ts?raw'
import reward from '../../../workshop/mini-tau3/rewards/banking.ts?raw'
import { HighlightedCode } from './HighlightedCode'

const files = { 'agents/baseline/actor.ts': actor, 'environment/banking.ts': environment, 'environment/tools.ts': tools, 'environment/customer/agent.ts': customer, 'rewards/banking.ts': reward }
export function InterestCode() {
  const [file, setFile] = useState<keyof typeof files>('agents/baseline/actor.ts')
  return <div className="variant-source">
    <div className="variant-source-heading"><nav aria-label="Investigation source files">{Object.keys(files).map(name => <button key={name} aria-pressed={file === name} onClick={() => setFile(name as keyof typeof files)}>{name}</button>)}</nav></div>
    <p>{file === 'agents/baseline/actor.ts' ? 'The baseline agent composes its instructions, banking tools, and output validation.' : file === 'rewards/banking.ts' ? 'Evaluation-only targets and trajectory checks. This source is not provided to the agent.' : file === 'environment/customer/agent.ts' ? 'A customer agent answers follow-up questions and grants consent from its private scenario.' : file === 'environment/tools.ts' ? 'Banking tool definitions, validation, reads, and mutations over the shared state.' : 'An isolated portfolio and the environment interface exposed to each run.'}</p>
    <pre tabIndex={0}><HighlightedCode source={files[file]} /></pre>
  </div>
}
