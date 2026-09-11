import type { Event } from "../../../tardigrade/packages/core/src/event.ts"
import type { Projection } from "../../../tardigrade/packages/core/src/projection/projection.ts"

export type TrajectoryMessage = {
  messageId?: string
  turn?: string
  attemptKey?: string
  index: number
  role: "user" | "assistant"
  content: string
  status: "received" | "intermediate" | "completed" | "failed"
}

export type TrajectoryToolCall = {
  callId: string
  name?: string
  arguments?: unknown
  result?: unknown
  callIndex?: number
  returnIndex?: number
  status: "pending" | "returned" | "error"
  unmatchedReturn: boolean
}

export type Trajectory = {
  messages: TrajectoryMessage[]
  tools: TrajectoryToolCall[]
}

type TrajectoryState = Trajectory & { nextIndex: number }

const failedResult = (result: unknown): boolean =>
  typeof result === "object" && result !== null && typeof (result as { error?: unknown }).error === "string"

// trajectoryProjection derives a compact, replayable view of messages and tool activity from a Tardie event log.
export const trajectoryProjection: Projection<TrajectoryState, Trajectory> = {
  initial: () => ({ messages: [], tools: [], nextIndex: 0 }),
  step: (state, event) => {
    const index = state.nextIndex
    const next = <Value extends Omit<TrajectoryState, "nextIndex">>(value: Value): TrajectoryState => ({ ...value, nextIndex: index + 1 })
    if (event.type === "MessageReceived") {
      const message = event as Event & { id?: unknown; text?: unknown; outcome?: unknown }
      if (typeof message.text !== "string" || message.outcome !== undefined) return next(state)
      return next({ ...state, messages: [...state.messages, { ...(typeof message.id === "string" ? { messageId: message.id } : {}), index, role: "user", content: message.text, status: "received" }] })
    }
    if (event.type === "TextReturned") {
      const returned = event as Event & { text?: unknown; turn?: unknown }
      const text = returned.text
      return typeof text === "string"
        ? next({ ...state, messages: [...state.messages, { ...(typeof returned.turn === "string" ? { turn: returned.turn } : {}), index, role: "assistant", content: text, status: "intermediate" }] })
        : next(state)
    }
    if (event.type === "TurnCompleted") {
      const completed = event as Event & { output?: unknown; attemptKey?: unknown }
      const output = completed.output
      return typeof output === "string"
        ? next({ ...state, messages: [...state.messages, { ...(typeof completed.attemptKey === "string" ? { attemptKey: completed.attemptKey } : {}), index, role: "assistant", content: output, status: "completed" }] })
        : next(state)
    }
    if (event.type === "TurnFailed") {
      const failed = event as Event & { error?: unknown; attemptKey?: unknown }
      const error = failed.error
      return typeof error === "string"
        ? next({ ...state, messages: [...state.messages, { ...(typeof failed.attemptKey === "string" ? { attemptKey: failed.attemptKey } : {}), index, role: "assistant", content: error, status: "failed" }] })
        : next(state)
    }
    if (event.type === "ToolCalled") {
      const call = event as Event & { callId?: unknown; name?: unknown; arguments?: unknown }
      if (typeof call.callId !== "string") return next(state)
      return next({
        ...state,
        tools: [...state.tools, {
          callId: call.callId,
          ...(typeof call.name === "string" ? { name: call.name } : {}),
          ...(Object.hasOwn(call, "arguments") ? { arguments: call.arguments } : {}),
          callIndex: index,
          status: "pending",
          unmatchedReturn: false,
        }],
      })
    }
    if (event.type === "ToolReturned") {
      const returned = event as Event & { callId?: unknown; result?: unknown }
      if (typeof returned.callId !== "string") return next(state)
      const toolIndex = state.tools.findIndex((call) => call.callId === returned.callId && call.status === "pending")
      const status = failedResult(returned.result) ? "error" as const : "returned" as const
      if (toolIndex === -1) {
        return next({ ...state, tools: [...state.tools, { callId: returned.callId, result: returned.result, returnIndex: index, status, unmatchedReturn: true }] })
      }
      const tools = [...state.tools]
      tools[toolIndex] = { ...tools[toolIndex]!, result: returned.result, returnIndex: index, status }
      return next({ ...state, tools })
    }
    return next(state)
  },
  output: (state) => ({ messages: [...state.messages], tools: [...state.tools] }),
}
