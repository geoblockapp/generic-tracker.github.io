export default function ThemeSwitch({ theme, onToggle }) {
  return (
    <button
      class="theme-switch"
      type="button"
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      onClick={onToggle}
    >
      <span class="theme-switch-icon sun" aria-hidden="true">☀️</span>
      <span class="theme-switch-icon moon" aria-hidden="true">🌙</span>
      <span class="theme-switch-thumb" aria-hidden="true">
        {theme === 'light' ? '☀️' : '🌙'}
      </span>
    </button>
  )
}
