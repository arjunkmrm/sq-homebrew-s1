// Offline teaching fixture: real reference tool replay, illustrative events and usage.
import { createBankingEnvironment } from '../../workshop/mini-tau3/environment/banking'
import { loadBankingTask, createBankingTaskSeed, executeGoldAssistantAction } from '../../workshop/mini-tau3/tasks'
import { buildReferenceOutcome } from '../../workshop/mini-tau3/evaluation/reference'
import { evaluateOutcome } from '../../workshop/mini-tau3/evaluation/outcome'
import { scoreBankingRun } from '../../workshop/mini-tau3/rewards/banking'
const task = loadBankingTask('task_093')
const bank = createBankingEnvironment(createBankingTaskSeed(task))
const stateBefore = bank.snapshot()
const events: any[] = []
let at = 0
const emit = (type: string, data: object) => events.push({type, at: at += 1000, ...data})
const request = 'Hi, I think there might be something wrong with my interest payments.'
emit('MessageReceived', {text: request})
const verification = task.evaluation_criteria.actions.find(a => a.name === 'log_verification')!
const facts = Object.values(verification.arguments).join(' · ')
const consent = {openAccounts:false,transfers:false,closeAccounts:false,credits:true,reports:true}
const customerTurns = [{text: request,afterToolSeq:0,consent:{...consent,credits:false,reports:false}}, {text:`${facts}. Yes, please correct the interest and submit a report.`,afterToolSeq:0,consent}]
emit('MessageReceived', {text:customerTurns[1].text})
for (const [i, action] of task.evaluation_criteria.actions.entries()) {
 const callId = `example-tool-${i}`
 emit('ToolCalled', {callId,name:action.name,arguments:action.arguments})
 const result = executeGoldAssistantAction(bank, action)
 if (typeof result === 'string' && /^(Error:|Failed)/.test(result)) throw new Error(result)
 emit('ToolReturned', {callId,result})
}
emit('ModelReturned', {callId:'example-model',usage:{promptTokens:12000,completionTokens:1000,totalTokens:13000,costUsd:0.02},note:'Illustrative usage, not a model invocation.'})
const finalAnswer = 'Credited the missing $33 interest and filed the discrepancy report.'
emit('TurnCompleted', {output:finalAnswer})
const run: any = {id:task.id,agent:'Example · reference replay',status:'judged',request,events,stateBefore,stateAfter:bank.snapshot(),audit:bank.auditSnapshot(),customerTurns,finalAnswer,example:true,provenance:'Offline replay of task 093 reference actions. Conversation, timestamps and token/cost figures are illustrative; no model was run.'}
run.outcome = evaluateOutcome(buildReferenceOutcome(task),run)
run.score = scoreBankingRun(task,run,run.outcome)
if (!run.score.completed || run.score.total === null) throw new Error('Example failed its checks')
await Bun.write(new URL('../public/runs/task-093-example.json',import.meta.url),JSON.stringify(run,null,2))
console.log({outcome:run.outcome.pass,score:run.score.total,events:events.length})
