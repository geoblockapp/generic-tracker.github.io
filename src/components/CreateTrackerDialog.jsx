import { useState } from 'preact/hooks'
import { IconClose } from '../icons'
import { scrollFieldIntoView } from '../utils/dom'

const TRACKER_UNITS = ['entries', 'boxes', 'bottles', 'meals', 'sessions', 'hours']
const TRACKER_TYPES = ['checkbox', 'notes', 'numeric']

export default function CreateTrackerDialog({ onClose, onCreate }) {
  const [trackerName, setTrackerName] = useState('')
  const [trackerNameError, setTrackerNameError] = useState('')
  const [trackerUnit, setTrackerUnit] = useState(TRACKER_UNITS[0])
  const [trackerType, setTrackerType] = useState(TRACKER_TYPES[0])

  function handleSubmit(event) {
    if (event?.preventDefault) {
      event.preventDefault()
    }

    const name = trackerName.trim()
    if (!name) {
      setTrackerNameError('Tracker name is required')
      return
    }

    onCreate({
      name,
      type: trackerType,
      unit: trackerUnit.trim() || TRACKER_UNITS[0],
    })
  }

  return (
    <div
      class="overlay-screen"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div class="overlay-card">
        <div class="overlay-header">
          <h2>Add tracker</h2>
          <button class="ghost icon-btn" type="button" title="Close" aria-label="Close" onClick={onClose}>
            <IconClose />
          </button>
        </div>

        <form class="create-form" onSubmit={handleSubmit}>
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
              onFocus={scrollFieldIntoView}
              placeholder="What do you want to track?"
            />
            {trackerNameError && <span class="field-error">{trackerNameError}</span>}
          </label>

          <label>
            <span>Type</span>
            <select value={trackerType} onChange={(event) => setTrackerType(event.currentTarget.value)}>
              {TRACKER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Unit</span>
            <select value={trackerUnit} onChange={(event) => setTrackerUnit(event.currentTarget.value)}>
              {TRACKER_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>

          <div class="form-actions">
            <button class="primary" type="button" onClick={handleSubmit}>
              Create tracker
            </button>
            <button class="ghost" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
