import { bankRoutes } from './bank-trajectories'

const start = [38, 210]
const end = [704, 210]
const trajectories = [
  { nodes: [[175, 205], [380, 185], [590, 210]], labels: [-23, -23, 30] },
  { nodes: [[145, 100], [290, 55], [425, 120], [545, 85]], labels: [-23, -23, -23, -23] },
  { nodes: [[125, 290], [240, 340], [335, 280], [410, 350], [510, 285], [625, 330]], labels: [30, 30, -23, 30, -23, 30] },
]
const pointString = (points: number[][]) => points.map(p => p.join(',')).join(' ')

export function BankRouteMap({ route, cursor }: { route: number; cursor: number }) {
  return <svg className="bank-route-map" viewBox="0 0 750 420" role="img" aria-labelledby="bank-path-map-title bank-path-map-desc">
    <title id="bank-path-map-title">Three tool-call paths to the same final balances</title>
    <desc id="bank-path-map-desc">Direct: lookup, transfer 500 dollars, lookup. Move then reverse: lookup, transfer 1000 dollars, return 500 dollars, lookup. Repeated lookups: four lookups, transfer 500 dollars, lookup. Selected path: {bankRoutes[route]!.name}; {cursor} calls executed.</desc>
    {bankRoutes.map((r, index) => {
      const { nodes, labels } = trajectories[index]!
      const selected = index === route
      const executed = [start, ...nodes.slice(0, selected ? cursor : 0), ...(selected && cursor === r.actions.length ? [end] : [])]
      return <g key={r.name} className={selected ? 'map-route selected' : 'map-route'}>
        <polyline points={pointString([start, ...nodes, end])} className="route-track" />
        {selected && cursor > 0 && <polyline points={pointString(executed)} className="route-progress" />}
        {r.actions.map((action, i) => <g key={i}>
          <circle cx={nodes[i]![0]} cy={nodes[i]![1]} r={selected && cursor === i + 1 ? 10 : 6} className={selected && i < cursor ? 'route-node executed' : 'route-node'} />
          <text x={nodes[i]![0]} y={nodes[i]![1]! + labels[i]!} textAnchor="middle" className="route-call">{action.tool === 'list_accounts' ? 'lookup' : action.reverse ? 'return $500' : `move $${action.amountCents / 100}`}</text>
        </g>)}
      </g>
    })}
    <circle cx={start[0]} cy={start[1]} r="10" className={cursor === 0 ? 'route-node executed' : 'route-node'} />
    <text x="38" y="241" textAnchor="middle" className="route-call">start</text>
    <circle cx={end[0]} cy={end[1]} r="10" className={cursor === bankRoutes[route]!.actions.length ? 'route-node executed' : 'route-node'} />
    <text x="704" y="241" textAnchor="middle" className="route-call">goal</text>
    <text x="375" y="413" textAnchor="middle" className="route-caption">Each stop is a tool call. Every route ends at savings $3,000 / checking $1,750.</text>
  </svg>
}
