import { useMemo, useRef, useState } from 'preact/hooks'

function buildPieGradient(items) {
  if (items.length === 0) {
    return 'radial-gradient(circle at center, #ffffff 0 48%, #dbeafe 49% 100%)'
  }

  const step = 360 / items.length
  const stops = items
    .map((item, index) => {
      const start = step * index
      const end = step * (index + 1)
      return `${item.color || '#2563eb'} ${start}deg ${end}deg`
    })
    .join(', ')

  return `conic-gradient(${stops})`
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

function describeSlicePath(index, count, radius = 110) {
  const cx = 130
  const cy = 130
  const startAngle = (360 / count) * index
  const endAngle = (360 / count) * (index + 1)

  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [`M ${cx} ${cy}`, `L ${start.x} ${start.y}`, `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`, 'Z'].join(' ')
}

export default function Dial({ items, onSelectTracker, onCreateNew }) {
  const [dragging, setDragging] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const dialRef = useRef(null)

  const pieGradient = useMemo(() => buildPieGradient(items), [items])
  const sliceCount = Math.max(items.length, 1)
  const sliceAngle = 360 / sliceCount

  function getAngleFromEvent(event) {
    const dial = dialRef.current
    if (!dial) return 0
    const rect = dial.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const x = event.clientX - centerX
    const y = event.clientY - centerY
    return (Math.atan2(y, x) * 180) / Math.PI + 90
  }

  function getSliceIndexFromAngle(angle) {
    const segmentCount = Math.max(items.length, 1)
    const segmentAngle = 360 / segmentCount
    const normalizedAngle = (angle + 360) % 360
    return Math.floor(normalizedAngle / segmentAngle) % segmentCount
  }

  function handleDialPointerDown(event) {
    if (event.target.closest('.dial-center')) return
    setExpanded(true)
    setDragging(true)
    setHoveredIndex(getSliceIndexFromAngle(getAngleFromEvent(event)))
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleDialPointerMove(event) {
    if (!dragging) return
    setHoveredIndex(getSliceIndexFromAngle(getAngleFromEvent(event)))
  }

  function handleDialPointerUp(event) {
    if (!dragging) return

    const selectedIndex = hoveredIndex ?? getSliceIndexFromAngle(getAngleFromEvent(event))
    const selectedItem = items[selectedIndex]

    if (selectedItem) {
      onSelectTracker(selectedItem.id)
    }

    setDragging(false)
    setExpanded(false)
    setHoveredIndex(null)
  }

  return (
    <div class="dial-wrap">
      <div
        ref={dialRef}
        class={`dial ${expanded ? 'expanded' : ''} ${dragging ? 'dragging' : ''}`}
        style={{
          '--pie-gradient': pieGradient,
        }}
        onPointerDown={handleDialPointerDown}
        onPointerMove={handleDialPointerMove}
        onPointerUp={handleDialPointerUp}
        onPointerLeave={handleDialPointerUp}
      >
        <svg viewBox="0 0 260 260" class="dial-svg" aria-hidden="true">
          <defs>
            <filter id="dialShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(15, 23, 42, 0.24)" />
            </filter>
          </defs>

          <circle cx="130" cy="130" r="110" fill="#dbeafe" opacity="0.55" />

          {items.map((item, index) => {
            const midAngle = (sliceAngle * index) + (sliceAngle / 2)
            const labelPoint = polarToCartesian(130, 130, 64, midAngle)
            return (
              <g
                class={`dial-slice ${hoveredIndex === index ? 'active' : ''}`}
                key={item.id}
                transform-origin="130px 130px"
              >
                <path
                  d={describeSlicePath(index, sliceCount)}
                  fill={item.color}
                  stroke="rgba(255,255,255,0.65)"
                  stroke-width="2"
                  filter="url(#dialShadow)"
                />
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  text-anchor="middle"
                  dominant-baseline="middle"
                  fill="white"
                  font-size="11"
                  font-weight="700"
                >
                  {item.name}
                </text>
              </g>
            )
          })}
        </svg>

        <button class="dial-center" type="button" onClick={onCreateNew}>
          +
        </button>
      </div>
    </div>
  )
}
