import { useMemo } from 'react'
import { trajectoryProjection, type TrajectoryMessage, type TrajectoryToolCall } from '../../../workshop/mini-tau3/trajectory'
import type { Event } from 'tardie/core/event'
import type { LogEvent } from './load-run'

type Item = { kind: 'message'; index: number; message: TrajectoryMessage } | { kind: 'tool'; index: number; tool: TrajectoryToolCall }

export function ChatTranscript({ events, busy, customerTurns }: { events: LogEvent[]; busy: boolean; customerTurns?: Array<{ text: string }> }) {
  const items = useMemo(() => {
    let state = trajectoryProjection.initial()
    for (const event of events) state = trajectoryProjection.step(state, event as Event)
    const trajectory = trajectoryProjection.output(state)
    return [
      ...trajectory.messages.map((message): Item => ({ kind: 'message', index: message.index, message })),
      ...trajectory.tools.map((tool): Item => ({ kind: 'tool', index: tool.callIndex ?? tool.returnIndex ?? 0, tool })),
    ].sort((a, b) => a.index - b.index)
  }, [events])
  const answered = items.some(item => item.kind === 'message' && (item.message.status === 'completed' || item.message.status === 'failed'))
  const finalCustomerTurn = customerTurns?.at(-1)?.text
  const showFinalCustomerTurn = finalCustomerTurn && !items.some(item => item.kind === 'message' && item.message.content === finalCustomerTurn)
  return <div className="chat-transcript" aria-label="Agent conversation">
    {!items.length && <p className="chat-empty">{busy ? 'Starting the conversation…' : 'Run the agent to see the conversation.'}</p>}
    {items.map(item => item.kind === 'message' ? <article key={`message-${item.index}`} className={`chat-message chat-${item.message.role}${item.message.status === 'failed' ? ' chat-failed' : ''}`}>
      <p className="chat-role">{item.message.role === 'user' ? 'Customer' : item.message.status === 'failed' ? 'Agent error' : 'Agent'}</p>
      <div className="chat-bubble">{item.message.content}</div>
    </article> : <details key={`tool-${item.index}`} className={`chat-tool chat-tool-${item.tool.status}`}>
      <summary><span aria-hidden="true">{item.tool.status === 'pending' ? '◌' : item.tool.status === 'error' ? '×' : '✓'}</span> {item.tool.name ?? 'Tool result'} <span className="chat-tool-state">{item.tool.status === 'pending' ? busy ? 'Running…' : 'No result recorded' : item.tool.status === 'error' ? 'Failed' : 'Done'}</span></summary>
      {item.tool.arguments !== undefined && <><p>Input</p><pre>{JSON.stringify(item.tool.arguments, null, 2)}</pre></>}
      {item.tool.result !== undefined && <><p>Result</p><pre>{JSON.stringify(item.tool.result, null, 2)}</pre></>}
    </details>)}
    {showFinalCustomerTurn && <article className="chat-message chat-user"><p className="chat-role">Customer</p><div className="chat-bubble">{finalCustomerTurn}</div></article>}
    {busy && items.length > 0 && !answered && <p className="chat-waiting">Assistant is working…</p>}
  </div>
}
