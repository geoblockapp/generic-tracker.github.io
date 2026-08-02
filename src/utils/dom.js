export function scrollFieldIntoView(event) {
  const field = event.currentTarget
  window.setTimeout(() => {
    field.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, 150)
}
