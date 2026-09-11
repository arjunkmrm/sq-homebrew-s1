import corpus from "./corpus.json"

export type KnowledgeDocument = { id: string; title: string; content: string }
export type KnowledgeSearchResult = { id: string; title: string; excerpt: string }

const documents = corpus as KnowledgeDocument[]
const byId = new Map(documents.map(document => [document.id, document]))

const normalize = (word: string) => {
  const value = word.toLowerCase()
  if (value.length > 5 && value.endsWith("ing")) return value.slice(0, -3)
  if (value.length > 4 && value.endsWith("ies")) return `${value.slice(0, -3)}y`
  if (value.length > 4 && value.endsWith("es")) return value.slice(0, -2)
  if (value.length > 3 && value.endsWith("s")) return value.slice(0, -1)
  return value
}

const tokens = (text: string) => (text.toLowerCase().match(/[a-z0-9]+(?:\.[0-9]+)?/g) ?? []).map(normalize)
const indexed = documents.map(document => {
  const title = tokens(document.title)
  const body = tokens(document.content)
  const frequencies = new Map<string, number>()
  for (const term of [...title, ...title, ...title, ...body]) frequencies.set(term, (frequencies.get(term) ?? 0) + 1)
  return { document, title: new Set(title), titleTokens: title, body, frequencies, length: body.length + title.length * 3 }
})
const averageLength = indexed.reduce((sum, item) => sum + item.length, 0) / indexed.length
const documentFrequency = new Map<string, number>()
for (const item of indexed) for (const term of item.frequencies.keys()) documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1)

const excerptFor = (content: string, queryTerms: string[]) => {
  const lower = content.toLowerCase()
  const positions = queryTerms.map(term => lower.indexOf(term)).filter(position => position >= 0)
  const center = positions.length ? Math.min(...positions) : 0
  const start = Math.max(0, center - 100)
  const end = Math.min(content.length, start + 320)
  return `${start ? "…" : ""}${content.slice(start, end).trim()}${end < content.length ? "…" : ""}`
}

export function searchDocuments(input: { query: string; limit?: number }): KnowledgeSearchResult[] {
  const queryTerms = [...new Set(tokens(input.query))]
  if (queryTerms.length === 0) return []
  const limit = Math.min(20, Math.max(1, Number.isSafeInteger(input.limit) ? input.limit! : 8))
  const k1 = 1.2
  const b = 0.75
  return indexed.map(item => {
    let score = 0
    for (const term of queryTerms) {
      const frequency = item.frequencies.get(term) ?? 0
      if (!frequency) continue
      const frequencyInDocuments = documentFrequency.get(term) ?? 0
      const inverseDocumentFrequency = Math.log(1 + (documents.length - frequencyInDocuments + 0.5) / (frequencyInDocuments + 0.5))
      score += inverseDocumentFrequency * frequency * (k1 + 1) / (frequency + k1 * (1 - b + b * item.length / averageLength))
      if (item.title.has(term)) score += inverseDocumentFrequency * 1.5
    }
    const titleText = item.titleTokens.join(" ")
    for (let index = 0; index < queryTerms.length - 1; index++) {
      if (titleText.includes(`${queryTerms[index]} ${queryTerms[index + 1]}`)) score += 4
    }
    return { item, score }
  }).filter(result => result.score > 0)
    .sort((left, right) => right.score - left.score || left.item.document.id.localeCompare(right.item.document.id))
    .slice(0, limit)
    .map(({ item }) => ({ id: item.document.id, title: item.document.title, excerpt: excerptFor(item.document.content, queryTerms) }))
}

export function getDocument(input: { documentId: string }): KnowledgeDocument {
  const document = byId.get(input.documentId)
  if (!document) throw new Error(`Unknown knowledge document: ${input.documentId}`)
  return { ...document }
}

export const knowledgeDocumentCount = documents.length
