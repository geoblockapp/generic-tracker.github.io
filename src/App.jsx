import { useEffect, useMemo, useRef, useState } from 'preact/hooks'

const STORAGE_KEY = 'generic-tracker-items'
const TRACKER_COLORS = ['#2563eb', '#8b5cf6', '#0f766e', '#ea580c', '#db2777', '#0891b2']
const TRACKER_UNITS = ['entries', 'boxes', 'bottles', 'meals', 'sessions', 'hours']
const TRACKER_TYPES = ['checkbox', 'notes', 'numeric']
const HISTORY_RANGES = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '1Y', value: '1y' },
]

function readStoredItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

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

export default function App() {
  const [items, setItems] = useState(() => readStoredItems())
  const [showCreateScreen, setShowCreateScreen] = useState(false)
  const [showTrackerScreen, setShowTrackerScreen] = useState(false)
  const [activeTrackerId, setActiveTrackerId] = useState(null)
  const [trackerName, setTrackerName] = useState('')
  const [trackerNameError, setTrackerNameError] = useState('')
  const [trackerUnit, setTrackerUnit] = useState(TRACKER_UNITS[0])
  const [trackerType, setTrackerType] = useState(TRACKER_TYPES[0])
  const [entryQuantity, setEntryQuantity] = useState(1)
  const [entryNote, setEntryNote] = useState('')
  const [historyRange, setHistoryRange] = useState('1w')
  const [dragging, setDragging] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const dialRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.count || 0), 0),
    [items],
  )

  const activeTracker = useMemo(
    () => items.find((item) => item.id === activeTrackerId) || null,
    [items, activeTrackerId],
  )

  const pieGradient = useMemo(() => buildPieGradient(items), [items])
  const sliceCount = Math.max(items.length, 1)
  const sliceAngle = 360 / sliceCount

  const visibleEntries = useMemo(() => {
    if (!activeTracker) return []

    const now = Date.now()
    const cutoffMap = {
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1m': 30 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
    }

    const cutoff = cutoffMap[historyRange] || cutoffMap['1w']
    return (activeTracker.entries || []).filter((entry) => {
      const createdAt = new Date(entry.createdAt).getTime()
      return Number.isFinite(createdAt) && now - createdAt <= cutoff
    })
  }, [activeTracker, historyRange])

  const rangeTotal = useMemo(
    () => visibleEntries.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0),
    [visibleEntries],
  )

  const rangeAverage = useMemo(
    () => (visibleEntries.length ? rangeTotal / visibleEntries.length : 0),
    [visibleEntries, rangeTotal],
  )

  function createTracker(event) {
    if (event?.preventDefault) {
      event.preventDefault()
    }

    const name = trackerName.trim()
    if (!name) {
      setTrackerNameError('Tracker name is required')
      return
    }

    setTrackerNameError('')

    const newTracker = {
      id: crypto.randomUUID(),
      name,
      type: trackerType,
      unit: trackerUnit.trim() || TRACKER_UNITS[0],
      count: 0,
      color: TRACKER_COLORS[items.length % TRACKER_COLORS.length],
      createdAt: new Date().toISOString(),
      entries: [],
    }

    setItems((current) => [newTracker, ...current])
    setTrackerName('')
    setTrackerUnit(TRACKER_UNITS[0])
    setTrackerType(TRACKER_TYPES[0])
    setShowCreateScreen(false)
  }

  function addEntry(event) {
    event.preventDefault()
    if (!activeTrackerId) return

    const tracker = items.find((item) => item.id === activeTrackerId)
    if (!tracker) return

    const note = entryNote.trim()
    const quantity = Number(entryQuantity) || 1

    if (tracker.type === 'notes' && !note) return

    const entry = {
      id: crypto.randomUUID(),
      quantity: tracker.type === 'numeric' ? quantity : 1,
      note,
      createdAt: new Date().toISOString(),
      completed: false,
      type: tracker.type,
    }

    setItems((current) =>
      current.map((item) => {
        if (item.id !== activeTrackerId) return item

        return {
          ...item,
          count: tracker.type === 'numeric'
            ? Number(item.count || 0) + quantity
            : Number(item.count || 0) + (entry.completed ? 0 : 1),
          entries: [entry, ...(item.entries || [])],
        }
      }),
    )

    setEntryQuantity(1)
    setEntryNote('')
  }

  function toggleEntryCompletion(entryId) {
    if (!activeTrackerId) return

    setItems((current) =>
      current.map((item) => {
        if (item.id !== activeTrackerId) return item

        return {
          ...item,
          entries: (item.entries || []).map((entry) =>
            entry.id === entryId ? { ...entry, completed: !entry.completed } : entry,
          ),
        }
      }),
    )
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id))
    if (activeTrackerId === id) {
      setShowTrackerScreen(false)
      setActiveTrackerId(null)
    }
  }

  function clearAll() {
    setItems([])
    setShowTrackerScreen(false)
    setActiveTrackerId(null)
  }

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
      setActiveTrackerId(selectedItem.id)
      setShowTrackerScreen(true)
    }

    setDragging(false)
    setExpanded(false)
    setHoveredIndex(null)
  }

  return (
    <main class="app-shell">
      <section class="card">
        <p class="eyebrow">Local-first tracker</p>
        <h1>Generic Tracker</h1>
        <p class="subtitle">
          Touch the wheel, rotate, and release on a slice to open a tracker. Use the plus to create a new one.
        </p>

        <div class="stats-row">
          <div>
            <span class="stat-label">Trackers</span>
            <strong>{items.length}</strong>
          </div>
          <div>
            <span class="stat-label">Total</span>
            <strong>{totalCount}</strong>
          </div>
        </div>

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

            <button
              class="dial-center"
              type="button"
              onClick={() => setShowCreateScreen(true)}
            >
              +
            </button>
          </div>
        </div>

        <div class="list-header">
          <h2>Tracked items</h2>
          <button class="ghost" type="button" onClick={clearAll}>
            Clear all
          </button>
        </div>

        <div class="item-list">
          {items.length === 0 ? (
            <p class="empty-state">No tracked items yet. Tap the center plus to create one.</p>
          ) : (
            items.map((item) => (
              <article class="item-row" key={item.id}>
                <div>
                  <div class="item-name">{item.name}</div>
                  <div class="item-meta">
                    {item.count} {item.unit}
                  </div>
                </div>
                <div class="row-actions">
                  <button class="primary small" type="button" onClick={() => {
                    setActiveTrackerId(item.id)
                    setShowTrackerScreen(true)
                  }}>
                    Open
                  </button>
                  <button class="danger" type="button" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {showCreateScreen && (
        <div class="overlay-screen">
          <div class="overlay-card">
            <div class="overlay-header">
              <h2>Add tracker</h2>
              <button class="ghost" type="button" onClick={() => setShowCreateScreen(false)}>
                Close
              </button>
            </div>

            <form class="create-form" onSubmit={createTracker}>
              <label>
                <span>Tracker name</span>
                <input
                  value={trackerName}
                  aria-invalid={Boolean(trackerNameError)}
                  class={trackerNameError ? 'invalid' : ''}
                  onInput={(event) => {
                    setTrackerName(event.currentTarget.value)
                    if (trackerNameError) {
                      setTrackerNameError('')
                    }
                  }}
                  placeholder="What do you want to track?"
                />
                {trackerNameError && <span class="field-error">{trackerNameError}</span>}
              </label>

              <label>
                <span>Type</span>
                <select
                  value={trackerType}
                  onChange={(event) => setTrackerType(event.currentTarget.value)}
                >
                  {TRACKER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Unit</span>
                <select
                  value={trackerUnit}
                  onChange={(event) => setTrackerUnit(event.currentTarget.value)}
                >
                  {TRACKER_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>

              <div class="form-actions">
                <button class="primary" type="button" onClick={createTracker}>
                  Create tracker
                </button>
                <button class="ghost" type="button" onClick={() => setShowCreateScreen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTrackerScreen && activeTracker && (
        <div class="overlay-screen tracker-details-screen">
          <div class="overlay-card tracker-card">
            <div class="overlay-header">
              <h2>{activeTracker.name}</h2>
              <button class="ghost" type="button" onClick={() => setShowTrackerScreen(false)}>
                Close
              </button>
            </div>

            <div class="tracker-summary">
              <div>
                <span class="stat-label">Current total</span>
                <strong>{activeTracker.count}</strong>
              </div>
              <div>
                <span class="stat-label">Type</span>
                <strong>{activeTracker.type}</strong>
              </div>
              {activeTracker.type === 'numeric' && (
                <>
                  <div>
                    <span class="stat-label">Selected total</span>
                    <strong>{rangeTotal}</strong>
                  </div>
                  <div>
                    <span class="stat-label">Selected average</span>
                    <strong>{rangeAverage.toFixed(1)}</strong>
                  </div>
                </>
              )}
              <div>
                <span class="stat-label">Unit</span>
                <strong>{activeTracker.unit}</strong>
              </div>
            </div>

            <form class="create-form" onSubmit={addEntry}>
              {activeTracker.type === 'numeric' && (
                <label>
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="1"
                    value={entryQuantity}
                    onInput={(event) => setEntryQuantity(event.currentTarget.value)}
                  />
                </label>
              )}

              <label>
                <span>{activeTracker.type === 'notes' ? 'Note' : 'Entry note'}</span>
                <input
                  value={entryNote}
                  onInput={(event) => setEntryNote(event.currentTarget.value)}
                  placeholder={activeTracker.type === 'notes' ? 'Add a note' : 'Optional entry note'}
                />
              </label>

              <div class="form-actions">
                <button class="primary" type="submit">Add entry</button>
              </div>
            </form>

            <div class="history-range-bar">
              {HISTORY_RANGES.map((range) => (
                <button
                  key={range.value}
                  class={`history-range-btn ${historyRange === range.value ? 'active' : ''}`}
                  type="button"
                  onClick={() => setHistoryRange(range.value)}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <div class="history-tree">
              {visibleEntries.length === 0 ? (
                <p class="empty-state">No entries in the selected time window.</p>
              ) : (
                visibleEntries.map((entry, index) => (
                  <div class="history-node" key={entry.id}>
                    <div class="history-line"></div>
                    <div class="history-dot"></div>
                    <div class={`history-card ${entry.completed ? 'completed' : ''}`}>
                      <div class="history-head">
                        <span>Entry {index + 1}</span>
                        <span>{new Date(entry.createdAt).toLocaleString()}</span>
                      </div>
                      <div class="history-body">
                        {activeTracker.type === 'checkbox' ? (
                          <label class="history-checkbox-row">
                            <input
                              type="checkbox"
                              checked={Boolean(entry.completed)}
                              onChange={() => toggleEntryCompletion(entry.id)}
                            />
                            <span>{entry.note || 'Checked item'}</span>
                          </label>
                        ) : activeTracker.type === 'notes' ? (
                          <span>{entry.note || 'Note entry'}</span>
                        ) : (
                          <span>
                            +{entry.quantity} {activeTracker.unit}
                            {entry.note ? ` • ${entry.note}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
