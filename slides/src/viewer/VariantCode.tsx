import { useState } from 'react'
import baseline from '../../../mini-tau3/agents/baseline/actor.ts?raw'
import variants from '../../../mini-tau3/agents/versions.ts?raw'
import { agentVariants, type AgentVersion } from '../../../mini-tau3/agents/variant-info'
import { HighlightedCode } from './HighlightedCode'

const composition = variants.slice(variants.indexOf('const createVariantAgent'), variants.indexOf('\nexport function createAgentVersion')).trim()
export function VariantCode({ version, inline = false }: { version?: AgentVersion; inline?: boolean }) {
  const [chosen, setSelected] = useState<AgentVersion>('baseline')
  const selected = version ?? chosen
  const instruction = variants.split('\n').find(line => line.trimStart().startsWith(`${selected}: system(`))?.trim() ?? ''
  const source = selected === 'baseline' ? baseline : `${instruction}\n\n${composition}`
  const Container = inline ? 'div' : 'details'
  return <Container className="variant-source" {...(!inline ? { open: true } : {})}>
    {!inline && <summary>Agent code</summary>}
    <div className="variant-source-heading">{!version && <nav aria-label="Agent source version">{agentVariants.map(variant => <button key={variant.id} aria-pressed={selected === variant.id} onClick={() => setSelected(variant.id)}>{variant.label}</button>)}</nav>}<span>{selected === 'baseline' ? 'agents/baseline/actor.ts' : 'agents/versions.ts · excerpt'}</span></div>
    <p>{selected === 'baseline' ? 'Instructions + bank tools + output validation.' : 'The same policy and tools, with one additional instruction component.'}</p>
    <pre key={selected} tabIndex={0}><HighlightedCode source={source} /></pre>
  </Container>
}
