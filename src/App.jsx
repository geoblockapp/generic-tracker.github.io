import { useEffect, useMemo, useState } from 'preact/hooks'

const STORAGE_KEY = 'generic-tracker-items'

function readStoredItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function App() {
  const [items, setItems] = useState(() => readStoredItems())
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [category, setCategory] = useState('General')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items],
  )

  function addItem(event) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    setItems((current) => [
      {
        id: crypto.randomUUID(),
        name: trimmedName,
        quantity: Number(quantity) || 1,
        category,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])

    setName('')
    setQuantity(1)
    setCategory('General')
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id))
  }

  function clearAll() {
    setItems([])
  }

  return (
    <main class="app-shell">
      <section class="card">
        <p class="eyebrow">Local-first tracker</p>
        <h1>Generic Tracker</h1>
        <p class="subtitle">
          Track simple items locally in the browser, with data saved automatically for the next visit.
        </p>

        <div class="stats-row">
          <div>
            <span class="stat-label">Entries</span>
            <strong>{items.length}</strong>
          </div>
          <div>
            <span class="stat-label">Total</span>
            <strong>{totalCount}</strong>
          </div>
        </div>

        <form class="tracker-form" onSubmit={addItem}>
          <label>
            <span>Item</span>
            <input value={name} onInput={(event) => setName(event.currentTarget.value)} placeholder="e.g. Light bulbs" />
          </label>

          <label>
            <span>Qty</span>
            <input
              type="number"
              min="1"
              value={quantity}
              onInput={(event) => setQuantity(event.currentTarget.value)}
            />
          </label>

          <label>
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.currentTarget.value)}>
              <option>General</option>
              <option>Home</option>
              <option>Office</option>
              <option>Tools</option>
            </select>
          </label>

          <button class="primary" type="submit">Track item</button>
        </form>

        <div class="list-header">
          <h2>Tracked items</h2>
          <button class="ghost" type="button" onClick={clearAll}>
            Clear all
          </button>
        </div>

        <div class="item-list">
          {items.length === 0 ? (
            <p class="empty-state">No tracked items yet. Add your first one above.</p>
          ) : (
            items.map((item) => (
              <article class="item-row" key={item.id}>
                <div>
                  <div class="item-name">{item.name}</div>
                  <div class="item-meta">
                    {item.quantity} · {item.category}
                  </div>
                </div>
                <button class="danger" type="button" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
