import { IconX } from '../icons'

export default function ItemList({ items, onOpen, onRemove }) {
  return (
    <div class="item-list">
      {items.length === 0 ? (
        <p class="empty-state">No tracked items yet. Tap the center plus to create one.</p>
      ) : (
        items.map((item) => (
          <article
            class="item-row"
            key={item.id}
            role="button"
            tabIndex={0}
            title={`Open ${item.name}`}
            onClick={() => onOpen(item.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onOpen(item.id)
              }
            }}
          >
            <div>
              <div class="item-name">{item.name}</div>
              <div class="item-meta">
                {item.count} {item.unit}
              </div>
            </div>
            <div class="row-actions">
              <button
                class="danger icon-btn"
                type="button"
                title={`Remove ${item.name}`}
                aria-label={`Remove ${item.name}`}
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove(item.id)
                }}
              >
                <IconX />
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  )
}
