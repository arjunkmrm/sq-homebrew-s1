import { useMemo } from 'react'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import typescript from 'highlight.js/lib/languages/typescript'
import './syntax.css'

hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('json', json)

export function HighlightedCode({ source, language = 'typescript' }: { source: string; language?: 'typescript' | 'json' }) {
  const html = useMemo(() => hljs.highlight(source, { language }).value, [source, language])
  // highlight.js escapes the source before adding token markup.
  return <code className="workshop-syntax" dangerouslySetInnerHTML={{ __html: html }} />
}
