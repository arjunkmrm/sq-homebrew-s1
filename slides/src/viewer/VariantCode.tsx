import baseline from '../../../workshop/mini-tau3/agents/baseline/actor.ts?raw'
import { HighlightedCode } from './HighlightedCode'

export function VariantCode({ inline = false }: { version?: 'baseline'; inline?: boolean }) {
  const Container = inline ? 'div' : 'details'
  return <Container className="variant-source" {...(!inline ? { open: true } : {})}>
    {!inline && <summary>Agent code</summary>}
    <div className="variant-source-heading"><span>agents/baseline/actor.ts</span></div>
    <p>Instructions + bank tools + output validation.</p>
    <pre tabIndex={0}><HighlightedCode source={baseline} /></pre>
  </Container>
}
