type Point = readonly [number, number]
type Triangle = { kind: 0 | 1; a: Point; b: Point; c: Point }
type Rhomb = { kind: 0 | 1; points: readonly [Point, Point, Point, Point] }

const PHI = (1 + Math.sqrt(5)) / 2
const split = (a: Point, b: Point): Point => [
  a[0] + (b[0] - a[0]) / PHI,
  a[1] + (b[1] - a[1]) / PHI,
]
const key = (point: Point) => point.map((value) => value.toFixed(6)).join(',')

// Robinson triangle substitution, paired into P3 Penrose rhombs. This mirrors
// the construction used by the Clavia site in company-mono.
function createPenroseTiles(): Rhomb[] {
  const center: Point = [368, 150]
  const radial = (angle: number): Point => [
    center[0] + 560 * Math.cos(angle),
    center[1] + 560 * Math.sin(angle),
  ]
  let triangles: Triangle[] = Array.from({ length: 10 }, (_, index) => {
    const b = radial(((2 * index - 1) * Math.PI) / 10 - Math.PI / 2)
    const c = radial(((2 * index + 1) * Math.PI) / 10 - Math.PI / 2)
    return { kind: 0, a: center, b: index % 2 ? b : c, c: index % 2 ? c : b }
  })

  for (let depth = 0; depth < 6; depth += 1) {
    triangles = triangles.flatMap(({ kind, a, b, c }): Triangle[] => {
      if (kind === 0) {
        const p = split(a, b)
        return [
          { kind: 0, a: c, b: p, c: b },
          { kind: 1, a: p, b: c, c: a },
        ]
      }
      const q = split(b, a)
      const r = split(b, c)
      return [
        { kind: 1, a: r, b: c, c: a },
        { kind: 1, a: q, b: r, c: b },
        { kind: 0, a: r, b: q, c: a },
      ]
    })
  }

  const halves = new Map<string, Triangle>()
  const tiles: Rhomb[] = []
  for (const triangle of triangles) {
    const base = [key(triangle.b), key(triangle.c)].sort().join('|')
    const partner = halves.get(base)
    if (!partner) {
      halves.set(base, triangle)
      continue
    }
    halves.delete(base)
    tiles.push({
      kind: triangle.kind,
      points: [triangle.a, triangle.b, partner.a, triangle.c],
    })
  }
  return tiles
}

const tiles = createPenroseTiles().filter(({ points }) => {
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  return Math.max(...xs) >= 0 && Math.min(...xs) <= 736 && Math.max(...ys) >= 0 && Math.min(...ys) <= 260
})

export function AboutPenrose() {
  return (
    <div className="about-penrose" aria-hidden="true">
      <svg viewBox="0 0 736 260" preserveAspectRatio="xMidYMid slice">
        {tiles.map(({ kind, points }, index) => (
          <polygon
            key={index}
            className={kind === 0 ? 'about-penrose-thin' : 'about-penrose-thick'}
            points={points.map((point) => point.map((value) => value.toFixed(3)).join(',')).join(' ')}
          />
        ))}
      </svg>
    </div>
  )
}
