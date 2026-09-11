import { useState } from 'react'
import { HighlightedCode } from './HighlightedCode'
import actor from '../../../workshop/mini-tau3/agents/baseline/actor.ts?raw'
import instructions from '../../../workshop/mini-tau3/agents/baseline/components/instructions.ts?raw'
import bankTools from '../../../workshop/mini-tau3/agents/baseline/components/bank-tools.ts?raw'

const files = {
  actor: { path: 'actor.ts', source: actor, description: 'The actor composes instructions and tools into an agent.' },
  instructions: { path: 'components/instructions.ts', source: instructions, description: 'The system component supplies the instructions and bank policy.' },
  tools: { path: 'components/bank-tools.ts', source: bankTools, description: 'The tool component connects the agent to this customer’s bank state.' },
}
type FileKey = keyof typeof files

export function BaselineCode() {
  const [selected, setSelected] = useState<FileKey>('actor')
  const file = files[selected]
  function fileButton(key: FileKey, label: string) {
    return <button aria-pressed={selected === key} onClick={() => setSelected(key)}>{label}</button>
  }
  return <div className="baseline-code-browser">
    <nav className="baseline-file-tree" aria-label="Baseline agent source files">
      <p>baseline/</p>
      {fileButton('actor', 'actor.ts')}
      <p className="baseline-folder">components/</p>
      <div className="baseline-component-files">{fileButton('instructions', 'instructions.ts')}{fileButton('tools', 'bank-tools.ts')}</div>
    </nav>
    <div className="baseline-file-content">
      <header><p>{file.path}</p><span>{file.description}</span></header>
      <pre key={selected} tabIndex={0} aria-label={file.path}><HighlightedCode source={file.source} /></pre>
    </div>
  </div>
}
