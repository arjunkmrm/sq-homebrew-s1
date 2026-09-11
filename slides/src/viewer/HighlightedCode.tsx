import { useMemo } from 'react'
import hljs from 'highlight.js/lib/core'
import typescript from 'highlight.js/lib/languages/typescript'
import './syntax.css'

hljs.registerLanguage('typescript', typescript)

export function HighlightedCode({ source }: { source: string }) {
  const html = useMemo(() => hljs.highlight(source, { language: 'typescript' }).value, [source])
  // highlight.js escapes the source before adding token markup.
  return <code className="workshop-syntax" dangerouslySetInnerHTML={{ __html: html }} />
}
