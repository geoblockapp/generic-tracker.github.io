import { useMemo, useState } from 'preact/hooks'
import { IconClose } from '../icons'
import { scrollFieldIntoView } from '../utils/dom'

const HISTORY_RANGES = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '1Y', value: '1y' },
]

const CUTOFF_MS = {
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1m': 30 * 24 * 60 * 60 * 1000,
  '1y': 365 * 24 * 60 * 60 * 1000,
}

export default function TrackerDetailDialog({ tracker, onClose, onAddEntry, onToggleEntryCompletion }) {
  const [entryQuantity, setEntryQuantity] = useState(1)
  const [entryNote, setEntryNote] = useState('')
  const [entryNoteError, setEntryNoteError] = useState('')
  const [historyRange, setHistoryRange] = useState('1w')

  const visibleEntries = useMemo(() => {
    const now = Date.now()
    const cutoff = CUTOFF_MS[historyRange] || CUTOFF_MS['1w']
    return (tracker.entries || []).filter((entry) => {
      const createdAt = new Date(entry.createdAt).getTime()
      return Number.isFinite(createdAt) && now - createdAt <= cutoff
    })
  }, [tracker, historyRange])

  const rangeTotal = useMemo(
    () => visibleEntries.reduce((sum, entry) => sum + Number(entry.quantity || 0), 0),
    [visibleEntries],
  )

  const rangeAverage = visibleEntries.length ? rangeTotal / visibleEntries.length : 0

  function handleSubmit(event) {
    event.preventDefault()

    const note = entryNote.trim()
    const quantity = Number(entryQuantity) || 1

    if ((tracker.type === 'notes' || tracker.type === 'checkbox') && !note) {
      setEntryNoteError('Enter some text before adding this item')
      return
    }

    setEntryNoteError('')
    onAddEntry({ quantity, note })
    setEntryQuantity(1)
    setEntryNote('')
  }

  function handleClose() {
    setEntryNoteError('')
    onClose()
  }

  return (
    <div
      class="overlay-screen tracker-details-screen"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >
      <div class="overlay-card tracker-card">
        <div class="overlay-header">
          <h2>{tracker.name}</h2>
          <button class="ghost icon-btn" type="button" title="Close" aria-label="Close" onClick={handleClose}>
            <IconClose />
          </button>
        </div>

        <div class="tracker-summary">
          <div>
            <span class="stat-label">Current total</span>
            <strong>{tracker.count}</strong>
          </div>
          <div>
            <span class="stat-label">Type</span>
            <strong>{tracker.type}</strong>
          </div>
          {tracker.type === 'numeric' && (
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
            <strong>{tracker.unit}</strong>
          </div>
        </div>

        <form class="create-form" onSubmit={handleSubmit}>
          {tracker.type === 'numeric' && (
            <label>
              <span>Quantity</span>
              <input
                type="number"
                min="1"
                value={entryQuantity}
                onInput={(event) => setEntryQuantity(event.currentTarget.value)}
                onFocus={scrollFieldIntoView}
              />
            </label>
          )}

          <label>
            <span>{tracker.type === 'notes' || tracker.type === 'checkbox' ? 'Note' : 'Entry note'}</span>
            <input
              value={entryNote}
              aria-invalid={Boolean(entryNoteError)}
              class={entryNoteError ? 'invalid' : ''}
              onInput={(event) => {
                setEntryNote(event.currentTarget.value)
                if (entryNoteError) {
                  setEntryNoteError('')
                }
              }}
              onFocus={scrollFieldIntoView}
              placeholder={tracker.type === 'numeric' ? 'Optional entry note' : 'What did you check off?'}
            />
            {entryNoteError && <span class="field-error">{entryNoteError}</span>}
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
                    {tracker.type === 'checkbox' ? (
                      <label class="history-checkbox-row">
                        <input
                          type="checkbox"
                          checked={Boolean(entry.completed)}
                          onChange={() => onToggleEntryCompletion(entry.id)}
                        />
                        <span>{entry.note || 'Checked item'}</span>
                      </label>
                    ) : tracker.type === 'notes' ? (
                      <span>{entry.note || 'Note entry'}</span>
                    ) : (
                      <span>
                        +{entry.quantity} {tracker.unit}
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
  )
}
