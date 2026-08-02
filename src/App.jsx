import { useState } from 'preact/hooks'
import useTrackers from './hooks/useTrackers'
import useTheme from './hooks/useTheme'
import ThemeSwitch from './components/ThemeSwitch'
import Dial from './components/Dial'
import ItemList from './components/ItemList'
import CreateTrackerDialog from './components/CreateTrackerDialog'
import TrackerDetailDialog from './components/TrackerDetailDialog'
import { IconDownload, IconUpload, IconTrash } from './icons'

export default function App() {
  const trackers = useTrackers()
  const [theme, toggleTheme] = useTheme()
  const [showCreateScreen, setShowCreateScreen] = useState(false)
  const [showTrackerScreen, setShowTrackerScreen] = useState(false)
  const [activeTrackerId, setActiveTrackerId] = useState(null)

  const activeTracker = trackers.items.find((item) => item.id === activeTrackerId) || null
  const totalCount = trackers.items.reduce((sum, item) => sum + Number(item.count || 0), 0)

  function openTracker(id) {
    setActiveTrackerId(id)
    setShowTrackerScreen(true)
  }

  function handleRemove(id) {
    trackers.removeItem(id)
    if (activeTrackerId === id) {
      setShowTrackerScreen(false)
      setActiveTrackerId(null)
    }
  }

  function handleClearAll() {
    trackers.clearAll()
    setShowTrackerScreen(false)
    setActiveTrackerId(null)
  }

  async function handleImportChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const success = await trackers.importData(file)
    if (success) {
      setShowTrackerScreen(false)
      setActiveTrackerId(null)
    }
  }

  return (
    <main class="app-shell">
      <div class="top-theme-row">
        <ThemeSwitch theme={theme} onToggle={toggleTheme} />
      </div>

      <section class="card">
        <p class="eyebrow">Local-first tracker</p>
        <h1>Generic Tracker</h1>
        <p class="subtitle">
          Touch the wheel, rotate, and release on a slice to open a tracker. Use the plus to create a new one.
        </p>

        <div class="stats-row">
          <div>
            <span class="stat-label">Trackers</span>
            <strong>{trackers.items.length}</strong>
          </div>
          <div>
            <span class="stat-label">Total</span>
            <strong>{totalCount}</strong>
          </div>
        </div>

        <Dial items={trackers.items} onSelectTracker={openTracker} onCreateNew={() => setShowCreateScreen(true)} />

        <div class="list-header">
          <h2>Tracked items</h2>
          <div class="row-actions">
            <button
              class="ghost icon-btn"
              type="button"
              onClick={trackers.exportData}
              title="Export data"
              aria-label="Export data"
            >
              <IconDownload />
            </button>
            <label class="ghost icon-btn import-label" title="Import data" aria-label="Import data">
              <input type="file" accept="application/json" onChange={handleImportChange} />
              <IconUpload />
            </label>
            <button
              class="ghost icon-btn"
              type="button"
              onClick={handleClearAll}
              title="Clear all trackers"
              aria-label="Clear all trackers"
            >
              <IconTrash />
            </button>
          </div>
        </div>

        <ItemList items={trackers.items} onOpen={openTracker} onRemove={handleRemove} />
      </section>

      {showCreateScreen && (
        <CreateTrackerDialog
          onClose={() => setShowCreateScreen(false)}
          onCreate={(fields) => {
            trackers.addTracker(fields)
            setShowCreateScreen(false)
          }}
        />
      )}

      {showTrackerScreen && activeTracker && (
        <TrackerDetailDialog
          tracker={activeTracker}
          onClose={() => setShowTrackerScreen(false)}
          onAddEntry={(fields) => trackers.addEntry(activeTracker.id, fields)}
          onToggleEntryCompletion={(entryId) => trackers.toggleEntryCompletion(activeTracker.id, entryId)}
        />
      )}
    </main>
  )
}
