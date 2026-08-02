import { useEffect, useState } from 'preact/hooks'

const STORAGE_KEY = 'generic-tracker-items'
const TRACKER_COLORS = ['#2563eb', '#8b5cf6', '#0f766e', '#ea580c', '#db2777', '#0891b2']

function readStoredItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function useTrackers() {
  const [items, setItems] = useState(() => readStoredItems())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addTracker({ name, type, unit }) {
    const newTracker = {
      id: crypto.randomUUID(),
      name,
      type,
      unit,
      count: 0,
      color: TRACKER_COLORS[items.length % TRACKER_COLORS.length],
      createdAt: new Date().toISOString(),
      entries: [],
    }

    setItems((current) => [newTracker, ...current])
  }

  function addEntry(trackerId, { quantity, note }) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== trackerId) return item

        const entry = {
          id: crypto.randomUUID(),
          quantity: item.type === 'numeric' ? quantity : 1,
          note,
          createdAt: new Date().toISOString(),
          completed: false,
          type: item.type,
        }

        return {
          ...item,
          count: item.type === 'numeric' ? Number(item.count || 0) + quantity : Number(item.count || 0) + 1,
          entries: [entry, ...(item.entries || [])],
        }
      }),
    )
  }

  function toggleEntryCompletion(trackerId, entryId) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== trackerId) return item

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
  }

  function clearAll() {
    setItems([])
  }

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      items,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'generic-tracker-export.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function importData(file) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result || '{}'))
          const importedItems = Array.isArray(parsed.items) ? parsed.items : []
          if (importedItems.length === 0) {
            resolve(false)
            return
          }

          setItems(importedItems)
          resolve(true)
        } catch {
          resolve(false)
        }
      }
      reader.onerror = () => resolve(false)
      reader.readAsText(file)
    })
  }

  return { items, addTracker, addEntry, toggleEntryCompletion, removeItem, clearAll, exportData, importData }
}
